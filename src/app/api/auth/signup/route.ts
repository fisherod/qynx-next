/**
 * POST /api/auth/signup – register with email + password.
 * Creates user in MongoDB with hashed password.
 */
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { findUserByEmail, createUser } from "@/lib/db/auth";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const emailTrim = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailTrim)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(emailTrim);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    await createUser({
      email: emailTrim,
      name: name?.trim() || null,
      passwordHash,
      role: "user"
    });

    return NextResponse.json({
      success: true,
      message: "Account created. You can sign in now."
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error?.message ?? "Registration failed" }, { status: 500 });
  }
}
