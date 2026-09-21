export interface PdfResult {
  name: string;
  blob: Blob;
}

export type ProgressCallback = (progress: number, message?: string) => void;

export type SplitMode = "all" | "everyN" | "ranges";

export type CompressLevel = "light" | "recommended" | "extreme";

export type ImagePageMode = "auto" | "a4-portrait" | "a4-landscape";

export interface PageNumberOptions {
  position:
    | "bottom-center"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "top-right"
    | "top-left";
  format: "n" | "nOfTotal";
  startAt: number;
  margin: number;
  fontSize: number;
  skipFirst: boolean;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: "gray" | "red" | "blue" | "black";
  tiled: boolean;
}

export interface PageThumbnail {
  page: number;
  dataUrl: string;
}
