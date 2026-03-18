// =================================
// 💰 Admin Wallet Balances API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    logger.info("Fetching wallet balances");

    const db = getDatabase();

    // Get basic wallet info from database
    const wallets = await db.getWalletBalances();

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({
        balances: [],
        timestamp: new Date().toISOString(),
        totalWallets: 0,
        message: "No wallets found"
      });
    }

    logger.info(`Successfully processed ${wallets.length} wallets`);

    return NextResponse.json(
      {
        balances: wallets,
        timestamp: new Date().toISOString(),
        totalWallets: wallets.length
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      }
    );
  } catch (error) {
    logger.error("Failed to get wallet balances:", error);
    return NextResponse.json(
      {
        error: "Failed to get wallet balances",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Options for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
