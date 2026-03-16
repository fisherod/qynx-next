// =================================
// 💳 Payment Creation API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { z } from "zod";
import { getDatabase } from "@/lib/api";
import { authOptions } from "@/lib/auth";

// Validation schema
const createPaymentSchema = z.object({
  user_id: z.string().min(1).max(100),
  currency: z.string().min(1).max(20),
  amount: z.number().min(0.0001).max(10000)
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate request data
    const validationResult = createPaymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate payment ID and expiration
    const paymentId = uuidv4();
    const expiryMinutes = Number(process.env.PAYMENT_EXPIRY_MINUTES) || 30;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Create payment in database
    const db = getDatabase();
    const payment = await db.createPayment({
      ...data,
      user_id: session.user.id,
      currency: data.currency.toLowerCase(),
      payment_id: paymentId,
      expires_at: expiresAt
    });

    // Get base URL from environment configuration
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const paymentUrl = `${baseUrl}/pay/${paymentId}`;

    // Generate QR code for mobile
    let qrCode: string | undefined;
    try {
      qrCode = await QRCode.toDataURL(paymentUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        },
        width: 256
      });
    } catch (qrError) {
      console.error("QR code generation failed:", qrError);
      // Continue without QR code
    }

    return NextResponse.json({
      payment_id: paymentId,
      payment_url: paymentUrl,
      base_url: baseUrl,
      qr_code: qrCode,
      expires_at: expiresAt.toISOString(),
      amount: data.amount
    });
  } catch (error: any) {
    console.error("Payment creation error:", error);

    return NextResponse.json(
      {
        error: "Failed to create payment",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Health check for payment creation endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: "payment/create",
    status: "operational",
    timestamp: new Date().toISOString()
  });
}
