import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);
    }

    const db = getDatabase();
    const expiredCount = await db.markExpiredPayments();

    return NextResponse.json({
      success: true,
      message: `Marked ${expiredCount} payments as expired`,
      expiredCount
    });
  } catch (error: any) {
    console.error("Mark expired error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Options for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
