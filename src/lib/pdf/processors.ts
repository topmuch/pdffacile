"use client";

import type { CompressLevel, ImagePageMode, PdfResult, ProgressCallback } from "./types";

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

/** Convert numeric-looking strings into numbers (FR decimal separator aware). */
function toNumber(value: string): string | number {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 15) return trimmed;
  const cleaned = trimmed.replace(/[\s\u00a0]/g, "").replace(",", ".");
  if (/^-?\d+(\.\d+)?$/.test(cleaned) && /\d/.test(trimmed)) {
    return Number(cleaned);
  }
  return trimmed;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
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
/* 2. Compress                                                         */
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
/* 3. JPG → PDF                                                        */
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
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        image = await doc.embedJpg(bytes);
      } else {
        // Fallback for other raster types → convert via canvas
        const bitmap = await createImageBitmap(
          new Blob([bytes as BlobPart], { type: file.type || "image/jpeg" })
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
/* 4. PDF → JPG                                                        */
/* ------------------------------------------------------------------ */

export async function pdfToJpgs(
  file: File,
  scale: number,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await readBytes(file) });
  const doc = await loadingTask.promise;
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const base = stripExt(file.name);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const s = cappedScale(page, scale);
    const canvas = await renderPageToCanvas(page, s);
    const blob = await canvasToBlob(canvas, "jpeg", 0.92);
    zip.file(`${base}_page_${String(i).padStart(3, "0")}.jpg`, blob);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    onProgress?.(i / doc.numPages, `Conversion page ${i}/${doc.numPages}`);
  }

  await loadingTask.destroy();
  const zipped = await zip.generateAsync({ type: "blob" });
  return { name: `${base}_jpg.zip`, blob: zipped };
}

/* ------------------------------------------------------------------ */
/* 5. Word (.docx) → PDF                                               */
/* ------------------------------------------------------------------ */

const DOCX_CSS = `
.pdfacile-docx-page {
  width: 794px;
  box-sizing: border-box;
  padding: 64px 72px;
  background: #ffffff;
  color: #1a1a1a;
  font-family: Calibri, 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.55;
}
.pdfacile-docx-page h1 { font-size: 30px; font-weight: 700; margin: 24px 0 12px; color: #111111; }
.pdfacile-docx-page h2 { font-size: 25px; font-weight: 700; margin: 22px 0 10px; color: #111111; }
.pdfacile-docx-page h3 { font-size: 21px; font-weight: 600; margin: 18px 0 8px; color: #222222; }
.pdfacile-docx-page h4 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; color: #222222; }
.pdfacile-docx-page p  { margin: 0 0 12px; }
.pdfacile-docx-page ul,
.pdfacile-docx-page ol { margin: 0 0 12px 30px; }
.pdfacile-docx-page li { margin-bottom: 4px; }
.pdfacile-docx-page table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.pdfacile-docx-page td, .pdfacile-docx-page th {
  border: 1px solid #b8b8b8; padding: 6px 10px; font-size: 14px; text-align: left;
}
.pdfacile-docx-page th { background: #f0f0f0; font-weight: 700; }
.pdfacile-docx-page img { max-width: 100%; height: auto; }
.pdfacile-docx-page a { color: #0b5394; text-decoration: underline; }
.pdfacile-docx-page blockquote {
  border-left: 4px solid #cccccc; margin: 12px 0; padding: 4px 16px; color: #444444;
}
.pdfacile-docx-page strong { font-weight: 700; }
.pdfacile-docx-page em { font-style: italic; }
`;

export async function wordToPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  if (!/\.docx$/i.test(file.name)) {
    throw new Error(
      "Format non supporté : convertissez d'abord votre document au format .docx (Word 2007+)."
    );
  }
  onProgress?.(0.1, "Lecture du document Word…");
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  if (!html.trim()) {
    throw new Error("Le document semble vide ou illisible.");
  }

  onProgress?.(0.35, "Mise en page…");
  // html2canvas-pro: fork supportant les couleurs modernes (lab/oklch) de Tailwind 4
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  // Off-screen render tree — plain hex colors only (html2canvas-safe).
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText =
    "position:fixed;left:-12000px;top:0;margin:0;padding:0;background:#ffffff;";
  const style = document.createElement("style");
  style.textContent = DOCX_CSS;
  const page = document.createElement("div");
  page.className = "pdfacile-docx-page";
  page.innerHTML = html;
  wrap.appendChild(style);
  wrap.appendChild(page);
  document.body.appendChild(wrap);

  try {
    const canvas = await html2canvas(page, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    if (canvas.height < 24) {
      throw new Error("Le document semble vide.");
    }

    const A4_W = 595.28;
    const A4_H = 841.89;
    const pxPerPt = canvas.width / A4_W;
    const sliceH = Math.floor(A4_H * pxPerPt);
    const pageCount = Math.max(1, Math.ceil(canvas.height / sliceH));
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

    for (let i = 0; i < pageCount; i++) {
      const h = Math.min(sliceH, canvas.height - i * sliceH);
      if (i > 0) pdf.addPage();
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = h;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, h);
      ctx.drawImage(canvas, 0, i * sliceH, canvas.width, h, 0, 0, canvas.width, h);
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, A4_W, h / pxPerPt);
      slice.width = 0;
      slice.height = 0;
      onProgress?.(0.4 + 0.55 * ((i + 1) / pageCount), `Page ${i + 1}/${pageCount}`);
    }
    onProgress?.(1, "Finalisation…");
    return { name: `${stripExt(file.name)}.pdf`, blob: pdf.output("blob") };
  } finally {
    wrap.remove();
  }
}

/* ------------------------------------------------------------------ */
/* 6. PDF → Excel (.xlsx)                                              */
/* ------------------------------------------------------------------ */

interface ExtractLine {
  y: number;
  items: { x: number; endX: number; str: string }[];
}

/** Cluster x start positions into column anchors (tolerance-based). */
function buildColumnAnchors(allX: number[]): number[] {
  if (allX.length === 0) return [0];
  const sorted = [...allX].sort((a, b) => a - b);
  const anchors: number[] = [];
  let cluster: number[] = [sorted[0]];
  const TOL = 12;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - cluster[cluster.length - 1] <= TOL) {
      cluster.push(sorted[i]);
    } else {
      anchors.push(cluster[Math.floor(cluster.length / 2)]);
      cluster = [sorted[i]];
    }
  }
  anchors.push(cluster[Math.floor(cluster.length / 2)]);
  return anchors;
}

function nearestAnchor(anchors: number[], x: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < anchors.length; i++) {
    const d = Math.abs(anchors[i] - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export async function pdfToExcel(
  file: File,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await readBytes(file) });
  const doc = await loadingTask.promise;
  if (doc.numPages > 200) {
    await loadingTask.destroy();
    throw new Error("PDF trop long : 200 pages maximum pour l'extraction Excel.");
  }

  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  let totalRows = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // 1. Group text items into visual lines (y tolerance).
    const lines: ExtractLine[] = [];
    for (const raw of content.items) {
      const item = raw as import("pdfjs-dist").TextItem;
      if (typeof item.str !== "string" || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let line = lines.find((l) => Math.abs(l.y - y) <= 3);
      if (!line) {
        line = { y, items: [] };
        lines.push(line);
      }
      line.items.push({ x, endX: x + (item.width ?? 0), str: item.str });
    }
    lines.sort((a, b) => b.y - a.y);

    // 2. Build column anchors from every item start.
    const anchors = buildColumnAnchors(
      lines.flatMap((l) => l.items.map((it) => Math.round(it.x)))
    );

    // 3. Fill the grid: one row per line, one cell per anchor column.
    const rows: (string | number)[][] = [];
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
      const row: (string | number)[] = Array.from({ length: anchors.length }, () => "");
      for (const it of line.items) {
        const col = nearestAnchor(anchors, it.x);
        row[col] = row[col] ? `${row[col]} ${it.str}`.trim() : it.str.trim();
      }
      // Trim trailing empties + convert numbers
      while (row.length && row[row.length - 1] === "") row.pop();
      if (row.length) {
        rows.push(row.map((c) => (typeof c === "string" ? toNumber(c) : c)));
      }
    }

    if (rows.length) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${p}`.slice(0, 31));
      totalRows += rows.length;
    }
    page.cleanup();
    onProgress?.(p / doc.numPages, `Extraction page ${p}/${doc.numPages}`);
  }

  await loadingTask.destroy();
  if (totalRows === 0) {
    throw new Error(
      "Aucun texte détecté : le PDF est peut-être un scan (les images ne peuvent pas être extraites)."
    );
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  onProgress?.(1, "Classeur Excel généré");
  return {
    name: `${stripExt(file.name)}.xlsx`,
    blob: toBlob(new Uint8Array(out), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  };
}

/* ------------------------------------------------------------------ */
/* 7. Excel (.xlsx / .csv) → PDF                                       */
/* ------------------------------------------------------------------ */

export async function excelToPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  const XLSX = await import("xlsx");
  onProgress?.(0.15, "Lecture du classeur…");

  let wb: import("xlsx").WorkBook;
  if (/\.csv$/i.test(file.name)) {
    wb = XLSX.read(await file.text(), { type: "string" });
  } else {
    wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  }

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

  const usable = wb.SheetNames.filter((name) => {
    const aoa = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], {
      header: 1,
      blankrows: false,
      defval: "",
    });
    return aoa.some((r) => r.some((c) => String(c ?? "").trim() !== ""));
  });
  if (usable.length === 0) throw new Error("Aucune donnée trouvée dans le classeur.");

  usable.forEach((name, idx) => {
    const aoa = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const rows = aoa
      .filter((r) => r.some((c) => String(c ?? "").trim() !== ""))
      .map((r) => r.map((c) => String(c ?? "")));

    if (idx > 0) doc.addPage();
    autoTable(doc, {
      head: [rows[0]],
      body: rows.slice(1),
      startY: 56,
      margin: { left: 32, right: 32, top: 56, bottom: 40 },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", textColor: 30 },
      headStyles: { fillColor: [16, 124, 65], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [243, 249, 245] },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.text(name, 32, 36);
      },
    });
    onProgress?.(0.2 + 0.75 * ((idx + 1) / usable.length), `Feuille « ${name} »…`);
  });

  onProgress?.(1, "Finalisation…");
  return { name: `${stripExt(file.name)}.pdf`, blob: doc.output("blob") };
}

/* ------------------------------------------------------------------ */
/* 8. PowerPoint (.pptx) → PDF                                         */
/* ------------------------------------------------------------------ */

interface SlidePara {
  text: string;
  level: number;
}

interface SlideContent {
  title: SlidePara[];
  body: SlidePara[];
}

function parseSlideXml(xml: string): SlideContent {
  const dom = new DOMParser().parseFromString(xml, "application/xml");
  const slide: SlideContent = { title: [], body: [] };
  const shapes = Array.from(dom.getElementsByTagName("p:sp"));
  for (const sp of shapes) {
    const ph = sp.getElementsByTagName("p:ph")[0];
    const type = ph?.getAttribute("type") ?? "";
    const isTitle = type === "title" || type === "ctrTitle";
    for (const p of Array.from(sp.getElementsByTagName("a:p"))) {
      const text = Array.from(p.getElementsByTagName("a:t"))
        .map((t) => t.textContent ?? "")
        .join("")
        .trim();
      if (!text) continue;
      const pPr = p.getElementsByTagName("a:pPr")[0];
      const level = parseInt(pPr?.getAttribute("lvl") ?? "0", 10) || 0;
      (isTitle ? slide.title : slide.body).push({ text, level });
    }
  }
  return slide;
}

const SLIDE_W = 960;
const SLIDE_H = 540;

function drawSlide(pdf: import("jspdf").jsPDF, slide: SlideContent, index: number, total: number) {
  const MARGIN = 64;
  let y = 96;

  // Accent bar + title
  pdf.setDrawColor(210, 71, 38);
  pdf.setLineWidth(3);
  pdf.line(MARGIN, 72, MARGIN + 44, 72);

  pdf.setTextColor(26, 26, 26);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(27);
  const titleText = slide.title.map((t) => t.text).join(" — ");
  if (titleText) {
    const wrapped = pdf.splitTextToSize(titleText, SLIDE_W - MARGIN * 2);
    pdf.text(wrapped.slice(0, 2), MARGIN, y);
    y += wrapped.slice(0, 2).length * 34 + 14;
  } else {
    y += 10;
  }

  // Body bullets
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(15);
  for (const para of slide.body) {
    const indent = MARGIN + 14 + para.level * 26;
    const wrapped = pdf.splitTextToSize(para.text, SLIDE_W - indent - MARGIN);
    for (let i = 0; i < wrapped.length; i++) {
      if (y > SLIDE_H - 60) break;
      if (i === 0) {
        pdf.setTextColor(210, 71, 38);
        pdf.text("•", MARGIN + para.level * 26, y);
      }
      pdf.setTextColor(50, 50, 50);
      pdf.text(wrapped[i], indent, y);
      y += 23;
    }
    y += 6;
    if (y > SLIDE_H - 60) break;
  }

  // Empty slide notice
  if (!titleText && slide.body.length === 0) {
    pdf.setTextColor(170, 170, 170);
    pdf.setFontSize(14);
    pdf.text(`Diapositive ${index} — contenu non textuel`, SLIDE_W / 2, SLIDE_H / 2, {
      align: "center",
    });
  }

  // Footer page number
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(10);
  pdf.text(`${index} / ${total}`, SLIDE_W - MARGIN, SLIDE_H - 32, { align: "right" });
}

export async function pptxToPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<PdfResult> {
  if (!/\.pptx$/i.test(file.name)) {
    throw new Error(
      "Format non supporté : convertissez d'abord votre présentation au format .pptx (PowerPoint 2007+)."
    );
  }
  onProgress?.(0.1, "Ouverture de la présentation…");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort(
      (a, b) =>
        parseInt(a.match(/(\d+)/)![1], 10) - parseInt(b.match(/(\d+)/)![1], 10)
    );
  if (slideNames.length === 0) {
    throw new Error("Présentation illisible : aucune diapositive trouvée.");
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "pt",
    format: [SLIDE_W, SLIDE_H],
    orientation: "landscape",
  });
  pdf.setFont("helvetica");

  const total = slideNames.length;
  for (let i = 0; i < total; i++) {
    const xml = await zip.file(slideNames[i])!.async("string");
    const slide = parseSlideXml(xml);
    if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], "landscape");
    drawSlide(pdf, slide, i + 1, total);
    onProgress?.(0.15 + 0.8 * ((i + 1) / total), `Diapositive ${i + 1}/${total}`);
  }

  onProgress?.(1, "Finalisation…");
  return {
    name: `${stripExt(file.name)}_presentation.pdf`,
    blob: pdf.output("blob"),
  };
}
