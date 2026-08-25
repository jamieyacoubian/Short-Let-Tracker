import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 px-4 pb-6 pt-6 sm:flex-row sm:items-end sm:justify-between lg:px-8", className)}>
      <div>
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-terracotta-600">{eyebrow}</p>}
        <h1 className="font-serif-display text-2xl font-medium text-forest-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
