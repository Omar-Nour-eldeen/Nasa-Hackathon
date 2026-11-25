export default function StatCard({
  title,
  value,
  unit,
  description,
  icon: Icon,
  footnote,
  accent = "orange",
}) {
  const accents = {
    orange: "bg-orange-500/10 text-orange-500",
    red: "bg-red-500/10 text-red-500",
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <div className="min-w-0 rounded-xl border border-(--border-color) bg-(--surface) p-4 transition hover:border-orange-500/40 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-(--text-secondary)">{title}</p>
        {Icon && (
          <div className={`shrink-0 rounded-lg p-2 ${accents[accent] ?? accents.orange}`}>
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-1.5 sm:mt-4">
        <p className="break-words text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
        {unit && <span className="text-xs text-(--text-secondary)">{unit}</span>}
      </div>

      {description && (
        <p className="mt-2 text-xs text-(--text-secondary)">{description}</p>
      )}

      {footnote && (
        <div className="mt-3.5 border-t border-(--border-color) pt-3 sm:mt-4">
          <span className="break-words text-[11px] text-(--text-secondary)">{footnote}</span>
        </div>
      )}
    </div>
  );
}
