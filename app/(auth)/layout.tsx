"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark-v2.png" : "/logo-light-v2.png";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand Mark */}
      <div className="mb-8">
        <Image
          src={logoSrc}
          alt="TransitOps Logo"
          width={180}
          height={45}
          priority
          className="h-11 w-auto"
        />
      </div>

      {/* Content Slot */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground font-mono">
        Smart Transport Operations Platform
      </p>
    </div>
  );
}
