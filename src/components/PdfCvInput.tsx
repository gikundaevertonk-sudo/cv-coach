"use client";

import { useRef, useState } from "react";
import { Check, Spinner, Upload, Warning } from "./icons";
import { MAX_FIELD_CHARS } from "@/lib/analysis/schema";

type Status =
  | { kind: "idle" }
  | { kind: "reading"; name: string }
  | { kind: "loaded"; name: string | null }
  | { kind: "error"; message: string };

/**
 * The primary CV input for job search: a PDF dropzone first, with "paste
 * text instead" as a fallback. Once there's content, it collapses to a
 * compact summary with Edit / Replace.
 */
export function PdfCvInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [editing, setEditing] = useState(false);

  const hasContent = value.trim().length > 0;
  const over = value.length > MAX_FIELD_CHARS;

  async function ingest(file: File) {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setStatus({ kind: "error", message: "Only PDF files are supported here." });
      return;
    }

    setStatus({ kind: "reading", name: file.name });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const data: { text?: string; error?: string } = await res.json();

      if (!res.ok || typeof data.text !== "string") {
        setStatus({
          kind: "error",
          message: data.error ?? "Could not read that PDF.",
        });
        return;
      }
      onChange(data.text);
      setStatus({ kind: "loaded", name: file.name });
    } catch {
      setStatus({
        kind: "error",
        message: "Upload failed. Check your connection and try again.",
      });
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void ingest(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void ingest(file);
  }

  function replace() {
    onChange("");
    setStatus({ kind: "idle" });
    setPasteMode(false);
    setEditing(false);
  }

  const reading = status.kind === "reading";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">Your CV</label>
        {hasContent && !reading ? (
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {editing ? "Hide text" : "Edit text"}
            </button>
            <button
              type="button"
              onClick={replace}
              className="font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Replace
            </button>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onPickFile}
      />

      {!hasContent ? (
        pasteMode ? (
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste your CV as plain text."
              rows={8}
              autoFocus
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
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !reading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            aria-label="Upload your CV as a PDF"
            className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-violet-500 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/20"
                : "border-zinc-300 bg-zinc-50/60 hover:border-violet-400 hover:bg-violet-50/40 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-violet-600 dark:hover:bg-violet-950/10"
            }`}
          >
            {reading ? (
              <>
                <Spinner className="h-6 w-6 text-violet-600" />
                <p className="text-sm font-medium">
                  Reading {(status as { name: string }).name}…
                </p>
              </>
            ) : (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                  <Upload className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold">
                  Drop your CV here, or click to upload
                </p>
                <p className="text-xs text-zinc-500">PDF, up to 10 MB</p>
              </>
            )}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            {status.kind === "loaded" && status.name
              ? `CV loaded from ${status.name}`
              : "CV text ready"}
            <span className="font-normal text-emerald-700/70 dark:text-emerald-400/70">
              ({value.trim().length.toLocaleString()} characters)
            </span>
          </p>
        </div>
      )}

      {!hasContent && !pasteMode ? (
        <button
          type="button"
          onClick={() => setPasteMode(true)}
          className="self-center text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Or paste your CV as text
        </button>
      ) : null}
      {!hasContent && pasteMode ? (
        <button
          type="button"
          onClick={() => setPasteMode(false)}
          className="self-center text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Upload a PDF instead
        </button>
      ) : null}

      {status.kind === "error" ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-500">
          <Warning className="h-3.5 w-3.5 shrink-0" />
          {status.message}
        </p>
      ) : null}

      {hasContent && editing ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
          />
          <span
            className={`pointer-events-none absolute bottom-2.5 right-2.5 rounded bg-white/80 px-1 text-[11px] tabular-nums backdrop-blur dark:bg-zinc-950/80 ${
              over ? "text-rose-500" : "text-zinc-400"
            }`}
          >
            {value.length.toLocaleString()} / {MAX_FIELD_CHARS.toLocaleString()}
          </span>
        </div>
      ) : null}
    </div>
  );
}
