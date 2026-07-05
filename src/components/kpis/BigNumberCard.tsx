export function BigNumberCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-6">
      <p className="text-sm text-slate-400 dark:text-slate-300 mb-2">{title}</p>
      <p className="text-3xl font-black text-[#1B365D] dark:text-white tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
