import React, { Suspense } from "react";
import { Metadata } from "next";
import { ExpensesView } from "@/components/expenses/expenses-view";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { createClient } from "@/lib/supabase/server";
import type { Expense, Vehicle } from "@/types/database";

export const metadata: Metadata = {
  title: "Expenses | TransitOps",
  description:
    "Record and manage fleet operating expenses — tolls, fines, parking, and more.",
};

export const revalidate = 0;

async function ExpensesContent() {
  const supabase = await createClient();

  const [expensesRes, vehiclesRes, userRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, vehicle:vehicles(*)")
      .order("expense_date", { ascending: false }),
    supabase.from("vehicles").select("*").order("name"),
    supabase.auth.getUser(),
  ]);

  const expenses = (expensesRes.data ?? []) as Expense[];
  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const userRole = userRes.data.user?.user_metadata?.role || "driver";

  return (
    <ExpensesView
      initialExpenses={expenses}
      initialVehicles={vehicles}
      userRole={userRole}
    />
  );
}

export default function ExpensesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<TableSkeleton />}>
        <ExpensesContent />
      </Suspense>
    </div>
  );
}
