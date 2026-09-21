"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CompressLevel,
  ImagePageMode,
} from "@/lib/pdf/types";
import type { ToolDef } from "@/lib/pdf/tools-config";

export interface OptionsState {
  compressLevel: CompressLevel;
  imagePageMode: ImagePageMode;
  marginKey: "none" | "small" | "big";
  imageScale: number;
}

export const DEFAULT_OPTIONS: OptionsState = {
  compressLevel: "recommended",
  imagePageMode: "a4-portrait",
  marginKey: "small",
  imageScale: 2,
};

export type OptionKey = keyof OptionsState;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function OptionCard({
  value,
  current,
  onChange,
  title,
  subtitle,
}: {
  value: string;
  current: string;
  onChange: (v: string) => void;
  title: string;
  subtitle?: string;
}) {
  const active = value === current;
  return (
    <Label
      htmlFor={`opt-${value}`}
      className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/50 data-[active=true]:border-[#e5322d] data-[active=true]:bg-red-50/50 dark:data-[active=true]:bg-red-950/20"
      data-active={active}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} checked={active} />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium leading-none">{title}</span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </Label>
  );
}

export function ToolOptions({
  tool,
  options,
  set,
  pageCount,
}: {
  tool: ToolDef;
  options: OptionsState;
  set: <K extends OptionKey>(key: K, value: OptionsState[K]) => void;
  pageCount: number;
}) {
  switch (tool.id) {
    case "merge":
      return (
        <Field
          label="Ordre des fichiers"
          hint="Glissez la poignée ou utilisez les flèches pour changer l'ordre des pages dans le PDF final."
        >
          <p className="text-sm text-muted-foreground">
            Utilisez la liste ci-dessus pour réordonner vos documents.
          </p>
        </Field>
      );

    case "compress":
      return (
        <Field label="Niveau de compression">
          <RadioGroup
            value={options.compressLevel}
            onValueChange={(v) => set("compressLevel", v as CompressLevel)}
            className="gap-3"
          >
            <OptionCard
              value="light"
              current={options.compressLevel}
              onChange={(v) => set("compressLevel", v as CompressLevel)}
              title="Optimisation sans perte"
              subtitle="Qualité identique, réduction modérée"
            />
            <OptionCard
              value="recommended"
              current={options.compressLevel}
              onChange={(v) => set("compressLevel", v as CompressLevel)}
              title="Bonne compression — recommandé"
              subtitle="Excellent compromis qualité / taille"
            />
            <OptionCard
              value="extreme"
              current={options.compressLevel}
              onChange={(v) => set("compressLevel", v as CompressLevel)}
              title="Compression extrême"
              subtitle="Taille minimale, qualité réduite"
            />
          </RadioGroup>
          {options.compressLevel !== "light" && (
            <p className="text-xs text-muted-foreground">
              Ce mode reconstruit le PDF à partir d&apos;images de qualité
              contrôlée : idéal pour les scans et documents visuels, le texte
              devient non sélectionnable.
            </p>
          )}
        </Field>
      );

    case "jpg2pdf":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Format de page">
            <Select
              value={options.imagePageMode}
              onValueChange={(v) => set("imagePageMode", v as ImagePageMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Taille de l&apos;image</SelectItem>
                <SelectItem value="a4-portrait">A4 portrait</SelectItem>
                <SelectItem value="a4-landscape">A4 paysage</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Marge">
            <Select
              value={options.marginKey}
              onValueChange={(v) => set("marginKey", v as OptionsState["marginKey"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                <SelectItem value="small">Petite</SelectItem>
                <SelectItem value="big">Grande</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      );

    case "pdf2jpg":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Résolution">
            <Select
              value={String(options.imageScale)}
              onValueChange={(v) => set("imageScale", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Standard — 72 dpi</SelectItem>
                <SelectItem value="2">Haute — 144 dpi</SelectItem>
                <SelectItem value="3">Très haute — 216 dpi</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Les {pageCount || ""} pages seront converties en JPG puis regroupées
            dans une archive ZIP.
          </p>
        </div>
      );

    case "word2pdf":
    case "pdf2excel":
    case "excel2pdf":
    case "pptx2pdf":
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Aucun réglage nécessaire — la conversion démarre dès que vous cliquez
          sur le bouton.
        </p>
      );
  }
}
