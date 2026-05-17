export default function StatCard({ icon: Icon, title, value, subtitle, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary-light text-primary",
    accent: "bg-orange-50 text-accent",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
  };

  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary leading-normal">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-text-primary leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${colorMap[color] || colorMap.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
