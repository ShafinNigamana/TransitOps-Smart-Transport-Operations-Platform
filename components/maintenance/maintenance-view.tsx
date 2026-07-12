"use client";

import * as React from "react";
import { Plus, Search, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MaintenanceTable } from "@/components/maintenance/maintenance-columns";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import {
  CreateMaintenanceInput,
  MaintenanceRecord,
  Vehicle,
} from "@/types/database";
import {
  createMaintenanceRecord,
  closeMaintenanceRecord,
} from "@/lib/actions/maintenance";

import { toast } from "sonner";

interface MaintenanceViewProps {
  initialRecords: MaintenanceRecord[];
  initialVehicles: Vehicle[];
}

export function MaintenanceView({
  initialRecords,
  initialVehicles,
}: MaintenanceViewProps) {
  const [records, setRecords] =
    React.useState<MaintenanceRecord[]>(initialRecords);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | "open" | "closed">(
    "all"
  );
  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Sync client state with server component updates
  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  const handleLogMaintenance = (input: CreateMaintenanceInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createMaintenanceRecord(input);
      if (res.success) {
        toast.success("Maintenance record logged successfully and vehicle grounded.");
        setIsLogOpen(false);
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const handleCloseRepair = (recordId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await closeMaintenanceRecord(recordId);
      if (res.success) {
        toast.success("Maintenance record closed. Vehicle is now available.");
      } else {
        toast.error(res.error.message);
        setErrorMessage(res.error.message);
      }
    });
  };

  const filterRecords = (statusFilter: "all" | "open" | "closed") => {
    return records
      .filter((r) => {
        if (statusFilter === "all") return true;
        return r.status === statusFilter;
      })
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.maintenance_type.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.vehicle?.name.toLowerCase().includes(q) ||
          r.vehicle?.registration_number.toLowerCase().includes(q)
        );
      });
  };

  const counts = {
    all: records.length,
    open: records.filter((r) => r.status === "open").length,
    closed: records.filter((r) => r.status === "closed").length,
  };

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

      {/* Header & Log Maintenance Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Fleet Maintenance
              {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Log workshop work, track active repair tickets, and inspect service
            costs.
          </p>
        </div>

        <Button
          onClick={() => setIsLogOpen(true)}
          className="shrink-0 font-semibold shadow-sm cursor-pointer"
          disabled={isPending}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Log Maintenance
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "all" | "open" | "closed")
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" count={counts.all}>
              All Records
            </TabsTrigger>
            <TabsTrigger value="open" count={counts.open}>
              Open Repairs
            </TabsTrigger>
            <TabsTrigger value="closed" count={counts.closed}>
              Closed History
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search vehicle, repair type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <MaintenanceTable
            records={filterRecords("all")}
            onCloseRepair={handleCloseRepair}
          />
        </TabsContent>

        <TabsContent value="open" className="mt-4">
          <MaintenanceTable
            records={filterRecords("open")}
            onCloseRepair={handleCloseRepair}
          />
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <MaintenanceTable
            records={filterRecords("closed")}
            onCloseRepair={handleCloseRepair}
          />
        </TabsContent>
      </Tabs>

      {/* Log Maintenance Dialog */}
      <MaintenanceForm
        open={isLogOpen}
        onOpenChange={setIsLogOpen}
        // Filter out vehicles that are on trip; available/in_shop/retired can be logged
        vehicles={vehicles.filter((v) => v.status !== "on_trip")}
        onSubmit={handleLogMaintenance}
      />
    </div>
  );
}
