import { Cloud, Printer, Sparkles, type LucideIcon } from "lucide-react";

export interface AdSlide {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  /** Classes Tailwind du dégradé de fond */
  gradient: string;
  icon: LucideIcon;
}

/**
 * Bannières publicitaires affichées sur les pages de téléchargement.
 *
 * Pour utiliser de vraies campagnes : modifiez simplement ce tableau,
 * ou branchez un réseau publicitaire (Google AdSense, etc.) dans le
 * composant `src/components/pdf-tools/ad-banner.tsx`.
 */
export const ADS: AdSlide[] = [
  {
    id: "pro",
    title: "PDFFacile Pro — bientôt disponible",
    description: "Conversion par lots, OCR et fichiers volumineux. Restez informé !",
    cta: "Me prévenir",
    href: "#",
    gradient: "from-[#e5322d] via-[#ee4f28] to-[#f4840c]",
    icon: Sparkles,
  },
  {
    id: "print",
    title: "Imprimez vos documents en un clic",
    description:
      "Notre partenaire impression : papier premium, reliure, livraison rapide.",
    cta: "Découvrir",
    href: "#",
    gradient: "from-emerald-500 via-emerald-600 to-teal-600",
    icon: Printer,
  },
  {
    id: "cloud",
    title: "Sauvegardez vos PDF en toute sécurité",
    description: "10 Go de stockage cloud offerts pour vos documents importants.",
    cta: "Obtenir l'offre",
    href: "#",
    gradient: "from-[#0cc0df] via-cyan-500 to-emerald-500",
    icon: Cloud,
  },
];
