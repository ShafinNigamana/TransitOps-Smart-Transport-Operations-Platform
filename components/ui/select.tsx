import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fleet-amber focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            error && "border-fleet-red focus-visible:ring-fleet-red",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
