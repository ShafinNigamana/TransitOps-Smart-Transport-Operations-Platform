"use client";

import * as React from "react";
import { Plus, Search, Wrench } from "lucide-react";
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
} from "@/types/database";
import {
  MOCK_MAINTENANCE,
  MOCK_VEHICLES,
} from "@/lib/mock-data";

export function MaintenanceView() {
  const [records, setRecords] =
    React.useState<MaintenanceRecord[]>(MOCK_MAINTENANCE);
  const [vehicles, setVehicles] = React.useState(MOCK_VEHICLES);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | "open" | "closed">(
    "all"
  );
  const [isLogOpen, setIsLogOpen] = React.useState(false);

  const handleLogMaintenance = (input: CreateMaintenanceInput) => {
    const vehicle = vehicles.find((v) => v.id === input.vehicle_id);

    const newRecord: MaintenanceRecord = {
      id: `mnt-${Date.now()}`,
      vehicle_id: input.vehicle_id,
      vehicle,
      maintenance_type: input.maintenance_type,
      description: input.description,
      cost: input.cost,
      status: "open",
      opened_at: new Date().toISOString(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Update linked vehicle status to 'in_shop' per business rule
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === input.vehicle_id ? { ...v, status: "in_shop" } : v
      )
    );
  };

  const handleCloseRepair = (recordId: string) => {
    const record = records.find((r) => r.id === recordId);

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          status: "closed",
          closed_at: new Date().toISOString(),
        };
      })
    );

    // Restore vehicle status to available if not retired
    if (record) {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== record.vehicle_id) return v;
          return v.status === "retired"
            ? v
            : { ...v, status: "available" };
        })
      );
    }
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
          r.description.toLowerCase().includes(q) ||
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
      {/* Header & Log Maintenance Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Fleet Maintenance
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Log workshop work, track active repair tickets, and inspect service
            costs.
          </p>
        </div>

        <Button
          onClick={() => setIsLogOpen(true)}
          className="shrink-0 font-semibold shadow-sm"
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
        vehicles={vehicles}
        onSubmit={handleLogMaintenance}
      />
    </div>
  );
}
