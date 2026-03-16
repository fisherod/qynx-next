// =================================
// 📄 Admin Payment Details API Route (with events and logs)
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);
    }

    const { id: paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const db = getDatabase();

    // Get payment
    const payment = await db.getPayment(paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get payment events
    const events = await db.getPaymentEvents(paymentId);

    // Get webhook logs
    const webhookLogs = await db.getWebhookLogs(paymentId);

    return NextResponse.json({
      payment,
      events,
      webhookLogs
    });
  } catch (error: any) {
    console.error("Admin payment details API error:", error);
    return NextResponse.json(
      {
        error: "Failed to load payment details",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
