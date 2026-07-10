"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, mobileNavItems, moreNavItems } from "@/lib/nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const firstHalf = mobileNavItems.slice(0, 2);
  const secondHalf = mobileNavItems.slice(2);

  return (
    <>
      {firstHalf.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}

      <Link
        href="/transactions/new"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
        aria-label="Nouvelle dépense"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Plus className="size-5" />
        </span>
      </Link>

      {secondHalf.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-5" />
        Plus
      </button>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Plus</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4 pb-6">
            {moreNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
