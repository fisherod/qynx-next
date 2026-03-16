"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_SESSION_KEY } from "@/constants";
import { ADMIN_TOKEN_KEY } from "@/constants";

function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(AUTH_SESSION_KEY) || !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

type Props = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function InvestNowLink({ className, style, children }: Props) {
  const pathname = usePathname();
  const [href, setHref] = useState("/sign-in");

  useEffect(() => {
    setHref(isLoggedIn() ? "/user/trading" : "/sign-in?redirect=/user/trading");
  }, [pathname]);

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
