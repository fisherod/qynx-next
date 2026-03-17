// =================================
// 💰 Admin Wallet Balances API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { logger } from "../../../../lib/logger";
import { blockchainService } from "@/lib/blockchain";
import { ChainType, CurrencyType } from "@/types";

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

    // Get real USDT balances from blockchain (sequential for clear logging)
    console.log(`🔄 Fetching balances for ${wallets.length} wallets...`);
    const walletsWithBalances = [];

    for (const wallet of wallets) {
      try {
        console.log(`📊 Processing ${wallet.chain} wallet: ${wallet.address}`);
        const balance = await blockchainService.getTokenBalance(
          wallet.chain as ChainType,
          wallet.currency as CurrencyType,
          wallet.address
        );

        walletsWithBalances.push({
          ...wallet,
          balance
        });
      } catch (error) {
        logger.error(`Failed to get balance for ${wallet.address}:`, error);
        walletsWithBalances.push({
          ...wallet,
          balance: "0.00"
        });
      }
    }

    logger.info(`Successfully processed ${walletsWithBalances.length} wallets`);

    return NextResponse.json(
      {
        balances: walletsWithBalances,
        timestamp: new Date().toISOString(),
        totalWallets: walletsWithBalances.length
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
