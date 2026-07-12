import { type ClassValue, clsx } from "clsx";

// ponytail: clsx is already in node_modules via shadcn deps; twMerge skipped until shadcn components are added
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Formulas from SYSTEM_ARCHITECTURE.md §4

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
