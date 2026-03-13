import { NextRequest, NextResponse } from "next/server";
import { rateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import { ethers } from "ethers";
import { TronService } from "@/lib/blockchain/tronService";

// Helper function to check authentication
function checkAuth(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const password = searchParams.get("password");

  if (
    !username ||
    !password ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    // Check authentication
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses: { [key: string]: string } = {};
    const warnings: string[] = [];

    // Derive EVM addresses from PRIVATE_KEY
    if (process.env.NEXT_PUBLIC_PRIVATE_KEY) {
      try {
        const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY);
        addresses.ethereum = wallet.address;
        addresses.bsc = wallet.address;
        console.log("✅ EVM addresses derived successfully");
      } catch (error) {
        console.error("Error deriving EVM addresses:", error);
        warnings.push("Failed to derive EVM addresses from PRIVATE_KEY");
      }
    } else {
      warnings.push(
        "PRIVATE_KEY environment variable not set - EVM addresses unavailable"
      );
      addresses.ethereum = "NOT_CONFIGURED";
      addresses.bsc = "NOT_CONFIGURED";
    }

    // Derive TRON address from TRON_PRIVATE_KEY
    if (process.env.NEXT_PUBLIC_TRON_PRIVATE_KEY) {
      try {
        const tronAddress = await TronService.getAddressFromPrivateKey(
          process.env.NEXT_PUBLIC_TRON_PRIVATE_KEY
        );
        addresses.tron = tronAddress;
        console.log("✅ TRON address derived successfully:", tronAddress);
      } catch (error) {
        console.error("Error deriving TRON address:", error);
        warnings.push("Failed to derive TRON address from TRON_PRIVATE_KEY");
        addresses.tron = "ERROR_DERIVING_ADDRESS";
      }
    } else {
      addresses.tron = "NOT_CONFIGURED";
      warnings.push(
        "NEXT_PUBLIC_TRON_PRIVATE_KEY environment variable not set - TRON address unavailable"
      );
    }

    return NextResponse.json({
      success: true,
      data: addresses,
      message: "Owner addresses fetched successfully",
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error("Error fetching owner addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
