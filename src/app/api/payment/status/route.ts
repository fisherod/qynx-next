import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payment_id = searchParams.get("payment_id");

    // Validate input
    if (!payment_id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get database connection
    const db = getDatabase();

    // Check payment status
    const payment = await db.getPayment(payment_id);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        tx_hash: payment.tx_hash,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        expires_at: payment.expires_at,
      },
    });
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
