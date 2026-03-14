// =================================
// 🔗 Payment Chain Update API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/db/mongodb";
import { ChainType } from "@/types";
import { z } from "zod";

// Validation schema
const updateChainSchema = z.object({
  chain: z.enum(["bsc", "ethereum", "tron"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    const body = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required", error_cn: "需要支付ID" },
        { status: 400 }
      );
    }

    // Validate request data
    const validationResult = updateChainSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          error_cn: "验证失败",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { chain } = validationResult.data;

    // Get payment from database
    const db = getDatabase();
    const payment = await db.getPayment(paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found", error_cn: "未找到支付" },
        { status: 404 }
      );
    }

    // Check if payment is still pending
    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          error: "Cannot update chain for non-pending payment",
          error_cn: "只能更新待处理支付的链",
        },
        { status: 400 }
      );
    }

    // Check if payment is expired
    const now = new Date();
    const expiresAt = new Date(payment.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: "Payment has expired",
          error_cn: "支付已过期",
        },
        { status: 400 }
      );
    }

    // Update payment chain
    await db.updatePaymentChain(paymentId, chain);

    // Get updated payment
    const updatedPayment = await db.getPayment(paymentId);

    return NextResponse.json({
      success: true,
      message: "Chain updated successfully",
      message_cn: "链更新成功",
      payment: {
        payment_id: updatedPayment!.payment_id,
        chain: updatedPayment!.chain,
        status: updatedPayment!.status,
        updated_at: updatedPayment!.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Chain update error:", error);

    return NextResponse.json(
      {
        error: "Failed to update payment chain",
        error_cn: "更新支付链失败",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
