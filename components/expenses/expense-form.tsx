"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ModalForm } from "@/components/shared/modal-form";
import type { Vehicle, CreateExpenseInput } from "@/types/database";

import { toast } from "sonner";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onSubmit: (data: CreateExpenseInput) => void;
}

const EXPENSE_CATEGORIES = [
  "Toll",
  "Fine",
  "Parking",
  "Insurance",
  "Licensing",
  "Cleaning",
  "Misc",
];

export function ExpenseForm({
  open,
  onOpenChange,
  vehicles,
  onSubmit,
}: ExpenseFormProps) {
  const [vehicleId, setVehicleId] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form state on open change
  React.useEffect(() => {
    if (open) {
      setVehicleId("");
      setCategory("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setErrors({});
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = "Please select an expense category.";
    }

    const amountNum = Number(amount);
    if (amount !== "" && amountNum < 0) {
      newErrors.amount = "Amount cannot be negative.";
    }
    if (!amount) {
      newErrors.amount = "Amount is required.";
    }

    if (!expenseDate) {
      newErrors.expenseDate = "Expense date is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.amount) {
        if (amountNum < 0) {
          toast.error("Amount cannot be negative.");
        } else {
          toast.error("Amount is required.");
        }
      } else {
        toast.error("Please fill in all required fields.");
      }
      return;
    }

    onSubmit({
      vehicle_id: vehicleId || undefined,
      category,
      amount: amountNum,
      expense_date: expenseDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Log Expense"
      description="Record a fleet expense such as tolls, fines, parking, or other operational costs."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="expenseVehicleSelect">
            Vehicle{" "}
            <span className="text-xs text-neutral-400">(optional)</span>
          </Label>
          <Select
            id="expenseVehicleSelect"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">No specific vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registration_number})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label required htmlFor="expenseCategory">
            Category
          </Label>
          <Select
            id="expenseCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={errors.category}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required htmlFor="expenseAmount">
              Amount ($ USD)
            </Label>
            <Input
              id="expenseAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 45.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="expenseDate">
              Expense Date
            </Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              error={errors.expenseDate}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expenseNotes">Notes</Label>
          <textarea
            id="expenseNotes"
            rows={3}
            placeholder="Additional details about this expense..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Log Expense</Button>
        </div>
      </form>
    </ModalForm>
  );
}
