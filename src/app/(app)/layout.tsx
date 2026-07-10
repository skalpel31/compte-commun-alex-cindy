import Link from "next/link";
import { Bell } from "lucide-react";
import { SidebarNav, BottomNav } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { BrandMark } from "@/components/brand-mark";
import { getBills, getProfiles } from "@/lib/data";
import { currentMonth, monthLabel } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [bills, profiles] = await Promise.all([getBills(), getProfiles()]);
  const alertCount = bills.filter((b) => b.status === "overdue" || b.status === "upcoming").length;

  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col md:gap-1 md:p-4">
        <div className="mb-5 px-2">
          <BrandMark />
          <p className="mt-1 text-xs text-muted-foreground">
            Le copilote financier de votre foyer.
          </p>
        </div>
        <SidebarNav />
        <div className="mt-auto flex items-center gap-2 rounded-lg border p-2">
          <div className="flex -space-x-2">
            {profiles.slice(0, 2).map((p) => (
              <span
                key={p.id}
                className="flex size-8 items-center justify-center rounded-full border-2 border-sidebar bg-primary text-xs font-semibold text-primary-foreground"
              >
                {p.display_name.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profiles.map((p) => p.display_name).join(" & ") || "Foyer"}
            </p>
            <p className="truncate text-xs text-muted-foreground">Famille · 3 enfants</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh w-full flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
          <div className="md:hidden">
            <BrandMark />
          </div>
          <span className="hidden text-sm text-muted-foreground md:block" />
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-block">
              {monthLabel(currentMonth())}
            </span>
            <Link
              href="/alertes"
              className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Alertes"
            >
              <Bell className="size-4" />
              {alertCount > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-critical text-[0.6rem] font-semibold text-white">
                  {alertCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 px-4 pb-20 pt-4 md:pb-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background/95 backdrop-blur md:hidden">
          <BottomNav />
        </nav>
      </div>
    </div>
  );
}
