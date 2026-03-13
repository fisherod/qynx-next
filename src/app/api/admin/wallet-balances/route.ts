// =================================
// 💰 Admin Wallet Balances API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getWalletBalances } from "../../../../lib/database";
import { logger } from "../../../../lib/logger";
import { EVMService, safePingService, TronService } from "@/lib/blockchain";
import { ChainType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Check authentication using query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const password = searchParams.get("password");

    // Check credentials against environment variables
    if (
      !username ||
      !password ||
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Fetching wallet balances");

    // Get basic wallet info from database
    const wallets = await getWalletBalances();

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({
        balances: [],
        timestamp: new Date().toISOString(),
        totalWallets: 0,
        message: "No wallets found",
      });
    }

    // Get real USDT balances from blockchain (sequential for clear logging)
    console.log(`🔄 Fetching balances for ${wallets.length} wallets...`);
    const walletsWithBalances = [];

    for (const wallet of wallets) {
      try {
        console.log(`📊 Processing ${wallet.chain} wallet: ${wallet.address}`);
        let realUsdtBalance = await safePingService.getUserUSDTBalance(
          wallet.chain as ChainType,
          wallet.address
        );

        walletsWithBalances.push({
          address: wallet.address,
          chain: wallet.chain,
          amount: wallet.amount,
          usdtBalance: wallet.usdtBalance,
          realUsdtBalance,
          paymentCount: wallet.paymentCount,
          lastActivity: wallet.lastActivity,
        });

        console.log(
          `✅ Completed ${wallet.chain} wallet: ${realUsdtBalance} USDT`
        );
      } catch (error) {
        logger.error(`Failed to get balance for ${wallet.address}:`, error);
        walletsWithBalances.push({
          address: wallet.address,
          chain: wallet.chain,
          amount: wallet.amount,
          usdtBalance: wallet.usdtBalance,
          realUsdtBalance: "0.00",
          paymentCount: wallet.paymentCount,
          lastActivity: wallet.lastActivity,
          error: "Failed to fetch balance",
        });
        console.log(`❌ Failed ${wallet.chain} wallet: ${wallet.address}`);
      }
    }

    logger.info(`Successfully processed ${walletsWithBalances.length} wallets`);

    return NextResponse.json(
      {
        balances: walletsWithBalances,
        timestamp: new Date().toISOString(),
        totalWallets: walletsWithBalances.length,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    logger.error("Failed to get wallet balances:", error);
    return NextResponse.json(
      {
        error: "Failed to get wallet balances",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
