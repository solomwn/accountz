"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { premiumModalCheckIconClass } from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";

export interface CreatableComboboxOption {
  /** The display text shown in the list. */
  label: string;
  /** Optional dot color (CSS color string, e.g. "#ef4444"). */
  color?: string;
  /** Arbitrary extra data attached to the option (e.g. categoryId). */
  meta?: Record<string, string>;
}

interface CreatableComboboxProps {
  /** The current free-text value (controlled). */
  value: string;
  /** Called on every keystroke with the new raw text. */
  onChange: (value: string) => void;
  /** Called when the user picks an existing option from the list. */
  onSelect?: (option: CreatableComboboxOption) => void;
  options: CreatableComboboxOption[];
  placeholder?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

export function CreatableCombobox({
  value,
  onChange,
  onSelect,
  options,
  placeholder = "Type to search or create…",
  align = "right",
  disabled = false,
}: CreatableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value;
  const filteredOptions =
    query.trim().length > 0
      ? options.filter((option) =>
          option.label.toLowerCase().includes(query.trim().toLowerCase())
        )
      : [];

  const showDropdown = isOpen && filteredOptions.length > 0;

  // Flip upward when there isn't enough space below.
  useEffect(() => {
    if (!showDropdown || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedListHeight = filteredOptions.length * 44 + 8;

    setOpenUpward(
      spaceBelow < estimatedListHeight && spaceAbove > spaceBelow
    );
  }, [showDropdown, filteredOptions.length]);

  useEffect(() => {
    if (!showDropdown) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showDropdown]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setIsOpen(true);
  }

  function handleFocus() {
    if (disabled) return;
    setIsOpen(true);
  }

  function handleBlur() {
    window.setTimeout(() => setIsOpen(false), 150);
  }

  function handleSelect(option: CreatableComboboxOption) {
    onChange(option.label);
    onSelect?.(option);
    setIsOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative z-50 min-w-0 flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        onChange={handleChange}
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

      {showDropdown ? (
        <ul className={cn(
          "absolute right-0 z-[100] w-full min-w-[12rem] max-w-xs overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg",
          openUpward ? "bottom-full mb-1" : "top-full mt-1"
        )}>
          {filteredOptions.map((option) => {
            const isSelected =
              option.label.toLowerCase() === value.trim().toLowerCase();

            return (
              <li key={option.label}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 border-b border-slate-100 p-3 text-left text-sm text-slate-700 last:border-0 hover:bg-slate-50",
                    isSelected && "bg-slate-50 font-medium text-slate-900"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: option.color ?? "#94a3b8" }}
                    />
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected ? (
                    <Check className={premiumModalCheckIconClass} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
