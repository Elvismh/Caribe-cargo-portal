export function DistributionCard({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
      <p className="text-sm text-slate-400 dark:text-slate-300 mb-4">{title}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-400">Sin datos.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(([label, count]) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-white">{label}</span>
                <span className="text-slate-400 dark:text-slate-300">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#1B365D] dark:bg-blue-500 rounded-full"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
