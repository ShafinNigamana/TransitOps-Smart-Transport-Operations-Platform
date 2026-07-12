import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return "Rs. " + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// Operational Cockpit Formulas from SYSTEM_ARCHITECTURE.md §4

export function calculateFuelEfficiency(
  totalDistanceKm: number,
  totalFuelL: number
): number | null {
  if (totalFuelL <= 0) return null;
  return Math.round((totalDistanceKm / totalFuelL) * 100) / 100;
}

export function calculateTotalOperationalCost(
  maintenanceCost: number,
  fuelCost: number,
  otherExpenses: number
): number {
  return Math.round((maintenanceCost + fuelCost + otherExpenses) * 100) / 100;
}

export function calculateVehicleROI(
  revenue: number,
  maintenanceCost: number,
  fuelCost: number,
  acquisitionCost: number
): number | null {
  if (acquisitionCost <= 0) return null;
  const roi = (revenue - (maintenanceCost + fuelCost)) / acquisitionCost;
  return Math.round(roi * 10000) / 10000;
}

export function calculateFleetUtilization(
  activeVehicles: number,
  totalNonRetiredVehicles: number
): number {
  if (totalNonRetiredVehicles === 0) return 0;
  return Math.round((activeVehicles / totalNonRetiredVehicles) * 10000) / 100;
}
