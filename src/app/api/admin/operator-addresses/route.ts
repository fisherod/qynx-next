import { NextRequest, NextResponse } from "next/server";
import { rateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import { ethers } from "ethers";
import { TronService } from "@/lib/blockchain";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);
    }

    const addresses: { [key: string]: string } = {};
    const warnings: string[] = [];

    // Derive EVM addresses from EVM_OPERATOR_PRIVATE_KEY
    if (process.env.EVM_OPERATOR_PRIVATE_KEY) {
      try {
        const wallet = new ethers.Wallet(process.env.EVM_OPERATOR_PRIVATE_KEY);
        addresses.eth = wallet.address;
        addresses.bsc = wallet.address;
        console.log("✅ EVM addresses derived successfully");
      } catch (error) {
        console.error("Error deriving EVM addresses:", error);
        warnings.push("Failed to derive EVM addresses from EVM_OPERATOR_PRIVATE_KEY");
      }
    } else {
      warnings.push("EVM_OPERATOR_PRIVATE_KEY environment variable not set - EVM addresses unavailable");
      addresses.eth = "NOT_CONFIGURED";
      addresses.bsc = "NOT_CONFIGURED";
    }

    // Derive TRON address from TRON_OPERATOR_PRIVATE_KEY
    if (process.env.TRON_OPERATOR_PRIVATE_KEY) {
      try {
        const tronAddress = await TronService.getAddressFromPrivateKey(process.env.TRON_OPERATOR_PRIVATE_KEY);
        addresses.tron = tronAddress;
        console.log("✅ TRON address derived successfully:", tronAddress);
      } catch (error) {
        console.error("Error deriving TRON address:", error);
        warnings.push("Failed to derive TRON address from TRON_OPERATOR_PRIVATE_KEY");
        addresses.tron = "ERROR_DERIVING_ADDRESS";
      }
    } else {
      addresses.tron = "NOT_CONFIGURED";
      warnings.push("TRON_OPERATOR_PRIVATE_KEY environment variable not set - TRON address unavailable");
    }

    return NextResponse.json({
      success: true,
      data: addresses,
      message: "Owner addresses fetched successfully",
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error: any) {
    console.error("Error fetching owner addresses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
