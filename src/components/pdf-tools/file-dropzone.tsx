"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  onInvalidFiles?: (rejected: string[]) => void;
  color: string;
  disabled?: boolean;
  hint?: string;
}

function prettyAccept(accept: string): string {
  if (accept === "application/pdf") return "PDF";
  if (accept.includes("image/jpeg")) return "JPG";
  if (accept.startsWith("image/")) return "JPG, PNG, WebP…";
  if (accept.includes(".docx")) return "Word (.docx)";
  if (accept.includes(".pptx")) return "PowerPoint (.pptx)";
  if (accept.includes(".xlsx")) return "Excel (.xlsx, .csv)";
  return accept;
}

/** Build a matcher from the `accept` attribute (MIME types + extensions). */
function buildAcceptMatcher(accept: string): (file: File) => boolean {
  const mimes: string[] = [];
  const exts: string[] = [];
  for (const part of accept.split(",")) {
    const token = part.trim().toLowerCase();
    if (!token) continue;
    if (token.startsWith(".")) exts.push(token);
    else mimes.push(token);
  }
  return (file) => {
    const type = (file.type || "").toLowerCase();
    const name = file.name.toLowerCase();
    if (exts.some((ext) => name.endsWith(ext))) return true;
    if (mimes.includes(type)) return true;
    // Wildcard MIME groups like image/*
    if (mimes.some((m) => m.endsWith("/*") && type.startsWith(m.slice(0, -1)))) {
      return true;
    }
    // jpg/jpeg fallback via extension when MIME is missing
    if (mimes.includes("image/jpeg") && /\.jpe?g$/.test(name)) return true;
    return false;
  };
}

export function FileDropzone({
  accept,
  multiple,
  onFiles,
  onInvalidFiles,
  color,
  disabled,
  hint,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || disabled) return;
      const files = Array.from(list);
      const matcher = buildAcceptMatcher(accept);
      const valid = files.filter(matcher);
      const rejected = files.filter((f) => !matcher(f)).map((f) => f.name);
      if (rejected.length && onInvalidFiles) onInvalidFiles(rejected);
      if (valid.length) onFiles(multiple ? valid : [valid[0]]);
    },
    [disabled, multiple, onFiles, onInvalidFiles, accept]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Zone de dépôt de fichiers"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-card px-6 py-14 text-center transition-all duration-200",
        "hover:border-[var(--dz-color)] hover:bg-accent/40",
        dragging && "border-[var(--dz-color)] bg-accent/60 scale-[1.01]",
        disabled && "pointer-events-none opacity-50"
      )}
      style={{ ["--dz-color" as string]: color, borderColor: dragging ? color : undefined }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: color }}
      >
        <UploadCloud className="h-9 w-9" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold">
          {dragging ? "Relâchez pour ajouter" : "Glissez vos fichiers ici"}
        </p>
        <p className="text-sm text-muted-foreground">
          ou parcourez vos documents — format {prettyAccept(accept)}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span
        className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow transition-transform group-hover:-translate-y-0.5"
        style={{ backgroundColor: color }}
      >
        <FileUp className="h-4 w-4" aria-hidden />
        Sélectionner des fichiers
      </span>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        Traitement 100 % local — vos fichiers ne quittent jamais votre appareil
      </p>
    </div>
  );
}
