"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppTopHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center bg-[#1e2a3a] px-6">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search transactions, budgets, reports..."
          className="h-9 border-0 bg-[#2a3a4d] pl-9 text-sm text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#268ddd]"
        />
      </div>
    </header>
  );
}
