"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { premiumModalCheckIconClass } from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";

export interface SearchableComboboxOption {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
  renderLabel?: React.ReactNode;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  align?: "left" | "right";
  disabled?: boolean;
  /** When false the dropdown grows to fit all items with no internal scroll. Defaults to true. */
  scrollable?: boolean;
}

function filterOptions(
  options: SearchableComboboxOption[],
  query: string
): SearchableComboboxOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter((option) => {
    const haystack = `${option.label} ${option.searchText ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Select",
  emptyMessage = "No matches found",
  align = "right",
  disabled = false,
  scrollable = true,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = filterOptions(options, query);

  // Measure available space and flip upward when there isn't enough room below.
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Each option row is ~44px; add 8px padding buffer.
    const estimatedListHeight = filteredOptions.length * 44 + 8;

    setOpenUpward(
      spaceBelow < estimatedListHeight && spaceAbove > spaceBelow
    );
  }, [isOpen, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  function handleFocus() {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setQuery("");
  }

  function handleBlur() {
    window.setTimeout(() => {
      setIsOpen(false);
      setQuery("");
    }, 150);
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  const displayValue = isOpen ? query : selectedOption?.label ?? "";

  return (
    <div ref={containerRef} className="relative z-50 min-w-0 flex-1">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "w-full border-0 bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0",
          align === "right" ? "text-right" : "text-left",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />

      {isOpen ? (
        <ul className={cn(
          "absolute right-0 z-[100] w-full min-w-[12rem] max-w-xs rounded-lg border border-slate-200 bg-white shadow-lg",
          openUpward ? "bottom-full mb-1" : "top-full mt-1",
          scrollable && "max-h-48 overflow-y-auto"
        )}>
          {filteredOptions.length === 0 ? (
            <li className="p-3 text-sm text-slate-400">{emptyMessage}</li>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 border-b border-slate-100 p-3 text-left text-sm text-slate-700 last:border-0 hover:bg-slate-50",
                      isSelected && "bg-slate-50 font-medium text-slate-900",
                      option.disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span className="min-w-0 truncate">
                      {option.renderLabel ?? option.label}
                    </span>
                    {isSelected ? (
                      <Check className={premiumModalCheckIconClass} />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
