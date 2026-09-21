"use client";

import type {
  CompressLevel,
  ImagePageMode,
  PageNumberOptions,
  PdfResult,
  PageThumbnail,
  ProgressCallback,
  SplitMode,
  WatermarkOptions,
} from "./types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

async function readBytes(file: File | Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

function stripExt(name: string): string {
  return name.replace(/\.[^./\\]+$/, "");
}

function toBlob(bytes: Uint8Array, mime = "application/pdf"): Blob {
  return new Blob([bytes as BlobPart], { type: mime });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

/** Parse "1-3, 5, 8-10" into a sorted unique list of page numbers. */
export function parsePageRanges(input: string, maxPage: number): number[] {
  const pages = new Set<number>();
  for (const part of input.split(/[,;\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (match) {
      const from = Math.min(+match[1], +match[2]);
      const to = Math.max(+match[1], +match[2]);
      for (let i = from; i <= to; i++) {
        if (i >= 1 && i <= maxPage) pages.add(i);
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= maxPage) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg",
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Conversion canvas échouée"))),
      format === "png" ? "image/png" : "image/jpeg",
      quality
    );
  });
}

async function renderPageToCanvas(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  } as Parameters<typeof page.render>[0]).promise;
  return canvas;
}

/** Cap rendering scale so canvas never exceeds ~4096px on its longest side. */
function cappedScale(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number,
  maxPx = 4096
): number {
  const base = page.getViewport({ scale: 1 });
  const longest = Math.max(base.width, base.height);
  if (longest * scale <= maxPx) return scale;
  return Math.max(0.1, maxPx / longest);
}

/* ------------------------------------------------------------------ */
/* Inspection                                                          */
/* ------------------------------------------------------------------ */

export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(await readBytes(file), {
      ignoreEncryption: true,
    });
    return doc.getPageCount();
  } catch {
    return 0;
  }
}

export async function getPdfInfo(file: File): Promise<{
  pages: number;
  size: string;
}> {
  const pages = await getPdfPageCount(file);
  return { pages, size: formatBytes(file.size) };
}

export async function renderPageThumbnails(
  file: File,
  maxPages = 60,
  width = 120,
  onProgress?: ProgressCallback
): Promise<PageThumbnail[]> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await readBytes(file) });
  const doc = await loadingTask.promise;
  const count = Math.min(doc.numPages, maxPages);
  const thumbs: PageThumbnail[] = [];
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = width / base.width;
    const canvas = await renderPageToCanvas(page, scale);
    thumbs.push({ page: i, dataUrl: canvas.toDataURL("image/jpeg", 0.8) });
    onProgress?.(i / count, `Aperçu page ${i}/${count}`);
  }
  await loadingTask.destroy();
  return thumbs;
}

/* ------------------------------------------------------------------ */
/* 1. Merge                                                            */
/* ------------------------------------------------------------------ */

export async function mergePdfs(
  files: File[],
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  if (files.length < 2) throw new Error("Sélectionnez au moins 2 fichiers PDF.");
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  merged.setTitle("Document fusionné");
  for (let i = 0; i < files.length; i++) {
    const src = await PDFDocument.load(await readBytes(files[i]), {
      ignoreEncryption: true,
    });
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    onProgress?.((i + 1) / files.length, `Ajout de ${files[i].name}`);
  }
  const bytes = await merged.save({ useObjectStreams: true });
  return { name: "document-fusionne.pdf", blob: toBlob(bytes) };
}

/* ------------------------------------------------------------------ */
/* 2. Split                                                            */
/* ------------------------------------------------------------------ */

export async function splitPdf(
  file: File,
  mode: SplitMode,
  options: { everyN?: number; ranges?: string },
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: true,
  });
  const total = src.getPageCount();
  const groups: number[][] = [];

  if (mode === "all") {
    for (let i = 0; i < total; i++) groups.push([i]);
  } else if (mode === "everyN") {
    const n = Math.max(1, Math.min(options.everyN ?? 2, total));
    for (let i = 0; i < total; i += n) {
      groups.push(
        Array.from({ length: Math.min(n, total - i) }, (_, k) => i + k)
      );
    }
  } else {
    const pages = parsePageRanges(options.ranges ?? "", total);
    if (pages.length === 0)
      throw new Error(
        `Plage invalide. Exemple valide : 1-3, 5 (le document compte ${total} pages).`
      );
    let current: number[] = [];
    for (const p of pages) {
      if (current.length === 0 || p === current[current.length - 1] + 1) {
        current.push(p);
      } else {
        groups.push(current);
        current = [p];
      }
    }
    if (current.length) groups.push(current);
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const base = stripExt(file.name);

  for (let g = 0; g < groups.length; g++) {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, groups[g]);
    copied.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    const first = groups[g][0] + 1;
    const last = groups[g][groups[g].length - 1] + 1;
    const label =
      first === last ? `page_${first}` : `pages_${first}-${last}`;
    zip.file(`${base}_${label}.pdf`, bytes);
    onProgress?.((g + 1) / groups.length, `Extraction ${g + 1}/${groups.length}`);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { name: `${base}_divise.zip`, blob };
}

/* ------------------------------------------------------------------ */
/* 3. Compress                                                         */
/* ------------------------------------------------------------------ */

export async function compressPdf(
  file: File,
  level: CompressLevel,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const base = stripExt(file.name);

  if (level === "light") {
    // Lossless optimization: re-save with object streams.
    const { PDFDocument } = await import("pdf-lib");
    const src = await PDFDocument.load(await readBytes(file), {
      ignoreEncryption: true,
    });
    const bytes = await src.save({ useObjectStreams: true });
    onProgress?.(1, "Optimisation terminée");
    return { name: `${base}_optimise.pdf`, blob: toBlob(bytes) };
  }

  const settings =
    level === "recommended"
      ? { scale: 1.5, quality: 0.72 }
      : { scale: 1.1, quality: 0.42 };

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await readBytes(file) });
  const doc = await loadingTask.promise;
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const scale = cappedScale(page, settings.scale);
    const canvas = await renderPageToCanvas(page, scale);
    const jpegBlob = await canvasToBlob(canvas, "jpeg", settings.quality);
    canvas.width = 0;
    canvas.height = 0;
    const image = await out.embedJpg(new Uint8Array(await jpegBlob.arrayBuffer()));
    const baseViewport = page.getViewport({ scale: 1 });
    const p = out.addPage([baseViewport.width, baseViewport.height]);
    p.drawImage(image, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
    page.cleanup();
    onProgress?.(i / doc.numPages, `Compression page ${i}/${doc.numPages}`);
  }

  await loadingTask.destroy();
  const bytes = await out.save({ useObjectStreams: true });
  return { name: `${base}_compresse.pdf`, blob: toBlob(bytes) };
}

/* ------------------------------------------------------------------ */
/* 4. Rotate                                                           */
/* ------------------------------------------------------------------ */

export async function rotatePdf(
  file: File,
  angle: number,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const doc = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: true,
  });
  doc.getPages().forEach((page) => {
    const current = page.getRotation().angle ?? 0;
    page.setRotation(degrees((current + angle + 360) % 360));
  });
  const bytes = await doc.save();
  onProgress?.(1);
  return {
    name: `${stripExt(file.name)}_pivote.pdf`,
    blob: toBlob(bytes),
  };
}

/* ------------------------------------------------------------------ */
/* 5. Images → PDF                                                     */
/* ------------------------------------------------------------------ */

export async function imagesToPdf(
  files: File[],
  mode: ImagePageMode,
  margin: number,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const A4 = { w: 595.28, h: 841.89 };
  const margins = { none: 0, small: 24, big: 56 } as const;
  const m = margins[margin as keyof typeof margins] ?? 24;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const bytes = await readBytes(file);
    let image;
    try {
      if (file.type === "image/png") {
        image = await doc.embedPng(bytes);
      } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
        image = await doc.embedJpg(bytes);
      } else {
        // webp, gif, bmp, etc. → convert via canvas
        const bitmap = await createImageBitmap(
          new Blob([bytes as BlobPart], { type: file.type || "image/png" })
        );
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
        const jpeg = await canvasToBlob(canvas, "jpeg", 0.92);
        image = await doc.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
        bitmap.close();
        canvas.width = 0;
        canvas.height = 0;
      }
    } catch {
      throw new Error(`Impossible de lire l'image « ${file.name} ».`);
    }

    if (mode === "auto") {
      const page = doc.addPage([image.width + m * 2, image.height + m * 2]);
      page.drawImage(image, {
        x: m,
        y: m,
        width: image.width,
        height: image.height,
      });
    } else {
      const pw = mode === "a4-portrait" ? A4.w : A4.h;
      const ph = mode === "a4-portrait" ? A4.h : A4.w;
      const page = doc.addPage([pw, ph]);
      const maxW = pw - m * 2;
      const maxH = ph - m * 2;
      const ratio = Math.min(maxW / image.width, maxH / image.height);
      const w = image.width * ratio;
      const h = image.height * ratio;
      page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    onProgress?.((i + 1) / files.length, `Intégration de ${file.name}`);
  }

  const bytes = await doc.save();
  return { name: "images-converties.pdf", blob: toBlob(bytes) };
}

/* ------------------------------------------------------------------ */
/* 6. PDF → Images                                                     */
/* ------------------------------------------------------------------ */

export async function pdfToImages(
  file: File,
  format: "png" | "jpeg",
  scale: number,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await readBytes(file) });
  const doc = await loadingTask.promise;
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const base = stripExt(file.name);
  const ext = format === "jpeg" ? "jpg" : "png";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const s = cappedScale(page, scale);
    const canvas = await renderPageToCanvas(page, s);
    const blob = await canvasToBlob(canvas, format, 0.95);
    zip.file(`${base}_page_${String(i).padStart(3, "0")}.${ext}`, blob);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    onProgress?.(i / doc.numPages, `Conversion page ${i}/${doc.numPages}`);
  }

  await loadingTask.destroy();
  const zipped = await zip.generateAsync({ type: "blob" });
  return { name: `${base}_images.zip`, blob: zipped };
}

/* ------------------------------------------------------------------ */
/* 7. Page numbers                                                     */
/* ------------------------------------------------------------------ */

export async function addPageNumbers(
  file: File,
  options: PageNumberOptions,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: true,
  });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const startIdx = options.skipFirst ? 1 : 0;
  const totalNumbered = pages.length - startIdx;
  const lastNumber = options.startAt + Math.max(0, totalNumbered - 1);
  let counter = options.startAt;

  for (let i = 0; i < pages.length; i++) {
    if (i < startIdx) continue;
    const page = pages[i];
    const { width, height } = page.getSize();
    const label =
      options.format === "n"
        ? `${counter}`
        : `${counter} / ${lastNumber}`;
    const tw = font.widthOfTextAtSize(label, options.fontSize);
    const m = options.margin;

    let x: number;
    if (options.position.endsWith("left")) x = m;
    else if (options.position.endsWith("center")) x = (width - tw) / 2;
    else x = width - tw - m;

    const y = options.position.startsWith("top")
      ? height - m - options.fontSize
      : m;

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    counter++;
    onProgress?.(i / pages.length, `Numérotation page ${i + 1}/${pages.length}`);
  }

  const bytes = await doc.save();
  onProgress?.(1);
  return {
    name: `${stripExt(file.name)}_numerote.pdf`,
    blob: toBlob(bytes),
  };
}

/* ------------------------------------------------------------------ */
/* 8. Watermark                                                        */
/* ------------------------------------------------------------------ */

export async function addWatermark(
  file: File,
  options: WatermarkOptions,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
  const doc = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: true,
  });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const colorMap = {
    gray: rgb(0.55, 0.55, 0.55),
    red: rgb(0.85, 0.15, 0.15),
    blue: rgb(0.2, 0.35, 0.8),
    black: rgb(0.1, 0.1, 0.1),
  };
  const color = colorMap[options.color];
  const text = options.text || "CONFIDENTIEL";
  const rad = (options.rotation * Math.PI) / 180;
  const pages = doc.getPages();

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(text, options.fontSize);

    if (options.tiled) {
      const stepX = tw + 140;
      const stepY = options.fontSize * 7;
      const offsetX = Math.max(40, (width % stepX) / 2);
      for (let y = 20; y < height + stepY; y += stepY) {
        for (let x = -tw; x < width + tw; x += stepX) {
          page.drawText(text, {
            x: x + (Math.floor(y / stepY) % 2 === 0 ? 0 : offsetX),
            y,
            size: options.fontSize,
            font,
            color,
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        }
      }
    } else {
      page.drawText(text, {
        x: width / 2 - (tw / 2) * Math.cos(rad),
        y: height / 2 - (tw / 2) * Math.sin(rad) - options.fontSize / 3,
        size: options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
    onProgress?.((idx + 1) / pages.length, `Filigrane page ${idx + 1}/${pages.length}`);
  });

  const bytes = await doc.save();
  onProgress?.(1);
  return {
    name: `${stripExt(file.name)}_filigrane.pdf`,
    blob: toBlob(bytes),
  };
}

/* ------------------------------------------------------------------ */
/* 9. Organize (extract / remove pages)                                */
/* ------------------------------------------------------------------ */

export async function organizePdf(
  file: File,
  mode: "extract" | "remove",
  selectedPages: number[],
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: true,
  });
  const total = src.getPageCount();
  const indices = [...new Set(selectedPages)]
    .filter((p) => p >= 1 && p <= total)
    .map((p) => p - 1)
    .sort((a, b) => a - b);

  if (mode === "extract") {
    if (indices.length === 0)
      throw new Error("Sélectionnez au moins une page à extraire.");
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    onProgress?.(1);
    return {
      name: `${stripExt(file.name)}_extrait.pdf`,
      blob: toBlob(bytes),
    };
  }

  const removeSet = new Set(indices);
  if (removeSet.size >= total)
    throw new Error("Impossible de supprimer toutes les pages.");
  const keep = Array.from({ length: total }, (_, i) => i).filter(
    (i) => !removeSet.has(i)
  );
  if (keep.length === 0)
    throw new Error("Sélection invalide : toutes les pages seraient supprimées.");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  onProgress?.(1);
  return {
    name: `${stripExt(file.name)}_nettoye.pdf`,
    blob: toBlob(bytes),
  };
}
