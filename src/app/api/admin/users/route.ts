import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// GET /api/admin/users - list users with balances and profit
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .project({
        email: 1,
        name: 1,
        usdBalance: 1,
        profit: 1
      })
      .toArray();

    const users = docs.map((u: any) => ({
      id: u._id?.toString(),
      email: u.email,
      name: u.name ?? "",
      usdBalance: typeof u.usdBalance === "number" ? u.usdBalance : 0,
      profit: typeof u.profit === "number" ? u.profit : 0
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/users - update single user's usdBalance and profit
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, usdBalance, profit } = body as {
      id?: string;
      usdBalance?: number;
      profit?: number;
    };

    if (!id) {
      return NextResponse.json({ success: false, error: "User id is required" }, { status: 400 });
    }

    const db = await getDb();

    const update: any = {};
    if (typeof usdBalance === "number" && !Number.isNaN(usdBalance)) {
      update.usdBalance = usdBalance;
    }
    if (typeof profit === "number" && !Number.isNaN(profit)) {
      update.profit = profit;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const { ObjectId } = await import("mongodb");

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - bulk actions (reset profits)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "resetProfits") {
      const db = await getDb();
      await db.collection("users").updateMany({}, { $set: { profit: 0, updatedAt: new Date() } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error handling users action:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
