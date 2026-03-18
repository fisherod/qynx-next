import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const db = await getDb();

    // Fetch user usdBalance and profit
    const userDoc = await db.collection("users").findOne(
      { _id: new (await import("mongodb")).ObjectId(userId) },
      {
        projection: {
          usdBalance: 1,
          profit: 1
        }
      }
    );

    const usdBalance = typeof userDoc?.usdBalance === "number" ? userDoc.usdBalance : 0;
    const profit = typeof userDoc?.profit === "number" ? userDoc.profit : 0;

    // Count completed payments for this user
    const completedCount = await db.collection("payments").countDocuments({ user_id: userId, status: "completed" });

    return NextResponse.json(
      {
        usdBalance,
        profit,
        completedPayments: completedCount
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
