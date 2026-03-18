import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");

    if (!chain) {
      return NextResponse.json({ error: "Chain is required" }, { status: 400 });
    }

    const db = getDatabase();
    const wallet = await db.getTreasuryWallet(chain);

    if (!wallet || !wallet.address) {
      return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 404 });
    }

    return NextResponse.json({
      chain: wallet.chain,
      address: wallet.address,
      name: wallet.name ?? null,
      is_active: wallet.is_active ?? true
    });
  } catch (error: any) {
    console.error("Error fetching treasury wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
