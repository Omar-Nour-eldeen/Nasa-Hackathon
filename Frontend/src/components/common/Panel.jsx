export default function Panel({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-(--border-color) bg-(--surface) ${className}`}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0 sm:p-5 sm:pb-0">
          <div className="min-w-0 flex-1">
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && (
              <p className="mt-1 text-xs leading-5 text-(--text-secondary)">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
