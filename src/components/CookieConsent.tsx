"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "qynx_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  const closeModal = () => {
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[90] px-4">
      <div className="w-full max-w-sm bg-[#1a1a1f] text-white border border-white/10 shadow-2xl py-12 px-7 relative rounded-xl">
        <button
          type="button"
          onClick={handleAccept}
          className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
          aria-label="Close cookie banner"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <p className="text-sm text-white/80 mb-4 font-medium">
          By clicking <strong className="text-white">Accept All Cookies</strong>, you agree to the storing of cookies on
          your device to enhance site navigation, analyze site usage, and assist in our marketing efforts.
        </p>
        <button
          type="button"
          onClick={handleAccept}
          className="w-full mb-3 py-2.5 bg-white text-[#1a1a1f] text-sm font-semibold hover:bg-white/90 transition-colors rounded-lg"
        >
          Accept All Cookies
        </button>
        <button
          type="button"
          onClick={closeModal}
          className="w-full py-2.5 bg-transparent text-white text-sm border border-white/30 font-semibold hover:bg-white/10 transition-colors rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
