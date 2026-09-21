"use client";

import * as React from "react";
import {
  Combine,
  Scissors,
  Minimize2,
  RotateCw,
  Image as ImageIcon,
  Images,
  Hash,
  Stamp,
  LayoutGrid,
  Heart,
  ShieldCheck,
  Zap,
  WifiOff,
  ArrowLeft,
} from "lucide-react";
import { TOOLS, type ToolId, type ToolDef } from "@/lib/pdf/tools-config";
import { ToolWorkspace } from "@/components/pdf-tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  combine: Combine,
  scissors: Scissors,
  minimize: Minimize2,
  rotate: RotateCw,
  image: ImageIcon,
  images: Images,
  hash: Hash,
  stamp: Stamp,
  layout: LayoutGrid,
};

function ToolCard({ tool, onClick }: { tool: ToolDef; onClick: () => void }) {
  const Icon = ICONS[tool.icon] ?? LayoutGrid;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ outlineColor: tool.color }}
      aria-label={tool.title}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: tool.color }}
      >
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <span className="space-y-1">
        <span className="block font-semibold text-foreground">{tool.title}</span>
        <span className="block text-sm text-muted-foreground">{tool.tagline}</span>
      </span>
    </button>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg px-1"
          aria-label="Accueil PDFFacile"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5322d] text-white shadow">
            <Heart className="h-5 w-5 fill-current" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">
            PDF<span className="text-[#e5322d]">Facile</span>
          </span>
        </button>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
          100 % privé — traitement local dans votre navigateur
        </span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-semibold text-foreground">PDFFacile</span> — tous
          les outils PDF dont vous avez besoin, gratuitement.
        </p>
        <p>Aucun fichier n&apos;est envoyé sur Internet. Vos documents restent sur votre appareil.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  const [activeToolId, setActiveToolId] = React.useState<ToolId | null>(null);
  const activeTool = activeToolId ? TOOLS.find((t) => t.id === activeToolId)! : null;

  const goHome = () => setActiveToolId(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onHome={goHome} />

      <main className="flex-1">
        {!activeTool ? (
          <>
            {/* Hero */}
            <section className="border-b bg-gradient-to-b from-red-50/80 to-transparent dark:from-red-950/20">
              <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-20">
                <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
                  Tous les outils PDF,
                  <span className="text-[#e5322d]"> en un seul endroit</span>
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Fusionnez, divisez, compressez, convertissez… Vite, facile et
                  entièrement gratuit. Vos fichiers ne quittent jamais votre
                  navigateur.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#f4840c]" aria-hidden />
                    Ultra rapide, sans inscription
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
                    100 % confidentiel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <WifiOff className="h-4 w-4 text-[#0cc0df]" aria-hidden />
                    Fonctionne même hors ligne
                  </span>
                </div>
              </div>
            </section>

            {/* Tools grid */}
            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="Liste des outils">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => setActiveToolId(tool.id)} />
                ))}
                <div className="hidden items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground lg:flex lg:flex-col lg:gap-2">
                  <Heart className="h-6 w-6 fill-[#e5322d] text-[#e5322d]" aria-hidden />
                  <p>
                    D&apos;autres outils arrivent bientôt :
                    <span className="font-medium"> protéger, déverrouiller, OCR…</span>
                  </p>
                </div>
              </div>
            </section>

            {/* How it works */}
            <section className="border-t bg-muted/30">
              <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 text-center sm:grid-cols-3 sm:px-6">
                {[
                  ["1", "Choisissez un outil", "Chaque outil est spécialisé et guidé, sans réglages compliqués."],
                  ["2", "Déposez vos fichiers", "Glissez-déposez ou parcourez vos documents en quelques secondes."],
                  ["3", "Téléchargez le résultat", "Le fichier traité est généré localement, prêt à être partagé."],
                ].map(([num, title, text]) => (
                  <div key={num} className="space-y-2">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e5322d] text-lg font-bold text-white shadow">
                      {num}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <Button
              variant="ghost"
              onClick={goHome}
              className="mb-4 -ml-2 text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Tous les outils
            </Button>
            <div className="mb-8 flex items-start gap-4">
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                )}
                style={{ backgroundColor: activeTool.color }}
              >
                {React.createElement(ICONS[activeTool.icon] ?? LayoutGrid, {
                  className: "h-6 w-6",
                })}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {activeTool.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {activeTool.description}
                </p>
              </div>
            </div>
            <ToolWorkspace tool={activeTool} onBack={goHome} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
