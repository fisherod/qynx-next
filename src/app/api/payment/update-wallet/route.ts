// =================================
// 💰 Payment Wallet Update API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/db/mongodb";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, chain, amount, usdtBalance, isNewPayment = false } = body;

    // Validate required fields
    if (!address || !chain) {
      return NextResponse.json(
        { error: "Missing required fields: address and chain" },
        { status: 400 }
      );
    }

    // Get database instance (server-side only)
    const db = getDatabase();
    await db.ensureInitialized();

    // Add wallet (no need to check if it exists)
    await db.saveWallet({
      address,
      chain,
      usdtBalance: usdtBalance || "0.00",
      amount: amount || "0.00",
    });

    logger.info(`Wallet added: ${address} on ${chain}`);

    return NextResponse.json({
      success: true,
      message: "Wallet added successfully",
      data: { address, chain, usdtBalance },
    });
  } catch (error: any) {
    logger.error("Error updating wallet:", error);
    return NextResponse.json(
      { error: "Failed to update wallet", details: error.message },
      { status: 500 }
    );
  }
}
