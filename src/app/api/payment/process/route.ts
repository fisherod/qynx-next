import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain/blockchainService";
import { getDatabase } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, currency, userAddress, chain, txHash } = await request.json();

    if (!paymentId || !currency || !userAddress || !chain) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    let payment;
    try {
      // Get payment from database
      const db = getDatabase();
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

    const result = await blockchainService.confirmApproval(
      chain,
      currency,
      payment.amount.toString(),
      userAddress,
      paymentId,
      txHash,
      clientIP
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
