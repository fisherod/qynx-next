"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function InvestNowLink({ className, style, children }: Props) {
  const session = useSession();
  const pathname = usePathname();
  const [href, setHref] = useState("/sign-in");

  useEffect(() => {
    setHref(
      session?.data?.user && session.status === "authenticated"
        ? "/user/dashboard"
        : "/sign-in?redirect=/user/dashboard"
    );
  }, [pathname, session]);

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
