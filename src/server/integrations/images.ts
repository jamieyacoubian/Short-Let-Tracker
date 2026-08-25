import { normalizeUrl } from "@/lib/duplicates";

/**
 * Image provenance adapter.
 *
 * There is no automated portal-scraping integration here by design — most
 * portals' terms of service prohibit scraping, and an automated scraper
 * can't be trusted to attribute a photo to the *exact* listing without a
 * human checking. Instead this module backs a manual "attach a photo"
 * action: Jamie pastes an image URL alongside the listing URL it came from,
 * and this function decides whether that pairing is verifiable before the
 * app is willing to call it "VERIFIED".
 *
 * A future automated source (e.g. a portal partner API) can call
 * `classifyProvenance` with the same inputs and get the same verdict.
 */

export interface ImageProvenanceInput {
  imageUrl: string;
  sourceListingUrl: string;
  propertyListingUrl?: string | null;
  propertyReference?: string | null;
}

export type VerificationVerdict = "VERIFIED" | "UNVERIFIED";

/**
 * An image is only ever VERIFIED when the listing URL it was retrieved from
 * matches the property's own recorded listing URL (or, failing that,
 * contains the property's portal reference) — otherwise it's UNVERIFIED and
 * the UI must show "Image not verified" rather than risk showing the wrong
 * home.
 */
export function classifyProvenance(input: ImageProvenanceInput): VerificationVerdict {
  if (!input.imageUrl || !input.sourceListingUrl) return "UNVERIFIED";

  if (input.propertyListingUrl) {
    if (normalizeUrl(input.sourceListingUrl) === normalizeUrl(input.propertyListingUrl)) {
      return "VERIFIED";
    }
  }
  if (input.propertyReference && input.sourceListingUrl.includes(input.propertyReference)) {
    return "VERIFIED";
  }
  return "UNVERIFIED";
}
