"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DismissableLayerBranch } from "@radix-ui/react-dismissable-layer";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransactionSelectOption {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
}

interface TransactionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TransactionSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

const ROW_HEIGHT = 36;
const MAX_VISIBLE_ROWS = 7;
const SEARCH_THRESHOLD = 5;

function filterOptions(
  options: TransactionSelectOption[],
  query: string
): TransactionSelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(({ label, searchText }) =>
    `${label} ${searchText ?? ""}`.toLowerCase().includes(q)
  );
}

export function TransactionSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  emptyMessage = "No options",
  disabled = false,
}: TransactionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = filterOptions(options, query);
  const showSearch = options.length > SEARCH_THRESHOLD;
  const needsScroll = filtered.length > MAX_VISIBLE_ROWS;

  function computePanelStyle() {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const searchHeight = showSearch ? 36 : 0;
    const listHeight = Math.min(filtered.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;
    const panelHeight = searchHeight + listHeight + 2;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;

    const minWidth = Math.max(rect.width, 192);

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      minWidth,
      maxWidth: 320,
      right: Math.max(0, window.innerWidth - rect.right),
      pointerEvents: "auto",
    };

    if (openUp) {
      style.bottom = window.innerHeight - rect.top + 4;
    } else {
      style.top = rect.bottom + 4;
    }

    setPanelStyle(style);
  }

  useEffect(() => {
    if (!open) return;

    computePanelStyle();

    if (showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) return;

    function handleDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setQuery("");
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    function handleResize() {
      computePanelStyle();
    }

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSelect(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className={cn(
          "flex min-w-0 flex-1 items-center justify-end gap-1 text-sm",
          selected ? "text-slate-500" : "text-slate-400",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <DismissableLayerBranch>
              <div
                ref={panelRef}
                style={panelStyle}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                {showSearch ? (
                  <div className="border-b border-slate-100 px-3 py-2">
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                ) : null}

                <ul
                  className={cn(needsScroll && "overflow-y-auto")}
                  style={
                    needsScroll
                      ? { maxHeight: MAX_VISIBLE_ROWS * ROW_HEIGHT }
                      : undefined
                  }
                >
                  {filtered.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-400">
                      {emptyMessage}
                    </li>
                  ) : (
                    filtered.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <li key={option.value}>
                          <button
                            type="button"
                            disabled={option.disabled}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!option.disabled) handleSelect(option.value);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 text-left text-sm last:border-0",
                              isSelected
                                ? "bg-slate-50 font-medium text-slate-900"
                                : "text-slate-700 hover:bg-slate-50",
                              option.disabled && "cursor-not-allowed opacity-40"
                            )}
                            style={{ height: ROW_HEIGHT }}
                          >
                            <span className="min-w-0 truncate">{option.label}</span>
                            {isSelected ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </DismissableLayerBranch>,
            document.body
          )
        : null}
    </>
  );
}
