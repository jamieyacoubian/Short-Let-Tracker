import { Coffee, HeartHandshake, Trees, Moon, Theater, TrainFront, Clock, LaptopMinimalCheck } from "lucide-react";
import { ratingLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface PropertyRatings {
  ratingCafes: number | null;
  ratingCalm: number | null;
  ratingGreenery: number | null;
  ratingEvening: number | null;
  ratingCulture: number | null;
  ratingTransport: number | null;
  ratingLateNight: number | null;
  ratingWfh: number | null;
}

const RATING_ROWS: Array<{ key: keyof PropertyRatings; label: string; icon: React.ElementType }> = [
  { key: "ratingCafes", label: "Cafés & food", icon: Coffee },
  { key: "ratingCalm", label: "Calmness", icon: HeartHandshake },
  { key: "ratingGreenery", label: "Greenery & walks", icon: Trees },
  { key: "ratingEvening", label: "Evening convenience", icon: Moon },
  { key: "ratingCulture", label: "Culture & theatres", icon: Theater },
  { key: "ratingTransport", label: "Transport", icon: TrainFront },
  { key: "ratingLateNight", label: "Late-night return", icon: Clock },
  { key: "ratingWfh", label: "WFH suitability", icon: LaptopMinimalCheck },
];

const TONE: Record<string, string> = {
  Excellent: "bg-sage-500 text-white",
  Good: "bg-sage-200 text-sage-700",
  Fair: "bg-amber-100 text-amber-600",
  Poor: "bg-clay-100 text-clay-600",
  "Not rated": "bg-ivory-soft text-ink-300",
};

export function RatingsGrid({ property }: { property: PropertyRatings }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {RATING_ROWS.map((row) => {
        const value = property[row.key];
        const label = ratingLabel(value);
        const Icon = row.icon;
        return (
          <div key={row.key} className="flex flex-col gap-1.5 rounded-lg border border-border-soft bg-paper p-3">
            <Icon className="h-4 w-4 text-ink-500" />
            <p className="text-xs text-ink-500">{row.label}</p>
            <span className={cn("w-fit rounded-full px-2 py-0.5 text-[11px] font-medium", TONE[label])}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
