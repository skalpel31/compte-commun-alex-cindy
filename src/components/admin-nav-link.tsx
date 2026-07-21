"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNavLink() {
  const pathname = usePathname();
  const active = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <Link
      href="/admin"
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <ShieldAlert className="size-4" />
      Administration
    </Link>
  );
}
