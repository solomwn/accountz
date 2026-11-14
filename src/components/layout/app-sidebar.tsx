"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Tags,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "#", label: "Goals", icon: Target },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center bg-[#1e2a3a] px-5">
        <span className="text-sm font-semibold tracking-wide text-white">
          My Finances
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 border-l-[3px] px-5 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-slate-900 bg-slate-100 font-medium text-slate-900"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
