"use client";

import * as React from "react";
import { Plus, Search, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState } from "@/components/shared/empty-state";
import type { Expense, Vehicle, CreateExpenseInput } from "@/types/database";
import { createExpense } from "@/lib/actions/fuel-and-expenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ExpensesViewProps {
  initialExpenses: Expense[];
  initialVehicles: Vehicle[];
  userRole?: string;
}

const CATEGORY_VARIANT: Record<string, "warning" | "danger" | "info" | "secondary" | "success"> = {
  Toll: "info",
  Fine: "danger",
  Parking: "warning",
  Insurance: "success",
  Licensing: "info",
  Cleaning: "secondary",
  Misc: "secondary",
};

export function ExpensesView({
  initialExpenses,
  initialVehicles,
  userRole = "driver",
}: ExpensesViewProps) {
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const canWrite = userRole === "financial_analyst" || userRole === "driver";

  React.useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const handleLogExpense = (input: CreateExpenseInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createExpense(input);
      if (res.success) {
        toast.success("Expense logged successfully!");
        setIsLogOpen(false);
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const filteredExpenses = expenses.filter((exp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      exp.category?.toLowerCase().includes(q) ||
      exp.vehicle?.name?.toLowerCase().includes(q) ||
      exp.vehicle?.registration_number?.toLowerCase().includes(q) ||
      exp.notes?.toLowerCase().includes(q) ||
      String(exp.amount).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Log Expense Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-fleet-amber/10 flex items-center justify-center text-fleet-amber">
              <DollarSign className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Expenses
              {isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track tolls, fines, parking, and other fleet operating expenses.
          </p>
        </div>

        {canWrite && (
          <Button
            onClick={() => setIsLogOpen(true)}
            className="shrink-0 font-semibold shadow-sm cursor-pointer"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Log Expense
          </Button>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search category, vehicle, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Vehicle</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses recorded"
                    description={
                      searchQuery.trim()
                        ? "Try adjusting your search query."
                        : "Click 'Log Expense' to add an operational cost."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((exp) => (
                <TableRow key={exp.id} className="cursor-pointer">
                  <TableCell>
                    <Badge
                      variant={
                        CATEGORY_VARIANT[exp.category] ?? "secondary"
                      }
                    >
                      {exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(Number(exp.amount))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(exp.expense_date)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {exp.vehicle ? (
                      <div>
                        <p className="text-sm font-medium">
                          {exp.vehicle.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp.vehicle.registration_number}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Fleet-wide
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {exp.notes || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Expense Dialog */}
      <ExpenseForm
        open={isLogOpen}
        onOpenChange={setIsLogOpen}
        vehicles={initialVehicles}
        onSubmit={handleLogExpense}
      />
    </div>
  );
}
