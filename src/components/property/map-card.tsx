import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { googleDirectionsUrl, googleMapsViewUrl, SWALLOW_COURT } from "@/lib/maps";
import { shortName } from "@/lib/assessment";
import type { Property } from "@prisma/client";

export function MapCard({
  property,
  nearby,
}: {
  property: Property;
  nearby: Array<Pick<Property, "id" | "address" | "development" | "neighbourhood">>;
}) {
  const hasCoords = property.latitude != null && property.longitude != null;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border-soft bg-ivory-soft">
        {hasCoords ? (
          <iframe
            title={`Map of ${property.address}`}
            className="h-64 w-full sm:h-80"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
          />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 p-6 text-center text-ink-500">
            <MapPin className="h-6 w-6 text-ink-300" />
            <p className="text-sm">Location not yet geocoded — showing area only.</p>
            <p className="text-xs text-ink-300">{[property.neighbourhood, property.postcode].filter(Boolean).join(", ") || "Area not stated"}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={
            hasCoords
              ? googleMapsViewUrl(property.latitude!, property.longitude!)
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`
          }
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border-strong bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ivory-soft"
        >
          <MapPin className="h-3.5 w-3.5" /> Open in Google Maps
        </a>
        <a
          href={googleDirectionsUrl({ destinationLat: property.latitude, destinationLng: property.longitude, destinationAddress: property.address })}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border-strong bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ivory-soft"
        >
          <Navigation className="h-3.5 w-3.5" /> Directions from current location
        </a>
        <a
          href={googleDirectionsUrl({
            destinationLat: property.latitude,
            destinationLng: property.longitude,
            destinationAddress: property.address,
            originLat: SWALLOW_COURT.lat,
            originLng: SWALLOW_COURT.lng,
          })}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border-strong bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ivory-soft"
        >
          <Navigation className="h-3.5 w-3.5" /> Directions from Swallow Court
        </a>
      </div>

      {nearby.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-500">Other shortlisted properties nearby</p>
          <div className="flex flex-col gap-1">
            {nearby.map((n) => (
              <Link key={n.id} href={`/properties/${n.id}`} className="text-sm text-forest-700 hover:underline">
                {shortName(n)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
