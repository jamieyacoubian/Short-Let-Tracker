import Image from "next/image";
import { ImageOff, ShieldQuestion } from "lucide-react";
import type { PropertyImage } from "@prisma/client";
import { EmptyState } from "@/components/shared/empty-state";

const CATEGORY_LABEL: Record<string, string> = {
  LIVING_ROOM: "Living room",
  KITCHEN: "Kitchen",
  MAIN_BEDROOM: "Main bedroom",
  SECOND_BEDROOM: "Second bedroom / study",
  BATHROOM: "Bathroom",
  OUTDOOR: "Balcony / terrace / garden",
  FLOORPLAN: "Floorplan",
  EXTERIOR: "Exterior",
  OTHER: "Other",
};

const CATEGORY_ORDER = ["LIVING_ROOM", "KITCHEN", "MAIN_BEDROOM", "SECOND_BEDROOM", "BATHROOM", "OUTDOOR", "FLOORPLAN", "EXTERIOR", "OTHER"];

export function Gallery({ images }: { images: PropertyImage[] }) {
  if (images.length === 0) {
    return (
      <EmptyState
        icon={ImageOff}
        title="No verified photos yet"
        description="This app only shows images demonstrably linked to this exact listing. Attach a photo with its source listing URL once one's available."
      />
    );
  }

  const sorted = [...images].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {sorted.map((img) => (
        <figure key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-ivory-soft">
          {img.verificationStatus === "VERIFIED" ? (
            <Image src={img.url} alt={img.altText ?? CATEGORY_LABEL[img.category]} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-ink-300">
              <ShieldQuestion className="h-5 w-5" />
              <span className="text-[11px]">Image not verified</span>
            </div>
          )}
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/70 to-transparent px-2 py-1.5 text-[11px] font-medium text-white">
            {CATEGORY_LABEL[img.category]}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
