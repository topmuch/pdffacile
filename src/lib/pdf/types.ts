export interface PdfResult {
  name: string;
  blob: Blob;
}

export type ProgressCallback = (progress: number, message?: string) => void;

export type CompressLevel = "light" | "recommended" | "extreme";

export type ImagePageMode = "auto" | "a4-portrait" | "a4-landscape";

export interface PdfTableSheet {
  name: string;
  rows: string[][];
}
