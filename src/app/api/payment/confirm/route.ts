import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { payment_id } = await request.json();

    // Validate input
    if (!payment_id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    // Get database connection
    const db = getDatabase();

    // Check payment status
    const payment = await db.getPayment(payment_id);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if payment is confirmed/completed
    if (payment.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
        payment: {
          payment_id: payment.payment_id,
          amount: payment.amount,
          status: payment.status,
          tx_hash: payment.tx_hash,
          created_at: payment.created_at
        }
      });
    }

    // If payment is still pending or processing
    if (payment.status === "pending" || payment.status === "processing") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment is still being processed",
          status: payment.status
        },
        { status: 202 } // 202 Accepted - processing
      );
    }

    // If payment failed or expired
    if (payment.status === "failed" || payment.status === "expired") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment ${payment.status}`,
          status: payment.status
        },
        { status: 400 }
      );
    }

    // Unknown status
    return NextResponse.json(
      {
        success: false,
        error: "Unknown payment status",
        status: payment.status
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
