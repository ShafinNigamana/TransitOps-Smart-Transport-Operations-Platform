import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand Mark */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fleet-amber/10">
          <Shield className="h-5 w-5 text-fleet-amber" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground font-display">
          Transit<span className="text-fleet-amber">Ops</span>
        </span>
      </div>

      {/* Content Slot */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Smart Transport Operations Platform
      </p>
    </div>
  );
}
