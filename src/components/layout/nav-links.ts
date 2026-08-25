import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, KanbanSquare, CalendarClock, Columns3, FileText, Settings } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", shortLabel: "Pipeline", icon: KanbanSquare },
  { href: "/viewings", label: "Viewings", shortLabel: "Viewings", icon: CalendarClock },
  { href: "/compare", label: "Compare", shortLabel: "Compare", icon: Columns3 },
  { href: "/drafts", label: "Drafts", shortLabel: "Drafts", icon: FileText },
  { href: "/settings", label: "Settings & integrations", shortLabel: "Settings", icon: Settings },
];
