import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, Ruler, Wifi, Building2, ImageOff, CalendarClock, TriangleAlert } from "lucide-react";
import type { Agent, Property, PropertyImage, Viewing } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { RankBadge, StatusBadge } from "./badges";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/pricing";
import { shortName } from "@/lib/assessment";
import { notStatedOr, isStaleListing, CLOSED_STATUSES } from "@/lib/status";
import { cn } from "@/lib/utils";

export type PropertyCardData = Property & {
  agent: Agent | null;
  images?: PropertyImage[];
  viewings?: Viewing[];
};

export function PropertyCard({ property, rankIndex }: { property: PropertyCardData; rankIndex?: number }) {
  const hero = property.images?.find((i) => i.verificationStatus === "VERIFIED") ?? null;
  const confirmedViewing = property.viewings?.find((v) => v.status === "CONFIRMED");
  const stale = !CLOSED_STATUSES.includes(property.status) && isStaleListing(property);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/properties/${property.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 bg-ivory-soft">
          {hero ? (
            <Image src={hero.url} alt={hero.altText ?? property.address} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-300">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs">No verified photo yet</span>
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {rankIndex != null && (
              <span className="rounded-full bg-forest-900/90 px-2 py-0.5 text-[11px] font-semibold text-ivory-soft">
                #{rankIndex + 1}
              </span>
            )}
            <RankBadge tier={property.rankTier} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div>
            <p className="font-serif-display text-base font-medium leading-snug text-forest-900">{shortName(property)}</p>
            <p className="truncate text-xs text-ink-500">
              {[property.neighbourhood, property.postcode].filter(Boolean).join(" · ") || "Area not stated"}
            </p>
          </div>

          <p className="font-serif-display text-lg font-medium text-terracotta-700">
            {property.priceMonthly ? `${formatGBP(property.priceMonthly)} pcm` : "Price not stated"}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
              </span>
            )}
            {property.squareFeet != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" /> {property.squareFeet} sq ft
              </span>
            )}
            {property.billsIncluded === "YES" && (
              <span className="flex items-center gap-1 text-sage-700">
                <Wifi className="h-3.5 w-3.5" /> Bills incl.
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-500">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{property.agent?.name ?? "Agent not stated"}</span>
          </div>

          {confirmedViewing?.startAt && (
            <div className="flex items-center gap-1.5 rounded-md bg-terracotta-100 px-2 py-1 text-xs font-medium text-terracotta-700">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              Viewing {new Date(confirmedViewing.startAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            <StatusBadge status={property.status} />
            {stale && (
              <Badge variant="amber" className="gap-1">
                <TriangleAlert className="h-3 w-3" /> Verify listing
              </Badge>
            )}
          </div>

          {property.nextAction && (
            <p className={cn("truncate text-xs italic text-ink-500")}>Next: {notStatedOr(property.nextAction)}</p>
          )}
        </div>
      </Link>
    </Card>
  );
}
