import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain";
import { getDatabase } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { chain, currency, userAddress, amount, paymentId } = await request.json();

    // Validate required fields
    if (!chain || !currency || !userAddress || !amount || !paymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Execute auto-transfer
    const result = await blockchainService.executeAutoTransfer(chain, currency, userAddress, amount, paymentId);

    if (result.success) {
      // Update payment status in database
      try {
        const db = getDatabase();
        await db.updatePaymentStatus(paymentId, "completed", {
          wallet_address: userAddress,
          tx_hash: result.txHash
        });
      } catch (dbError: any) {
        // Silent error handling for production
      }

      return NextResponse.json({
        success: true,
        message: "Auto-transfer completed successfully",
        txHash: result.txHash
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Auto-transfer failed",
          paymentStatus: "failed"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Silent error handling for production
    return NextResponse.json({ error: "Auto-transfer failed" }, { status: 500 });
  }
}
