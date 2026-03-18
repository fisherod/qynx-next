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
    const { ObjectId } = await import("mongodb");

    const userDoc = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          referralCode: 1
        }
      }
    );

    const referralCode = (userDoc as any)?.referralCode || userId.slice(-5);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const referralUrl = `${baseUrl}/sign-up?ref=${encodeURIComponent(referralCode)}`;

    return NextResponse.json(
      {
        referralCode,
        referralUrl
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching referral info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
