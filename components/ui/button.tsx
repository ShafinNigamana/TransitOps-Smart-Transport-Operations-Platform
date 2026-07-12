import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success"
    | "warning";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variantStyles = {
      default:
        "bg-fleet-amber text-primary-foreground shadow-sm hover:opacity-90 focus-visible:ring-fleet-amber",
      destructive:
        "bg-fleet-red text-white shadow-sm hover:opacity-90 focus-visible:ring-fleet-red",
      outline:
        "border border-border bg-transparent text-foreground hover:bg-secondary/50",
      secondary:
        "bg-secondary text-foreground hover:bg-secondary/80",
      ghost:
        "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
      link: "text-fleet-teal underline-offset-4 hover:underline",
      success:
        "bg-fleet-sage text-white shadow-sm hover:opacity-90 focus-visible:ring-fleet-sage",
      warning:
        "bg-fleet-ochre text-white shadow-sm hover:opacity-90 focus-visible:ring-fleet-ochre",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-6",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
