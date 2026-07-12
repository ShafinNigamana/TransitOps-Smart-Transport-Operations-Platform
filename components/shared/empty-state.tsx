import * as React from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60 mb-5">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {ctaLabel && onCtaClick && (
        <Button onClick={onCtaClick} className="mt-1">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
