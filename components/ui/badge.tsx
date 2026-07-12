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
      "bg-fleet-sage/10 text-fleet-sage border border-fleet-sage/20",
    warning:
      "bg-fleet-ochre/10 text-fleet-ochre border border-fleet-ochre/20",
    danger:
      "bg-fleet-red/10 text-fleet-red border border-fleet-red/20",
    info: "bg-fleet-amber/10 text-fleet-amber border border-fleet-amber/20",
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
