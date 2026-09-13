"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "./icons";
import { WORLD_COUNTRIES } from "@/lib/countries";

const OPTIONS: [code: string, name: string][] = [
  ["", "Any / board default"],
  ...WORLD_COUNTRIES,
];

/** Searchable, scrollable country picker — a combobox, not a native <select>. */
export function CountrySelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OPTIONS;
    return OPTIONS.filter(
      ([code, name]) => name.toLowerCase().includes(q) || code === q,
    );
  }, [query]);

  const selectedLabel =
    OPTIONS.find(([code]) => code === value)?.[1] ?? "Any / board default";

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setHighlight(Math.max(0, OPTIONS.findIndex(([code]) => code === value)));
    setOpen(true);
  }

  function pick(code: string) {
    onChange(code);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt[0]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={rootRef}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
        >
          <span className={`truncate ${value ? "" : "text-zinc-500"}`}>
            {selectedLabel}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search countries…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                role="combobox"
                aria-expanded={open}
                aria-controls={`${id}-listbox`}
              />
            </div>
            <ul
              ref={listRef}
              id={`${id}-listbox`}
              role="listbox"
              className="max-h-56 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-400">
                  No countries match &ldquo;{query}&rdquo;.
                </li>
              ) : (
                filtered.map(([code, name], i) => (
                  <li key={code || "any"} data-index={i}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === code}
                      onClick={() => pick(code)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        i === highlight
                          ? "bg-violet-50 dark:bg-violet-950/40"
                          : ""
                      } ${
                        value === code
                          ? "font-medium text-violet-700 dark:text-violet-300"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      {value === code ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
