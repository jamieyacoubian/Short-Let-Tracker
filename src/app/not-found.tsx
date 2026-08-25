import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory px-6 text-center">
      <SearchX className="h-8 w-8 text-ink-300" />
      <p className="font-serif-display text-lg font-medium text-forest-900">Page not found</p>
      <p className="max-w-sm text-sm text-ink-500">This property or page doesn&rsquo;t exist, or may have been removed.</p>
      <Button asChild size="sm">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
