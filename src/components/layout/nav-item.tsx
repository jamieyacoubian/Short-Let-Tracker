"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-forest-800 text-ivory-soft" : "text-ink-700 hover:bg-ivory-soft"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((l) => l.href !== "/settings");
  return (
    <>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
              active ? "text-forest-800" : "text-ink-500"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
            {link.shortLabel}
          </Link>
        );
      })}
    </>
  );
}
