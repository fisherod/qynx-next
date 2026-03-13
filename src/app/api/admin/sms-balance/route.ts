// =================================
// 📱 SMS API Balance Route
// =================================

import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: "Unauthorized", error_cn: "未授权" },
        { status: 401 }
      );
    }

    // Fetch SMS API balance from server-side to avoid CORS issues
    const smsApiKey =
      process.env.SMS_ACTIVATE_API_KEY || "36d05ff0d4de2647AbAb4fdd4330b577";
    const response = await fetch(
      `https://api.sms-activate.io/stubs/handler_api.php?api_key=${smsApiKey}&action=getBalance`
    );

    if (!response.ok) {
      throw new Error(`SMS API request failed: ${response.status}`);
    }

    const text = await response.text();

    // Parse the response format: ACCESS_BALANCE:5.4213
    const match = text.match(/ACCESS_BALANCE:(\d+\.?\d*)/);
    if (match) {
      const balance = parseFloat(match[1]);
      return NextResponse.json({
        success: true,
        balance: balance,
        rawResponse: text,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse SMS API response",
          error_cn: "解析SMS API响应失败",
          rawResponse: text,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("SMS API balance fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch SMS API balance",
        error_cn: "获取SMS API余额失败",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
