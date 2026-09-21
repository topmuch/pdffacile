export type ToolId =
  | "merge"
  | "word2pdf"
  | "compress"
  | "pdf2excel"
  | "excel2pdf"
  | "pdf2jpg"
  | "jpg2pdf"
  | "pptx2pdf";

export interface ToolDef {
  id: ToolId;
  title: string;
  tagline: string;
  description: string;
  color: string;
  icon: string;
  accept: string;
  multiple: boolean;
  minFiles: number;
  maxFiles: number;
  category: "organiser" | "optimiser" | "convertir";
}

export const TOOLS: ToolDef[] = [
  {
    id: "merge",
    title: "Fusionner PDF",
    tagline: "Réunissez plusieurs PDF en un seul",
    description:
      "Combinez vos documents dans l'ordre que vous voulez, par simple glisser-déposer.",
    color: "#e5322d",
    icon: "combine",
    accept: "application/pdf",
    multiple: true,
    minFiles: 2,
    maxFiles: 30,
    category: "organiser",
  },
  {
    id: "word2pdf",
    title: "Word to PDF",
    tagline: "Convertissez vos documents Word",
    description:
      "Transformez vos fichiers .docx en PDF fidèles : titres, listes, tableaux et images sont conservés.",
    color: "#2b579a",
    icon: "file-text",
    accept:
      ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
  {
    id: "compress",
    title: "Compresser PDF",
    tagline: "Réduisez le poids de vos fichiers",
    description:
      "Trois niveaux de compression pour envoyer vos PDF par e-mail sans difficulté.",
    color: "#12b778",
    icon: "minimize",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "optimiser",
  },
  {
    id: "pdf2excel",
    title: "PDF to Excel",
    tagline: "Extrayez vos tableaux vers Excel",
    description:
      "Récupérez le texte et les tableaux de votre PDF dans un classeur .xlsx, une feuille par page.",
    color: "#21a366",
    icon: "file-spreadsheet",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
  {
    id: "excel2pdf",
    title: "Excel to PDF",
    tagline: "Transformez vos tableaux en PDF",
    description:
      "Convertissez vos feuilles de calcul .xlsx ou .csv en PDF propres, tableaux mise en page incluse.",
    color: "#107c41",
    icon: "table",
    accept:
      ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
  {
    id: "pdf2jpg",
    title: "PDF to JPG",
    tagline: "Exportez chaque page en image",
    description:
      "Convertissez les pages de votre PDF en images JPG haute résolution, livrées dans une archive ZIP.",
    color: "#0cc0df",
    icon: "file-image",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
  {
    id: "jpg2pdf",
    title: "JPG to PDF",
    tagline: "Transformez vos photos en document",
    description:
      "Assemblez vos images JPG en un PDF, au format A4 ou à la taille exacte de chaque image.",
    color: "#d96514",
    icon: "image",
    accept: "image/jpeg,.jpg,.jpeg",
    multiple: true,
    minFiles: 1,
    maxFiles: 60,
    category: "convertir",
  },
  {
    id: "pptx2pdf",
    title: "PowerPoint to PDF",
    tagline: "Convertissez vos présentations",
    description:
      "Exportez vos diapositives .pptx en PDF au format 16:9 : titres et contenu texte de chaque slide.",
    color: "#d24726",
    icon: "presentation",
    accept:
      ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
];

export function getTool(id: ToolId): ToolDef {
  return TOOLS.find((t) => t.id === id)!;
}

export const CATEGORIES: { id: ToolDef["category"]; label: string }[] = [
  { id: "organiser", label: "Organiser" },
  { id: "optimiser", label: "Optimiser" },
  { id: "convertir", label: "Convertir" },
];
