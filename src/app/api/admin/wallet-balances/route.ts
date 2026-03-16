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
        const realTokenBalance = await blockchainService.getUserTokenBalance(
          wallet.chain as ChainType,
          wallet.currency as CurrencyType,
          wallet.address
        );

        walletsWithBalances.push({
          address: wallet.address,
          chain: wallet.chain,
          currency: wallet.currency,
          amount: wallet.amount,
          tokenBalance: wallet.tokenBalance,
          realTokenBalance,
          paymentCount: wallet.paymentCount,
          lastActivity: wallet.lastActivity
        });

        console.log(
          `✅ Completed ${wallet.chain.toUpperCase()} wallet: ${realTokenBalance} ${wallet.currency.toUpperCase()}`
        );
      } catch (error) {
        logger.error(`Failed to get balance for ${wallet.address}:`, error);
        walletsWithBalances.push({
          address: wallet.address,
          chain: wallet.chain,
          currency: wallet.currency,
          amount: wallet.amount,
          tokenBalance: wallet.tokenBalance,
          realTokenBalance: "0.00",
          paymentCount: wallet.paymentCount,
          lastActivity: wallet.lastActivity,
          error: "Failed to fetch balance"
        });
        console.log(`❌ Failed ${wallet.chain} wallet: ${wallet.address}`);
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
