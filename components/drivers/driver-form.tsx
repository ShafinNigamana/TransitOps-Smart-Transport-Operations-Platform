"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDriverSchema, type CreateDriverInput } from "@/lib/validations/driver.schema";
import { createDriver } from "@/lib/actions/drivers";
import { Loader2 } from "lucide-react";

interface DriverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LICENSE_CATEGORIES = [
  "Class A Commercial",
  "Class A HazMat",
  "Class B Heavy",
  "Class B General",
  "Class C Standard",
  "Class C Tanker",
];

export function DriverForm({ open, onOpenChange, onSuccess }: DriverFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);

  const resetForm = () => {
    formRef.current?.reset();
    setErrors({});
    setServerError(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    const rawInput: CreateDriverInput = {
      fullName: (formData.get("fullName") as string)?.trim() ?? "",
      licenseNumber: (formData.get("licenseNumber") as string)?.trim() ?? "",
      licenseCategory: (formData.get("licenseCategory") as string) ?? "",
      licenseExpiryDate: (formData.get("licenseExpiryDate") as string) ?? "",
      contactNumber: (formData.get("contactNumber") as string)?.trim() ?? "",
      safetyScore: 100,
    };

    // Client-side Zod validation
    const parsed = createDriverSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createDriver(parsed.data);
      if (result.success) {
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        setServerError(result.error.message);
      }
    } catch {
      setServerError("Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>Register New Driver</DialogTitle>
        <DialogDescription>
          Add a new driver to the operations roster. All fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      {serverError && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 mb-4">
          {serverError}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="driver-name" required>Full Name</Label>
          <Input
            id="driver-name"
            name="fullName"
            placeholder="e.g. Marcus Vance"
            error={errors.fullName}
          />
        </div>

        {/* License Number + Category — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver-license" required>License Number</Label>
            <Input
              id="driver-license"
              name="licenseNumber"
              placeholder="e.g. DL-998234-X"
              error={errors.licenseNumber}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver-category" required>License Category</Label>
            <Select
              id="driver-category"
              name="licenseCategory"
              error={errors.licenseCategory}
              defaultValue=""
            >
              <option value="" disabled>Select category…</option>
              {LICENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Expiry Date + Contact — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver-expiry" required>License Expiry Date</Label>
            <Input
              id="driver-expiry"
              name="licenseExpiryDate"
              type="date"
              error={errors.licenseExpiryDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver-contact" required>Contact Number</Label>
            <Input
              id="driver-contact"
              name="contactNumber"
              type="tel"
              placeholder="e.g. +1 (555) 019-2834"
              error={errors.contactNumber}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Registering…" : "Register Driver"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
