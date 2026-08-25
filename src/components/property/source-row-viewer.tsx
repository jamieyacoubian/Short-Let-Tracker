export function SourceRowViewer({ sourceRow, label }: { sourceRow: string | null; label: string }) {
  if (!sourceRow) return null;
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(sourceRow);
  } catch {
    return null;
  }
  const entries = Object.entries(parsed).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <details className="group rounded-lg border border-border-soft bg-ivory-soft/50">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-medium text-ink-500 hover:text-forest-800">
        View original {label} row from the CRM sheet
      </summary>
      <div className="max-h-80 overflow-y-auto border-t border-border-soft px-4 py-3">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-ink-300">{key}</dt>
              <dd className="whitespace-pre-wrap break-words text-xs text-ink-700">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}
