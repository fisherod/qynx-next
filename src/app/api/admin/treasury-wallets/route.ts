import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { blockchainService } from "@/lib/blockchain";
import { getBitcoinAddressBalanceSats, satsToBtc } from "@/lib/bitcoin";

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    // Get treasury wallets from database
    const treasuryWallets = await db.getTreasuryWallets();

    const enrichedWallets = await Promise.all(
      treasuryWallets.map(async wallet => {
        if (wallet.chain === "btc") {
          const btcBalanceSats = await getBitcoinAddressBalanceSats(wallet.address);
          return {
            ...wallet,
            balances: {
              native: satsToBtc(btcBalanceSats)
            }
          };
        }

        const balanceData = await blockchainService.getNativeAndTokenBalances([
          {
            chain: wallet.chain,
            address: wallet.address
          }
        ]);

        return {
          ...wallet,
          balances: balanceData[0]?.balances || { native: "0.000000" }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedWallets,
      message: "Treasury wallets fetched successfully"
    });
  } catch (error: any) {
    console.error("Error fetching treasury wallets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, address, name, description } = body;

    if (!chain || !address) {
      return NextResponse.json({ error: "Chain and address are required" }, { status: 400 });
    }

    const db = getDatabase();

    // Save or update treasury wallet
    const result = await db.saveTreasuryWallet(chain, address, name, description);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Treasury wallet saved successfully"
    });
  } catch (error: any) {
    console.error("Error saving treasury wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Treasury wallet ID is required" }, { status: 400 });
    }

    const db = getDatabase();

    // Update treasury wallet
    const result = await db.updateTreasuryWallet(id, isActive);
    if (!result) {
      return NextResponse.json({ error: "Treasury wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Treasury wallet updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating treasury wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Treasury wallet ID is required" }, { status: 400 });
    }

    const db = getDatabase();

    // Delete treasury wallet
    await db.deleteTreasuryWallet(id);

    return NextResponse.json({
      success: true,
      message: "Treasury wallet deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting treasury wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Options for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
