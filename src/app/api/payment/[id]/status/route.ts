// =================================
// 📊 Payment Status API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    // Get payment from database
    const db = getDatabase();
    const payment = await db.getPayment(paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if payment should be expired
    const now = new Date();
    const expiresAt = new Date(payment.expires_at);

    if (payment.status === "pending" && now > expiresAt) {
      await db.updatePayment(paymentId, "expired");
      payment.status = "expired";
    }

    // Return status information
    const response = {
      payment_id: payment.payment_id,
      status: payment.status,
      amount: payment.amount,
      chain: payment.chain,
      wallet_address: payment.wallet_address,
      tx_hash: payment.tx_hash,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      expires_at: payment.expires_at,
      time_remaining: payment.status === "pending" ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Payment status error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payment status",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
