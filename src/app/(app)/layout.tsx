import Link from "next/link";
import { Home, LogOut, Settings, Search } from "lucide-react";
import { auth, signOut } from "@/auth";
import { DesktopNav, MobileNav } from "@/components/layout/nav-item";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-soft bg-paper lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-800 text-ivory-soft">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <p className="font-serif-display text-sm font-medium leading-tight text-forest-900">
              London Rental
            </p>
            <p className="font-serif-display text-sm font-medium leading-tight text-forest-900">Command Centre</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <DesktopNav />
        </nav>
        <div className="border-t border-border-soft p-3">
          <p className="truncate px-3 py-1 text-xs text-ink-500">{session?.user?.email ?? "Signed in"}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border-soft bg-ivory/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-800 text-ivory-soft">
              <Home className="h-3.5 w-3.5" />
            </div>
            <p className="font-serif-display text-sm font-medium text-forest-900">Command Centre</p>
          </div>
          <form action="/pipeline" className="hidden max-w-sm flex-1 items-center gap-2 lg:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                name="q"
                placeholder="Search address, postcode, agent, URL..."
                className="h-9 w-full rounded-md border border-border-strong bg-paper pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </form>
          <Link href="/settings" className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5 text-ink-700" />
            </Button>
          </Link>
        </header>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-border-soft bg-paper/95 px-2 py-1.5 backdrop-blur lg:hidden [padding-bottom:max(0.375rem,env(safe-area-inset-bottom))]">
        <MobileNav />
      </nav>
    </div>
  );
}
