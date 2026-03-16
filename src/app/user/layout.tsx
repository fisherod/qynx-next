"use client";

import { signOut } from "next-auth/react";
import UserPanelHeader from "@/components/UserPanelHeader";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <>
      <UserPanelHeader onLogout={handleLogout} />
      {children}
    </>
  );
}
