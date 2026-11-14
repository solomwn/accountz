"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const tabs = ["Empresa", "Impuestos", "Nóminas", "Seguros"];

export function DashboardFilters() {
  const [activeTab, setActiveTab] = useState("Empresa");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <Select defaultValue="this-year">
        <SelectTrigger className="h-9 w-[140px] border-slate-200 bg-white shadow-sm">
          <SelectValue placeholder="Este año" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this-year">Este año</SelectItem>
          <SelectItem value="last-year">Año pasado</SelectItem>
          <SelectItem value="this-quarter">Este trimestre</SelectItem>
          <SelectItem value="this-month">Este mes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
