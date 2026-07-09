import { SidebarNav, BottomNav } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col md:gap-1 md:p-4">
        <div className="mb-4 px-2 text-lg font-semibold tracking-tight">Nous Deux</div>
        <SidebarNav />
      </aside>

      <div className="flex min-h-svh w-full flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
          <span className="text-base font-semibold tracking-tight md:hidden">Nous Deux</span>
          <span className="hidden text-sm text-muted-foreground md:block" />
          <div className="flex items-center gap-1">
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
