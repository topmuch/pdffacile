"use client";

import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "./file-dropzone";
import { FileList, type FileEntry } from "./file-list";
import { PageSelector } from "./page-selector";
import {
  ToolOptions,
  DEFAULT_OPTIONS,
  type OptionsState,
} from "./tool-options";
import type { ToolDef } from "@/lib/pdf/tools-config";
import * as proc from "@/lib/pdf/processors";
import type { PdfResult } from "@/lib/pdf/types";

type Phase = "select" | "ready" | "processing" | "done";

let uid = 0;
const nextId = () => `f${++uid}`;

export function ToolWorkspace({
  tool,
  onBack,
}: {
  tool: ToolDef;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [phase, setPhase] = React.useState<Phase>("select");
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const [options, setOptions] = React.useState<OptionsState>(DEFAULT_OPTIONS);
  const [progress, setProgress] = React.useState(0);
  const [progressMsg, setProgressMsg] = React.useState("");
  const [result, setResult] = React.useState<(PdfResult & { sizeDiff?: string }) | null>(null);

  // organize tool state
  const [thumbs, setThumbs] = React.useState<proc.PageThumbnail[]>([]);
  const [thumbsLoading, setThumbsLoading] = React.useState(false);
  const [selectedPages, setSelectedPages] = React.useState<Set<number>>(new Set());
  const [organizeMode, setOrganizeMode] = React.useState<"extract" | "remove">("extract");

  const set = React.useCallback(
    <K extends keyof OptionsState>(key: K, value: OptionsState[K]) =>
      setOptions((o) => ({ ...o, [key]: value })),
    []
  );

  const addFiles = React.useCallback(
    async (files: File[]) => {
      const capped = files.slice(0, tool.maxFiles);
      const newEntries: FileEntry[] = capped.map((file) => ({
        id: nextId(),
        file,
        pages: null,
      }));
      setEntries((prev) => {
        const merged = tool.multiple ? [...prev, ...newEntries] : newEntries;
        return merged.slice(0, tool.maxFiles);
      });
      setPhase("ready");

      // fetch page counts in background
      for (const entry of newEntries) {
        if (entry.file.type === "application/pdf") {
          const pages = await proc.getPdfPageCount(entry.file);
          setEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, pages } : e))
          );
        }
      }
    },
    [tool.multiple, tool.maxFiles]
  );

  // generate thumbnails for organize
  React.useEffect(() => {
    if (tool.id !== "organize" || phase !== "ready") return;
    const first = entries[0];
    if (!first) return;
    let cancelled = false;
    setThumbsLoading(true);
    setThumbs([]);
    setSelectedPages(new Set());
    proc
      .renderPageThumbnails(first.file, 100, 140, (p) => setProgress(p))
      .then((t) => {
        if (!cancelled) {
          setThumbs(t);
          setThumbsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThumbsLoading(false);
          toast({
            title: "Aperçus indisponibles",
            description: "Le PDF est peut-être protégé ou corrompu.",
            variant: "destructive",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tool.id, phase, entries[0]?.id]);

  const reset = () => {
    setPhase("select");
    setEntries([]);
    setResult(null);
    setProgress(0);
    setProgressMsg("");
    setThumbs([]);
    setSelectedPages(new Set());
    setOptions(DEFAULT_OPTIONS);
  };

  const mainFile = entries[0]?.file;
  const pageCount = entries[0]?.pages ?? 0;

  const canRun = React.useMemo(() => {
    if (entries.length < tool.minFiles) return false;
    if (tool.id === "watermark" && !options.wmText.trim()) return false;
    if (tool.id === "organize" && selectedPages.size === 0) return false;
    return true;
  }, [entries.length, tool.id, tool.minFiles, options.wmText, selectedPages.size]);

  const run = async () => {
    if (!canRun) return;
    setPhase("processing");
    setProgress(0);
    setProgressMsg("");
    const onProgress = (p: number, msg?: string) => {
      setProgress(p);
      if (msg) setProgressMsg(msg);
    };
    try {
      let res: PdfResult;
      switch (tool.id) {
        case "merge":
          res = await proc.mergePdfs(entries.map((e) => e.file), onProgress);
          break;
        case "split":
          res = await proc.splitPdf(
            mainFile,
            options.splitMode,
            { everyN: options.everyN, ranges: options.ranges },
            onProgress
          );
          break;
        case "compress": {
          const sizeBefore = mainFile.size;
          res = await proc.compressPdf(mainFile, options.compressLevel, onProgress);
          const ratio = ((1 - res.blob.size / sizeBefore) * 100).toFixed(0);
          res = { ...res, sizeDiff: `${ratio}` };
          break;
        }
        case "rotate":
          res = await proc.rotatePdf(mainFile, options.angle, onProgress);
          break;
        case "img2pdf":
          res = await proc.imagesToPdf(
            entries.map((e) => e.file),
            options.imagePageMode,
            options.marginKey,
            onProgress
          );
          break;
        case "pdf2img":
          res = await proc.pdfToImages(mainFile, options.imageFormat, options.imageScale, onProgress);
          break;
        case "pagenum":
          res = await proc.addPageNumbers(
            mainFile,
            {
              position: options.pnPosition,
              format: options.pnFormat,
              startAt: options.pnStartAt,
              margin: 28,
              fontSize: options.pnFontSize,
              skipFirst: options.pnSkipFirst,
            },
            onProgress
          );
          break;
        case "watermark":
          res = await proc.addWatermark(
            mainFile,
            {
              text: options.wmText,
              fontSize: options.wmFontSize,
              opacity: options.wmOpacity,
              rotation: options.wmTiled ? 0 : 45,
              color: options.wmColor,
              tiled: options.wmTiled,
            },
            onProgress
          );
          break;
        case "organize":
          res = await proc.organizePdf(mainFile, organizeMode, [...selectedPages], onProgress);
          break;
        default:
          throw new Error("Outil inconnu");
      }
      setResult(res);
      setPhase("done");
    } catch (err) {
      toast({
        title: "Oups, une erreur est survenue",
        description:
          err instanceof Error ? err.message : "Le traitement a échoué. Réessayez.",
        variant: "destructive",
      });
      setPhase("ready");
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  /* ----------------------------- rendering ---------------------------- */

  const colorStyle = { ["--tool-color" as string]: tool.color } as React.CSSProperties;

  if (phase === "select") {
    return (
      <div className="space-y-6" style={colorStyle}>
        <FileDropzone
          accept={tool.accept}
          multiple={tool.multiple}
          onFiles={addFiles}
          color={tool.color}
          hint={
            tool.multiple
              ? `Jusqu'à ${tool.maxFiles} fichiers — ${
                  tool.id === "img2pdf" ? "images" : "PDF"
                } uniquement`
              : "Un seul fichier"
          }
        />
        {tool.id === "img2pdf" && (
          <p className="text-center text-xs text-muted-foreground">
            Formats acceptés : JPG, PNG, WebP, GIF, BMP — l&apos;ordre des
            images pourra être ajusté ensuite.
          </p>
        )}
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-10 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg"
          style={{ backgroundColor: tool.color }}
        >
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold">Terminé !</h3>
          <p className="text-sm text-muted-foreground">
            {result.name} — {(result.blob.size / 1024).toFixed(0)} Ko
            {result.sizeDiff && Number(result.sizeDiff) > 0 && (
              <span className="ml-1 font-semibold text-emerald-600">
                (−{result.sizeDiff} %)
              </span>
            )}
          </p>
        </div>
        <Button
          size="lg"
          onClick={download}
          className="h-12 rounded-full px-8 text-base font-semibold text-white"
          style={{ backgroundColor: tool.color }}
        >
          <Download className="mr-2 h-5 w-5" aria-hidden />
          Télécharger
        </Button>
        <Button variant="ghost" onClick={reset} className="text-muted-foreground">
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          Traiter un autre fichier
        </Button>
      </div>
    );
  }

  const busy = phase === "processing";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]" style={colorStyle}>
      {/* Left: files / pages */}
      <div className="space-y-4">
        {tool.id === "organize" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex rounded-lg border p-1">
                {(
                  [
                    ["extract", "Extraire la sélection"],
                    ["remove", "Supprimer la sélection"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOrganizeMode(val)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                      organizeMode === val
                        ? "bg-[#e51e79] text-white"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPages.size} page{selectedPages.size > 1 ? "s" : ""} sur{" "}
                {thumbs.length || pageCount}
              </p>
            </div>
            <PageSelector
              thumbnails={thumbs}
              selected={selectedPages}
              onToggle={(page) =>
                setSelectedPages((prev) => {
                  const next = new Set(prev);
                  if (next.has(page)) next.delete(page);
                  else next.add(page);
                  return next;
                })
              }
              loading={thumbsLoading}
              progress={progress}
            />
          </>
        ) : (
          <>
            <FileList
              entries={entries}
              reorderable={tool.id === "merge" && entries.length > 1}
              onRemove={(id) => {
                const next = entries.filter((e) => e.id !== id);
                setEntries(next);
                if (next.length === 0) reset();
              }}
              onReorder={(next) => setEntries(next)}
            />
            {tool.multiple && entries.length < tool.maxFiles && (
              <FileDropzone
                accept={tool.accept}
                multiple={tool.multiple}
                onFiles={addFiles}
                color={tool.color}
                hint="Ajouter d'autres fichiers"
              />
            )}
          </>
        )}
      </div>

      {/* Right: options + action */}
      <aside className="space-y-5 rounded-2xl border bg-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Réglages
        </h3>
        <ToolOptions tool={tool} options={options} set={set} pageCount={pageCount} />

        {busy && (
          <div className="space-y-2">
            <Progress value={Math.round(progress * 100)} />
            <p className="text-xs text-muted-foreground">
              {progressMsg || "Traitement en cours…"} {Math.round(progress * 100)} %
            </p>
          </div>
        )}

        {busy ? (
          <Button
            disabled
            className="h-12 w-full rounded-full text-base font-semibold text-white"
            style={{ backgroundColor: tool.color }}
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            Traitement…
          </Button>
        ) : (
          <Button
            onClick={run}
            disabled={!canRun}
            className="h-12 w-full rounded-full text-base font-semibold text-white transition-transform hover:scale-[1.02] disabled:hover:scale-100"
            style={{ backgroundColor: tool.color }}
          >
            <Play className="mr-2 h-5 w-5" aria-hidden />
            {tool.title}
          </Button>
        )}

        <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Retour aux outils
        </Button>
      </aside>
    </div>
  );
}
