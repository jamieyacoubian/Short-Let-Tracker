import { describe, expect, it } from "vitest";
import {
  findDuplicateMatches,
  normalizeAddress,
  normalizePostcode,
  normalizeUrl,
  postcodeOutward,
  scoreDuplicate,
} from "./duplicates";

describe("normalizeAddress", () => {
  it("lowercases, strips flat/unit words and collapses whitespace", () => {
    expect(normalizeAddress("Flat 3, 12 Denholme Road")).toBe("3 12 denholme road");
  });

  it("treats equivalent addresses as equal after normalization", () => {
    expect(normalizeAddress("12C Denholme Road")).toBe(normalizeAddress("12c denholme road"));
  });
});

describe("normalizePostcode / postcodeOutward", () => {
  it("strips whitespace and uppercases", () => {
    expect(normalizePostcode("w9 3hx")).toBe("W93HX");
  });

  it("extracts the outward code for partial matching", () => {
    expect(postcodeOutward("W9 3HX")).toBe("W9");
    expect(postcodeOutward("SE1 2AB")).toBe("SE1");
  });
});

describe("normalizeUrl", () => {
  it("treats the same listing across www and non-www hosts as equal", () => {
    expect(normalizeUrl("https://www.rightmove.co.uk/properties/12345")).toBe(
      normalizeUrl("https://rightmove.co.uk/properties/12345")
    );
  });

  it("ignores a trailing slash", () => {
    expect(normalizeUrl("https://rightmove.co.uk/properties/12345/")).toBe(
      normalizeUrl("https://rightmove.co.uk/properties/12345")
    );
  });
});

describe("scoreDuplicate", () => {
  it("scores an exact address + postcode match highly", () => {
    const { score, reasons } = scoreDuplicate(
      { address: "12C Denholme Road", postcode: "W9 3HX" },
      { address: "12C Denholme Road", postcode: "W9 3HX" }
    );
    expect(score).toBeGreaterThanOrEqual(45);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("scores the same property across two different portal URLs as a strong match via address", () => {
    const { score } = scoreDuplicate(
      { address: "32A Lydford Road", postcode: "W9 3LX", listingUrl: "https://www.rightmove.co.uk/properties/1" },
      { address: "32A Lydford Road", postcode: "W9 3LX", listingUrl: "https://www.zoopla.co.uk/to-rent/details/2" }
    );
    // A different portal URL must never by itself suppress a match on address+postcode.
    expect(score).toBeGreaterThanOrEqual(45);
  });

  it("scores unrelated properties low", () => {
    const { score } = scoreDuplicate(
      { address: "12C Denholme Road", postcode: "W9 3HX" },
      { address: "9 Totally Different Street", postcode: "E14 8JH" }
    );
    expect(score).toBeLessThan(15);
  });

  it("boosts score on a shared portal reference number", () => {
    const { score, reasons } = scoreDuplicate(
      { address: "Flat A, Some Road", reference: "90378336" },
      { address: "Flat B, Some Road (relisted)", reference: "90378336" }
    );
    expect(reasons.some((r) => r.toLowerCase().includes("reference"))).toBe(true);
    expect(score).toBeGreaterThan(0);
  });
});

describe("findDuplicateMatches", () => {
  const existing = [
    { id: "p1", address: "12C Denholme Road", postcode: "W9 3HX", listingUrl: "https://a.com/1" },
    { id: "p2", address: "9 Elsewhere Street", postcode: "E1 6AN" },
  ];

  it("finds and ranks the strongest match first", () => {
    const matches = findDuplicateMatches({ id: "candidate", address: "12C Denholme Road", postcode: "W9 3HX" }, existing);
    expect(matches[0].matchedId).toBe("p1");
    expect(matches[0].confidence).toBe("strong");
  });

  it("excludes the candidate's own id from the comparison set", () => {
    const matches = findDuplicateMatches({ id: "p1", address: "12C Denholme Road", postcode: "W9 3HX" }, existing);
    expect(matches.some((m) => m.matchedId === "p1")).toBe(false);
  });

  it("returns no matches for a genuinely new property", () => {
    const matches = findDuplicateMatches({ id: "new", address: "1 Brand New Close", postcode: "N1 9ZZ" }, existing);
    expect(matches).toHaveLength(0);
  });
});
