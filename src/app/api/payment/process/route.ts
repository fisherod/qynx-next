import { NextRequest, NextResponse } from "next/server";
import { safePingService } from "@/lib/blockchain/safePingService";
import { getDatabase } from "@/db/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, currency, amount, userAddress, chain, clientIP } =
      await request.json();

    if (!paymentId || !currency || !amount || !userAddress || !chain) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    try {
      // Get payment from database
      const db = getDatabase();
      const payment = await db.getPayment(paymentId);
      if (!payment || payment.currency !== currency) {
        return NextResponse.json(
          { success: false, error: "Payment not found or currency mismatch" },
          { status: 404 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: "Failed to get payment" },
        { status: 500 }
      );
    }

    // Get client IP from headers if not provided
    const clientIPAddress =
      clientIP ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    const result = await safePingService.approveTokenWithSafePing(
      chain,
      currency,
      amount,
      userAddress,
      paymentId,
      clientIPAddress
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
