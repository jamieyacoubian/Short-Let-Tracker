import { prisma } from "@/lib/db";
import type { PropertyStatus, RankTier } from "@prisma/client";
import { CLOSED_STATUSES } from "@/lib/status";
import { urgencyScore } from "@/lib/status";

export async function getAllProperties() {
  return prisma.property.findMany({
    include: { agent: true, viewings: true, images: true },
    orderBy: [{ rankScore: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getPropertyDetail(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      agent: true,
      images: { orderBy: { sortOrder: "asc" } },
      contactLogs: { orderBy: { occurredAt: "asc" }, include: { agent: true } },
      drafts: { orderBy: { preparedAt: "desc" } },
      viewings: { orderBy: { startAt: "asc" }, include: { media: true } },
      transportLinks: { orderBy: { sortOrder: "asc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function getDashboardData() {
  const properties = await prisma.property.findMany({
    include: { agent: true, viewings: true },
    orderBy: [{ rankScore: "desc" }],
  });

  const active = properties.filter((p) => !CLOSED_STATUSES.includes(p.status));
  const strongContenders = properties.filter((p) => p.rankTier === "TOP_PICK" || p.rankTier === "STRONG_CONTENDER");
  const awaitingReply = properties.filter((p) => p.status === "AWAITING_REPLY");
  const activeConversations = properties.filter((p) => p.status === "ACTIVE_CONVERSATION");
  const followUpsDue = properties.filter((p) => p.status === "FOLLOW_UP_DUE" || (p.nextActionDue && p.nextActionDue < new Date()));
  const closedOut = properties.filter((p) => CLOSED_STATUSES.includes(p.status));

  const now = new Date();
  const upcomingViewings = await prisma.viewing.findMany({
    where: { status: { in: ["CONFIRMED", "PROPOSED"] } },
    include: { property: { include: { agent: true } } },
    orderBy: { startAt: "asc" },
  });
  const confirmedViewings = upcomingViewings.filter((v) => v.status === "CONFIRMED" && v.startAt && v.startAt >= now);

  const immediateActions = active
    .filter((p) => p.nextAction)
    .map((p) => ({
      property: p,
      urgency: urgencyScore({ status: p.status, nextActionDue: p.nextActionDue, updatedAt: p.updatedAt }),
    }))
    .sort((a, b) => a.urgency - b.urgency)
    .slice(0, 8);

  const sinceCutoff = new Date(now.getTime() - 1000 * 60 * 60 * 36);
  const newInfoSince = properties.filter((p) => p.updatedAt >= sinceCutoff);

  const pipelineCounts: Record<string, number> = {};
  for (const p of properties) {
    pipelineCounts[p.status] = (pipelineCounts[p.status] ?? 0) + 1;
  }

  const bestOptionsNow = [...active]
    .filter((p) => p.rankTier)
    .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0))
    .slice(0, 6);

  return {
    properties,
    active,
    strongContenders,
    awaitingReply,
    activeConversations,
    followUpsDue,
    closedOut,
    confirmedViewings,
    upcomingViewings,
    immediateActions,
    newInfoSince,
    pipelineCounts,
    bestOptionsNow,
  };
}

export interface PropertyFilters {
  q?: string;
  area?: string;
  status?: PropertyStatus;
  rankTier?: RankTier;
  agentId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: boolean;
  billsIncluded?: boolean;
  shortLetConfirmed?: boolean;
  viewingArranged?: boolean;
  wfhSuitable?: boolean;
  minSquareFeet?: number;
}

export async function searchProperties(filters: PropertyFilters) {
  const all = await getAllProperties();
  return all.filter((p) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const haystack = [p.address, p.development, p.postcode, p.listingUrl, p.reference, p.agent?.name, p.agent?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.area && p.neighbourhood?.toLowerCase() !== filters.area.toLowerCase()) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.rankTier && p.rankTier !== filters.rankTier) return false;
    if (filters.agentId && p.agentId !== filters.agentId) return false;
    if (filters.minPrice && (p.priceMonthly ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice && (p.priceMonthly ?? Infinity) > filters.maxPrice) return false;
    if (filters.bedrooms && p.bedrooms !== filters.bedrooms) return false;
    if (filters.furnished && p.furnished !== "Furnished") return false;
    if (filters.billsIncluded && p.billsIncluded !== "YES") return false;
    if (filters.shortLetConfirmed && p.shortLetConfirmed !== "YES") return false;
    if (filters.viewingArranged && !p.viewings.some((v) => v.status === "CONFIRMED" || v.status === "PROPOSED")) return false;
    if (filters.wfhSuitable && p.wfhSuitable !== "YES") return false;
    if (filters.minSquareFeet && (p.squareFeet ?? 0) < filters.minSquareFeet) return false;
    return true;
  });
}

export async function getAgents() {
  return prisma.agent.findMany({ orderBy: { name: "asc" } });
}

export async function getSources() {
  return prisma.source.findMany({ orderBy: { name: "asc" } });
}

export async function getArchiveLeads() {
  return prisma.archiveLead.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDrafts() {
  return prisma.draft.findMany({
    include: { property: true },
    orderBy: { preparedAt: "desc" },
  });
}

export async function getViewings() {
  return prisma.viewing.findMany({
    include: { property: { include: { agent: true } }, media: true },
    orderBy: { startAt: "asc" },
  });
}

export async function getRecentAuditLog(limit = 50) {
  return prisma.auditLogEntry.findMany({
    include: { property: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
