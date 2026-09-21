"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PageThumbnail } from "@/lib/pdf/types";

export function PageSelector({
  thumbnails,
  selected,
  onToggle,
  loading,
  progress,
}: {
  thumbnails: PageThumbnail[];
  selected: Set<number>;
  onToggle: (page: number) => void;
  loading: boolean;
  progress: number;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Génération des aperçus… {Math.round(progress * 100)} %
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-y-auto rounded-xl border bg-card p-4 [scrollbar-width:thin]">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {thumbnails.map((thumb) => {
          const isSelected = selected.has(thumb.page);
          return (
            <button
              key={thumb.page}
              type="button"
              onClick={() => onToggle(thumb.page)}
              aria-pressed={isSelected}
              aria-label={`Page ${thumb.page}`}
              className={cn(
                "group relative overflow-hidden rounded-lg border-2 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                isSelected
                  ? "border-[#e51e79] ring-2 ring-[#e51e79]/30"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <img
                src={thumb.dataUrl}
                alt={`Aperçu de la page ${thumb.page}`}
                className="aspect-[3/4] w-full object-contain"
                loading="lazy"
              />
              <span
                className={cn(
                  "absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow",
                  isSelected ? "bg-[#e51e79]" : "bg-black/60"
                )}
              >
                {thumb.page}
              </span>
              {isSelected && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e51e79] text-white shadow">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
