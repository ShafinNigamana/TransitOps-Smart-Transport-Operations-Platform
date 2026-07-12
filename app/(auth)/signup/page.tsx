"use client";

import * as React from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { z } from "zod";

const clientSignupSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["fleet_manager", "driver", "safety_officer", "financial_analyst"], {
    message: "Please select a valid role",
  }),
});

export default function SignupPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const rawData = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    const parsed = clientSignupSchema.safeParse(rawData);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form input");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signUp(formData);
        if (result?.error) {
          setError(typeof result.error === "string" ? result.error : JSON.stringify(result.error));
        } else if (result?.success) {
          setSuccess(result.message ?? "Registration successful!");
          const form = event.target as HTMLFormElement;
          form.reset();
        }
      } catch (err: any) {
        // Next.js redirect errors are expected if signUp redirect is processed
        if (err.digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err.message || String(err));
      }
    });
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Sign up</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create an operator profile to access the cockpit.
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. Captain Miller"
                disabled={isPending}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* Email Address */}
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
                disabled={isPending}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Password (minimum 8 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Enter your password"
                disabled={isPending}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Operations role
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                id="role"
                name="role"
                required
                defaultValue=""
                disabled={isPending}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors duration-150 appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-card text-muted-foreground">
                  Select your assignment
                </option>
                <option value="fleet_manager" className="bg-card text-foreground">
                  Fleet Manager (Control Room)
                </option>
                <option value="driver" className="bg-card text-foreground">
                  Driver (Road & Fleet Execution)
                </option>
                <option value="safety_officer" className="bg-card text-foreground">
                  Safety Officer (Compliance & Health)
                </option>
                <option value="financial_analyst" className="bg-card text-foreground">
                  Financial Analyst (Costs & Metrics)
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>
              {isPending ? "Creating profile..." : "Sign up"}
            </span>
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
