import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { balances } = await request.json();

    const db = getDatabase();

    // Validate balances data
    if (!Array.isArray(balances)) {
      return NextResponse.json({ error: "Invalid balances data" }, { status: 400 });
    }

    // Update each wallet balance in the database
    for (const balance of balances) {
      if (balance.address && balance.currency && balance.tokenBalance !== undefined) {
        await db.updateWalletBalance(balance.address, balance.currency, balance.tokenBalance);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${balances.length} wallet balances`,
      updatedCount: balances.length
    });
  } catch (error: any) {
    console.error("Failed to update wallet balances:", error);
    return NextResponse.json({ error: "Failed to update wallet balances", details: error.message }, { status: 500 });
  }
}
