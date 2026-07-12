"use client";

import * as React from "react";
import Link from "next/link";
import { login, demoLogin } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Lock,
  LogIn,
  Truck,
  Route,
  ShieldCheck,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

const DEMO_PERSONAS = [
  {
    role: "fleet_manager",
    label: "Fleet Manager",
    description: "Vehicle registry & maintenance",
    icon: Truck,
    color: "text-fleet-amber",
    bg: "bg-fleet-amber/10",
    border: "border-fleet-amber/20 hover:border-fleet-amber/50",
  },
  {
    role: "driver",
    label: "Driver",
    description: "Trip dispatch & completion",
    icon: Route,
    color: "text-fleet-teal",
    bg: "bg-fleet-teal/10",
    border: "border-fleet-teal/20 hover:border-fleet-teal/50",
  },
  {
    role: "safety_officer",
    label: "Safety Officer",
    description: "Driver compliance & licensing",
    icon: ShieldCheck,
    color: "text-fleet-ochre",
    bg: "bg-fleet-ochre/10",
    border: "border-fleet-ochre/20 hover:border-fleet-ochre/50",
  },
  {
    role: "financial_analyst",
    label: "Financial Analyst",
    description: "Fuel, expenses & ROI reports",
    icon: BarChart3,
    color: "text-muted-foreground",
    bg: "bg-muted/10",
    border: "border-border hover:border-muted-foreground/50",
  },
] as const;

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws — this is expected on success
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(role: string) {
    setError(null);
    setDemoLoading(role);
    try {
      const result = await demoLogin(role);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws — this is expected on success
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Login Form Card */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to access the operations cockpit.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form action={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="operator@transitops.com"
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>{loading ? "Signing in…" : "Sign in"}</span>
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>

      {/* Demo Persona Quick-Login Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">
            Demo Quick-Login
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instantly sign in as any persona to test RBAC permissions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DEMO_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isLoading = demoLoading === persona.role;
            return (
              <button
                key={persona.role}
                onClick={() => handleDemoLogin(persona.role)}
                disabled={demoLoading !== null}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-200 cursor-pointer disabled:opacity-50 ${persona.border} hover:bg-secondary/30`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${persona.bg}`}
                >
                  {isLoading ? (
                    <Loader2 className={`h-5 w-5 animate-spin ${persona.color}`} />
                  ) : (
                    <Icon className={`h-5 w-5 ${persona.color}`} />
                  )}
                </div>
                <div>
                  <span className="block text-xs font-semibold text-foreground">
                    {persona.label}
                  </span>
                  <span className="block text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {persona.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
