import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  children?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-500",
  iconBg = "bg-blue-500/10",
  trend,
  children,
}: KPICardProps) {
  return (
    <div className="flex flex-col justify-between p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {title}
        </span>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4">
        <span className="text-3xl font-extrabold text-foreground">{value}</span>
        {subtitle && (
          <span className="text-sm text-muted-foreground ml-1.5">
            {subtitle}
          </span>
        )}
        {trend && (
          <span
            className={`text-sm font-semibold ml-2 ${
              trend.positive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
