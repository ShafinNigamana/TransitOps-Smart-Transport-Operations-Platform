"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logout } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  DollarSign,
  BarChart3,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vehicles", href: "/vehicles", icon: Truck },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Trips", href: "/trips", icon: Route },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Fuel Logs", href: "/fuel-logs", icon: Fuel },
  { name: "Expenses", href: "/expenses", icon: DollarSign },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>("fleet_manager");
  const [fullName, setFullName] = React.useState<string>("Operator");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  // Load user profile on mount
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const metaRole = user.user_metadata?.role;
          const metaName = user.user_metadata?.full_name;

          if (metaRole) setUserRole(metaRole);
          if (metaName) setFullName(metaName);

          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

          if (profile) {
            if (profile.role) setUserRole(profile.role);
            if (profile.full_name) setFullName(profile.full_name);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image
              src={logoSrc}
              alt="TransitOps Logo"
              width={140}
              height={35}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-secondary cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? "bg-secondary text-foreground border-l-2 border-fleet-amber"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <User className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground capitalize">
                {fullName}
              </p>
              <span className="inline-flex items-center rounded-full bg-fleet-amber/10 px-2 py-0.5 text-xs font-mono font-medium text-fleet-amber capitalize">
                {userRole.replace("_", " ")}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-150"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-secondary cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold text-foreground capitalize">
              {pathname === "/" ? "Home" : pathname.split("/").pop()?.replace("-", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Content Page Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
