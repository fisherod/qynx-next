// =================================
// 🔄 Webhook API Routes
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/db/mongodb";
import axios from "axios";

// Test webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const { webhook_url } = await request.json();

    if (!webhook_url) {
      return NextResponse.json(
        { error: "Webhook URL is required", error_cn: "需要webhook URL" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(webhook_url);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook URL", error_cn: "无效的webhook URL" },
        { status: 400 }
      );
    }

    // Send test webhook
    const testPayload = {
      event: "test",
      payment_id: "test-payment-id",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook",
        message_cn: "这是一个测试webhook",
      },
    };

    try {
      const response = await axios.post(webhook_url, testPayload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CryptoPaymentPlatform/1.0",
        },
      });

      return NextResponse.json({ success: true, message: "Webhook test sent" });
    } catch (error: any) {
      // Silent error handling for production
      return NextResponse.json(
        { error: "Failed to send webhook test" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Silent error handling for production
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get webhook logs endpoint
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("action") === "logs") {
      const logs = await getWebhookLogs();
      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    // Silent error handling for production
    return NextResponse.json(
      { error: "Failed to get webhook logs" },
      { status: 500 }
    );
  }
}

// Helper function to get webhook logs
async function getWebhookLogs() {
  const db = getDatabase();
  // Get all webhook logs (passing empty string to get all logs)
  const logs = await db.getWebhookLogs("");
  return logs;
}
