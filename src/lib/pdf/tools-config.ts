export type ToolId =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "img2pdf"
  | "pdf2img"
  | "pagenum"
  | "watermark"
  | "organize";

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
  category: "organiser" | "optimiser" | "convertir" | "modifier";
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
    id: "split",
    title: "Diviser PDF",
    tagline: "Séparez un PDF en plusieurs documents",
    description:
      "Une page par fichier, des paquets de pages ou des plages personnalisées.",
    color: "#f4840c",
    icon: "scissors",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "organiser",
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
    id: "rotate",
    title: "Pivoter PDF",
    tagline: "Redressez vos pages en un clic",
    description:
      "Faites pivoter toutes les pages de 90°, 180° ou 270° et récupérez un PDF net.",
    color: "#8f00e0",
    icon: "rotate",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "organiser",
  },
  {
    id: "img2pdf",
    title: "Images vers PDF",
    tagline: "Transformez vos photos en document",
    description:
      "JPG, PNG, WebP… Convertissez vos images en PDF, format A4 ou taille automatique.",
    color: "#d96514",
    icon: "image",
    accept: "image/*",
    multiple: true,
    minFiles: 1,
    maxFiles: 60,
    category: "convertir",
  },
  {
    id: "pdf2img",
    title: "PDF vers Images",
    tagline: "Exportez chaque page en image",
    description:
      "Convertissez les pages de votre PDF en images PNG ou JPG haute résolution.",
    color: "#0cc0df",
    icon: "images",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "convertir",
  },
  {
    id: "pagenum",
    title: "Numéroter pages",
    tagline: "Ajoutez des numéros de page",
    description:
      "Position, format « n » ou « n / N », première page ignorée : tout est réglable.",
    color: "#b833e0",
    icon: "hash",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "modifier",
  },
  {
    id: "watermark",
    title: "Filigrane",
    tagline: "Marquez vos documents en diagonale",
    description:
      "Ajoutez un texte discret ou en mosaïque pour protéger vos documents sensibles.",
    color: "#7c3aed",
    icon: "stamp",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "modifier",
  },
  {
    id: "organize",
    title: "Organiser pages",
    tagline: "Extrayez ou supprimez des pages",
    description:
      "Visualisez chaque page, sélectionnez celles à garder ou à retirer du document.",
    color: "#e51e79",
    icon: "layout",
    accept: "application/pdf",
    multiple: false,
    minFiles: 1,
    maxFiles: 1,
    category: "organiser",
  },
];

export function getTool(id: ToolId): ToolDef {
  return TOOLS.find((t) => t.id === id)!;
}

export const CATEGORIES: { id: ToolDef["category"]; label: string }[] = [
  { id: "organiser", label: "Organiser" },
  { id: "optimiser", label: "Optimiser" },
  { id: "convertir", label: "Convertir" },
  { id: "modifier", label: "Modifier" },
];
