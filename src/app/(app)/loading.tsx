export default function Loading() {
  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-ivory-soft" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-border-soft bg-ivory-soft" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border border-border-soft bg-ivory-soft" />
        ))}
      </div>
    </div>
  );
}
