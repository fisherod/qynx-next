"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning" | "loading";
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "info", duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400/50 shadow-emerald-500/25";
      case "error":
        return "bg-gradient-to-r from-red-500 to-rose-600 border-red-400/50 shadow-red-500/25";
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/50 shadow-amber-500/25";
      case "loading":
        return "bg-gradient-to-r from-purple-500 to-indigo-600 border-purple-400/50 shadow-purple-500/25";
      default:
        return "bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400/50 shadow-blue-500/25";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        );
      case "loading":
        return (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "w-full",
        "transform transition-all duration-500 ease-out",
        isVisible && !isExiting ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-[-100%] scale-95"
      )}
    >
      <div
        className={cn(
          "relative p-4 rounded-2xl border backdrop-blur-sm",
          "shadow-2xl shadow-black/20",
          "before:absolute before:inset-0 before:rounded-2xl before:bg-white/10 before:backdrop-blur-sm",
          getToastStyles()
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>

        {/* Content */}
        <div className="relative flex items-start space-x-3">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-relaxed">{message}</p>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => {
                setIsVisible(false);
                onClose?.();
              }, 300);
            }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center group"
          >
            <svg
              className="w-3 h-3 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
          <div
            className={cn("h-full bg-white/40 transition-all ease-linear", isExiting ? "w-0" : "w-full")}
            style={{
              transitionDuration: `${duration}ms`,
              animationDelay: "0ms"
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Toast context for global toast management
interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info" | "warning" | "loading") => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error" | "info" | "warning" | "loading";
    }>
  >([]);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" | "loading" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full mx-4">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="transform transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${index * 8}px) scale(${1 - index * 0.05})`,
              zIndex: 1000 - index
            }}
          >
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
