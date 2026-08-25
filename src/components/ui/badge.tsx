import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-forest-800/20 bg-forest-800 text-ivory-soft",
        outline: "border-border-strong bg-transparent text-ink-700",
        sage: "border-sage-500/30 bg-sage-100 text-sage-700",
        terracotta: "border-terracotta-500/30 bg-terracotta-100 text-terracotta-700",
        amber: "border-amber-600/30 bg-amber-100 text-amber-600",
        clay: "border-clay-600/30 bg-clay-100 text-clay-600",
        ink: "border-ink-300/40 bg-ivory-soft text-ink-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
