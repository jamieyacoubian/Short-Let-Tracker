/**
 * Map provider configuration, chosen via NEXT_PUBLIC_MAP_PROVIDER so the
 * same UI works with either provider. Both provider tokens are public
 * client-side tokens by design (Mapbox's is meant to be domain-restricted
 * rather than secret; Google Maps JS keys are restricted the same way) —
 * neither is a server secret, so exposing them via NEXT_PUBLIC_* is correct,
 * not an oversight. When neither is configured the map components fall
 * back to a static summary with an "Open in Google Maps" link.
 */

export type MapProvider = "mapbox" | "google" | "none";

export function getMapProvider(): MapProvider {
  const configured = process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProvider | undefined;
  if (configured === "mapbox" && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return "mapbox";
  if (configured === "google" && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return "google";
  // Auto-detect if a token is present even without the switch being set explicitly.
  if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return "mapbox";
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return "google";
  return "none";
}

export const SWALLOW_COURT = {
  label: "Swallow Court, Admiral Way",
  // Approximate Admiral Way / South Quay, Canary Wharf coordinates — used only
  // as a directions origin, never displayed as anyone's precise home location.
  lat: 51.4956,
  lng: -0.0206,
};

export function googleDirectionsUrl(opts: {
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationAddress?: string;
  originLat?: number;
  originLng?: number;
  originLabel?: string;
}): string {
  const destination =
    opts.destinationLat != null && opts.destinationLng != null
      ? `${opts.destinationLat},${opts.destinationLng}`
      : encodeURIComponent(opts.destinationAddress ?? "");
  const params = new URLSearchParams({ api: "1", destination });
  if (opts.originLat != null && opts.originLng != null) {
    params.set("origin", `${opts.originLat},${opts.originLng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googleMapsViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
