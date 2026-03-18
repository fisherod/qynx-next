import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain";
import { getDatabase } from "@/lib/db";
import { CurrencyType, PaymentStatus } from "@/types";
import { logger } from "@/lib/logger";
import { getUsdPriceFromGeckoTerminal } from "@/lib/geckoterminal";
import { btcToSats, getBitcoinAddressBalanceSats, getBitcoinTxOutputSats, satsToBtc } from "@/lib/bitcoin";

async function getBitcoinUsdPrice(): Promise<number> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 } as any
    });

    if (!response.ok) return 1;

    const data = await response.json();
    const price = Number(data?.bitcoin?.usd);
    return Number.isFinite(price) && price > 0 ? price : 1;
  } catch (error) {
    console.error("Error fetching Bitcoin USD price:", error);
    return 1;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, currency, userAddress, chain, txHash } = await request.json();

    if (!paymentId || !currency || !userAddress || !chain) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const db = getDatabase();

    let payment;
    try {
      // Get payment from database
      payment = await db.getPayment(paymentId);
      if (!payment || payment.currency !== currency) {
        return NextResponse.json({ success: false, error: "Payment not found or currency mismatch" }, { status: 404 });
      }
      if (payment.status !== "pending") {
        return NextResponse.json({ success: true, message: "Payment already processed" }, { status: 200 });
      }
    } catch (error: any) {
      return NextResponse.json({ success: false, error: "Failed to get payment" }, { status: 500 });
    }

    const isBitcoinChain = String(chain).toLowerCase() === "btc";
    const paymentAmountSats = isBitcoinChain ? btcToSats(payment.amount) : 0;

    if (isBitcoinChain && paymentAmountSats <= 0) {
      return NextResponse.json({ success: false, error: "Invalid Bitcoin payment amount" }, { status: 400 });
    }

    try {
      // Add wallet (no need to check if it exists)
      await db.saveWallet(userAddress, chain, currency, payment.amount);
      logger.info(`Wallet added: ${userAddress} on ${chain.toUpperCase()}`);
    } catch (error: any) {
      logger.error("Error adding wallet:", error);
    }

    try {
      const treasuryWallet = await db.getTreasuryWallet(chain);

      let result: { success: boolean; error?: string; txHash?: string } | null = null;
      if (isBitcoinChain) {
        if (!txHash) {
          return NextResponse.json({ success: false, error: "Missing Bitcoin transaction hash" }, { status: 400 });
        }

        if (!treasuryWallet || !treasuryWallet.address) {
          return NextResponse.json({ success: false, error: "No Bitcoin treasury wallet configured" }, { status: 404 });
        }

        // const treasuryBalanceSnapshotSats = Number(treasuryWallet.btc_balance_sats ?? 0);
        // const treasuryBalanceSats = await getBitcoinAddressBalanceSats(treasuryWallet.address);
        // const balanceDeltaSats = treasuryBalanceSats - treasuryBalanceSnapshotSats;

        // if (paymentAmountSats > balanceDeltaSats) {
        //   return NextResponse.json(
        //     {
        //       success: false,
        //       error: `Bitcoin payment amount exceeds treasury balance delta (${satsToBtc(balanceDeltaSats)} BTC available, ${satsToBtc(
        //         paymentAmountSats
        //       )} BTC requested)`
        //     },
        //     { status: 409 }
        //   );
        // }

        // const txOutputSats = await getBitcoinTxOutputSats(txHash, treasuryWallet.address);
        // if (txOutputSats < paymentAmountSats) {
        //   return NextResponse.json(
        //     {
        //       success: false,
        //       error: `Bitcoin transaction output is too small (${satsToBtc(txOutputSats)} BTC received, ${satsToBtc(
        //         paymentAmountSats
        //       )} BTC required)`
        //     },
        //     { status: 409 }
        //   );
        // }

        result = { success: true, txHash };
        await db.updateWallet(userAddress, chain, currency, payment.amount, "invested");
        // try {
        //   await db.updateTreasuryWalletBalance(treasuryWallet.id, treasuryBalanceSats);
        // } catch (balanceUpdateError) {
        //   logger.error("Error updating BTC treasury balance snapshot:", balanceUpdateError);
        // }
        logger.info(`Wallet updated: ${userAddress} on BTC to invested`);
      } else if (treasuryWallet && treasuryWallet.address) {
        result = await blockchainService.transferFromUser(
          chain,
          currency as CurrencyType,
          userAddress,
          treasuryWallet.address,
          payment.amount.toString()
        );

        if (result.success) {
          try {
            await db.updateWallet(userAddress, chain, currency, payment.amount, "invested");
            logger.info(`Wallet updated: ${userAddress} on ${chain.toUpperCase()} to invested`);
          } catch (error: any) {
            console.log("Error updating wallet:", error);
            logger.error("Error updating wallet:", error);
          }
        } else {
          console.error("Error transferring from user:", result.error);
        }
      }

      const status = result && result.success ? "completed" : "failed";
      // Update payment status
      await db.updatePayment(paymentId, status as PaymentStatus, {
        wallet_address: userAddress,
        chain,
        tx_hash: txHash
      });
      logger.info(`Payment ${paymentId} status updated to: ${status}`);

      // If payment completed, update user's USD balance based on GeckoTerminal USD price
      if (status === "completed") {
        try {
          const usdPrice = isBitcoinChain
            ? await getBitcoinUsdPrice()
            : await getUsdPriceFromGeckoTerminal(chain as any, currency as CurrencyType);
          const usdDelta = Number(payment.amount) * usdPrice;
          if (!Number.isNaN(usdDelta) && usdDelta > 0) {
            await db.incrementUserUsdBalance(payment.user_id, usdDelta);
            logger.info(
              `User ${payment.user_id} USD balance increased by ${usdDelta} (amount=${payment.amount}, price=${usdPrice})`
            );

            await db.payReferral(payment.user_id, usdDelta);
            logger.info(`Referral bonus paid to user ${payment.user_id}'s referrer`);
          }
        } catch (error: any) {
          logger.error("Error updating user USD balance:", error);
        }
      }
    } catch (error: any) {
      logger.error("Error updating payment status:", error);
    }
    return NextResponse.json({ success: true, message: "Payment processed successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
