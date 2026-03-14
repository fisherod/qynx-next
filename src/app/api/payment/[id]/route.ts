// =================================
// 📄 Payment Details API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/db/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment from database
    const db = getDatabase();
    const payment = await db.getPayment(paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if payment is expired
    const now = new Date();
    const expiresAt = new Date(payment.expires_at);

    if (payment.status === "pending" && now > expiresAt) {
      // Mark as expired
      await db.updatePaymentStatus(paymentId, "expired");
      payment.status = "expired";
    }

    const response = {
      payment_id: payment.payment_id,
      user_id: payment.user_id,
      currency: payment.currency,
      amount: payment.amount,
      chain: payment.chain,
      status: payment.status,
      tx_hash: payment.tx_hash,
      created_at: payment.created_at,
      expires_at: payment.expires_at,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Payment fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payment",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
