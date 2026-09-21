"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  SplitMode,
} from "@/lib/pdf/types";
import type { ToolDef } from "@/lib/pdf/tools-config";

export interface OptionsState {
  splitMode: SplitMode;
  everyN: number;
  ranges: string;
  compressLevel: CompressLevel;
  angle: number;
  imagePageMode: ImagePageMode;
  marginKey: "none" | "small" | "big";
  imageFormat: "png" | "jpeg";
  imageScale: number;
  pnPosition: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
  pnFormat: "n" | "nOfTotal";
  pnStartAt: number;
  pnFontSize: number;
  pnSkipFirst: boolean;
  wmText: string;
  wmFontSize: number;
  wmOpacity: number;
  wmColor: "gray" | "red" | "blue" | "black";
  wmTiled: boolean;
}

export const DEFAULT_OPTIONS: OptionsState = {
  splitMode: "everyN",
  everyN: 2,
  ranges: "1-2",
  compressLevel: "recommended",
  angle: 90,
  imagePageMode: "a4-portrait",
  marginKey: "small",
  imageFormat: "png",
  imageScale: 2,
  pnPosition: "bottom-center",
  pnFormat: "nOfTotal",
  pnStartAt: 1,
  pnFontSize: 12,
  pnSkipFirst: false,
  wmText: "CONFIDENTIEL",
  wmFontSize: 50,
  wmOpacity: 0.25,
  wmColor: "gray",
  wmTiled: false,
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

    case "split":
      return (
        <div className="space-y-4">
          <Field label="Mode de division">
            <RadioGroup
              value={options.splitMode}
              onValueChange={(v) => set("splitMode", v as SplitMode)}
              className="gap-3"
            >
              <OptionCard
                value="all"
                current={options.splitMode}
                onChange={(v) => set("splitMode", v as SplitMode)}
                title="Une page = un fichier"
                subtitle="Chaque page devient un PDF distinct"
              />
              <OptionCard
                value="everyN"
                current={options.splitMode}
                onChange={(v) => set("splitMode", v as SplitMode)}
                title="Toutes les N pages"
                subtitle={`Le document (${pageCount} pages) sera découpé par paquets`}
              />
              <OptionCard
                value="ranges"
                current={options.splitMode}
                onChange={(v) => set("splitMode", v as SplitMode)}
                title="Plages personnalisées"
                subtitle="Ex : 1-3, 5, 8-10 — chaque plage devient un PDF"
              />
            </RadioGroup>
          </Field>
          {options.splitMode === "everyN" && (
            <Field label="Pages par fichier">
              <Input
                type="number"
                min={1}
                max={Math.max(1, pageCount)}
                value={options.everyN}
                onChange={(e) => set("everyN", Math.max(1, +e.target.value || 1))}
                className="w-32"
              />
            </Field>
          )}
          {options.splitMode === "ranges" && (
            <Field
              label="Plages de pages"
              hint={`Document de ${pageCount} pages — séparez par des virgules.`}
            >
              <Input
                value={options.ranges}
                onChange={(e) => set("ranges", e.target.value)}
                placeholder="1-3, 5, 8-10"
              />
            </Field>
          )}
        </div>
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

    case "rotate":
      return (
        <Field label="Angle de rotation (sens horaire)">
          <div className="flex gap-2">
            {[90, 180, 270].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => set("angle", a)}
                className={`flex-1 rounded-xl border-2 py-4 text-center transition-all hover:-translate-y-0.5 ${
                  options.angle === a
                    ? "border-[#8f00e0] bg-purple-50 dark:bg-purple-950/30"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <span className="block text-xl font-bold">{a}°</span>
                <span className="text-xs text-muted-foreground">
                  {a === 90 ? "quart de tour" : a === 180 ? "demi-tour" : "trois quarts"}
                </span>
              </button>
            ))}
          </div>
        </Field>
      );

    case "img2pdf":
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

    case "pdf2img":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Format d'image">
            <Select
              value={options.imageFormat}
              onValueChange={(v) => set("imageFormat", v as "png" | "jpeg")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (sans perte)</SelectItem>
                <SelectItem value="jpeg">JPG (léger)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
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
            Les {pageCount || ""} pages seront converties puis regroupées dans
            une archive ZIP.
          </p>
        </div>
      );

    case "pagenum":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Position">
            <Select
              value={options.pnPosition}
              onValueChange={(v) => set("pnPosition", v as OptionsState["pnPosition"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-center">Bas centre</SelectItem>
                <SelectItem value="bottom-right">Bas droite</SelectItem>
                <SelectItem value="bottom-left">Bas gauche</SelectItem>
                <SelectItem value="top-center">Haut centre</SelectItem>
                <SelectItem value="top-right">Haut droite</SelectItem>
                <SelectItem value="top-left">Haut gauche</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Format">
            <Select
              value={options.pnFormat}
              onValueChange={(v) => set("pnFormat", v as OptionsState["pnFormat"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="n">« 12 »</SelectItem>
                <SelectItem value="nOfTotal">« 12 / 45 »</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Numéro de départ">
            <Input
              type="number"
              min={1}
              value={options.pnStartAt}
              onChange={(e) => set("pnStartAt", Math.max(1, +e.target.value || 1))}
              className="w-28"
            />
          </Field>
          <Field label={`Taille : ${options.pnFontSize} pt`}>
            <Slider
              min={8}
              max={28}
              step={1}
              value={[options.pnFontSize]}
              onValueChange={([v]) => set("pnFontSize", v)}
            />
          </Field>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="skip-first"
              checked={options.pnSkipFirst}
              onCheckedChange={(v) => set("pnSkipFirst", v === true)}
            />
            <Label htmlFor="skip-first" className="text-sm font-normal cursor-pointer">
              Ignorer la première page (couverture)
            </Label>
          </div>
        </div>
      );

    case "watermark":
      return (
        <div className="space-y-4">
          <Field label="Texte du filigrane">
            <Input
              value={options.wmText}
              onChange={(e) => set("wmText", e.target.value)}
              placeholder="CONFIDENTIEL"
              maxLength={40}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Taille : ${options.wmFontSize} pt`}>
              <Slider
                min={16}
                max={120}
                step={2}
                value={[options.wmFontSize]}
                onValueChange={([v]) => set("wmFontSize", v)}
              />
            </Field>
            <Field label={`Opacité : ${Math.round(options.wmOpacity * 100)} %`}>
              <Slider
                min={5}
                max={80}
                step={5}
                value={[Math.round(options.wmOpacity * 100)]}
                onValueChange={([v]) => set("wmOpacity", v / 100)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Couleur">
              <div className="flex gap-2">
                {(
                  [
                    ["gray", "#8c8c8c", "Gris"],
                    ["red", "#d92626", "Rouge"],
                    ["blue", "#3359cc", "Bleu"],
                    ["black", "#1a1a1a", "Noir"],
                  ] as const
                ).map(([val, hex, label]) => (
                  <button
                    key={val}
                    type="button"
                    aria-label={label}
                    onClick={() => set("wmColor", val)}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                      options.wmColor === val
                        ? "border-foreground ring-2 ring-offset-2 ring-foreground/40"
                        : "border-muted"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </Field>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                id="wm-tiled"
                checked={options.wmTiled}
                onCheckedChange={(v) => set("wmTiled", v)}
              />
              <Label htmlFor="wm-tiled" className="text-sm font-normal cursor-pointer">
                Répéter en mosaïque
              </Label>
            </div>
          </div>
        </div>
      );

    case "organize":
    default:
      return null;
  }
}
