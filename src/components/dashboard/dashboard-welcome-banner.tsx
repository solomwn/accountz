"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MOCK_USER } from "@/lib/mock-dashboard-data";

const tabs = ["Dashboard", "Recent Activity", "Budget Overview"];

export function DashboardWelcomeBanner() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 px-6 py-5">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-[#268ddd] text-base font-semibold text-white">
            {MOCK_USER.initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-normal text-slate-800">
          Hello, {MOCK_USER.name}
        </h1>
      </div>

      <div className="flex border-t border-slate-200 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-4 py-3 text-sm transition-colors",
              activeTab === tab
                ? "font-medium text-[#268ddd]"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#268ddd]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
