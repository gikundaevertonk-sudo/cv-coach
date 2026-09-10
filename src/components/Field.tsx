"use client";

import { useRef, useState } from "react";
import { Check, Spinner, Upload } from "./icons";
import { MAX_FIELD_CHARS } from "@/lib/analysis/schema";

type PdfState =
  | { status: "idle" }
  | { status: "reading"; name: string }
  | { status: "done"; name: string }
  | { status: "error"; message: string };

/** Labelled textarea with an "Upload PDF" control that fills it via /api/extract. */
export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });
  const over = value.length > MAX_FIELD_CHARS;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the user re-pick the same file after an edit
    if (!file) return;

    setPdf({ status: "reading", name: file.name });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const data: { text?: string; error?: string } = await res.json();

      if (!res.ok || typeof data.text !== "string") {
        setPdf({
          status: "error",
          message: data.error ?? "Could not read that PDF.",
        });
        return;
      }
      onChange(data.text);
      setPdf({ status: "done", name: file.name });
    } catch {
      setPdf({
        status: "error",
        message: "Upload failed. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pdf.status === "reading"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {pdf.status === "reading" ? (
            <>
              <Spinner className="h-3 w-3" />
              Reading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload PDF
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onPickFile}
      />

      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          rows={rows}
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
        />
        <span
          className={`pointer-events-none absolute bottom-2.5 right-2.5 rounded bg-white/80 px-1 text-[11px] tabular-nums backdrop-blur dark:bg-zinc-950/80 ${
            over ? "text-rose-500" : "text-zinc-400"
          }`}
        >
          {value.length.toLocaleString()} / {MAX_FIELD_CHARS.toLocaleString()}
        </span>
      </div>

      {pdf.status === "done" ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>
            Loaded from <span className="font-medium">{pdf.name}</span> — review
            and edit below.
          </span>
        </p>
      ) : null}
      {pdf.status === "error" ? (
        <p className="text-xs text-rose-500">{pdf.message}</p>
      ) : null}
    </div>
  );
}
