"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      title="Sign out"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
