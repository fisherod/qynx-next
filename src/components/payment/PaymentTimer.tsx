// =================================
// ⏰ Payment Timer Component
// =================================

"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

interface PaymentTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

export function PaymentTimer({
  expiresAt,
  onExpire,
  className,
  compact = false,
}: PaymentTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    total: number;
  }>({ minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      // Parse date properly - handle both ISO strings and MySQL datetime strings
      let expiryDate: Date;
      if (typeof expiresAt === "string") {
        // If it's a MySQL datetime string (YYYY-MM-DD HH:mm:ss), treat it as UTC
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(expiresAt)) {
          expiryDate = new Date(expiresAt + "Z"); // Add Z to treat as UTC
        } else {
          expiryDate = new Date(expiresAt);
        }
      } else {
        expiryDate = new Date(expiresAt);
      }
      
      const expiry = expiryDate.getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          minutes,
          seconds,
          total: difference,
        });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 });
        if (onExpire) {
          onExpire();
        }
      }
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const formatTime = (time: number) => {
    return time.toString().padStart(2, "0");
  };

  const getTimerColor = () => {
    const totalMinutes = timeLeft.total / (1000 * 60);

    if (totalMinutes <= 2) {
      return "text-red-300 bg-red-900/30 border-red-700";
    } else if (totalMinutes <= 5) {
      return "text-orange-300 bg-orange-900/30 border-orange-700";
    } else {
      return "text-yellow-300 bg-yellow-900/30 border-yellow-700";
    }
  };

  const isExpired = timeLeft.total <= 0;
  const { minutes, seconds } = timeLeft;

  if (isExpired) {
    return (
      <div className="bg-red-50 rounded-lg p-2 text-center">
        <div className="text-red-600 text-xs font-semibold">支付已过期</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="text-gray-600 text-xs font-medium mb-1">剩余时间</div>
      <div className="font-mono text-xl font-bold text-gray-900">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
    </div>
  );
}
