import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
    secondary:
      "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
    outline:
      "border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200",
    success:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    danger:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
