"use client";

import * as React from "react";
import {
  Combine,
  FileText,
  Minimize2,
  FileSpreadsheet,
  Table,
  FileImage,
  Image as ImageIcon,
  Presentation,
  Heart,
  ShieldCheck,
  Zap,
  WifiOff,
  ArrowLeft,
  Sparkles,
  Gift,
  Ban,
  MousePointerClick,
  Infinity as InfinityIcon,
  ArrowDown,
} from "lucide-react";
import { TOOLS, type ToolId, type ToolDef } from "@/lib/pdf/tools-config";
import { ToolWorkspace } from "@/components/pdf-tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  combine: Combine,
  "file-text": FileText,
  minimize: Minimize2,
  "file-spreadsheet": FileSpreadsheet,
  table: Table,
  "file-image": FileImage,
  image: ImageIcon,
  presentation: Presentation,
};

/* ---------------------------------- Carte outil ---------------------------------- */

function ToolCard({ tool, onClick }: { tool: ToolDef; onClick: () => void }) {
  const Icon = ICONS[tool.icon] ?? FileText;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border bg-card p-6 pt-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
      aria-label={`${tool.title} — gratuit`}
    >
      {/* Halo coloré au survol */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at 50% -10%, ${tool.color}1f, transparent 65%)`,
        }}
      />

      {/* Badge gratuit */}
      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm">
        <Gift className="h-3 w-3" aria-hidden />
        Gratuit
      </span>

      {/* Grande icône dégradée */}
      <span
        aria-hidden
        className="relative flex h-24 w-24 items-center justify-center rounded-[1.6rem] text-white transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 sm:h-28 sm:w-28"
        style={{
          background: `linear-gradient(135deg, ${tool.color} 0%, ${tool.color}c4 100%)`,
          boxShadow: `0 16px 32px -12px ${tool.color}73`,
        }}
      >
        {/* reflet */}
        <span className="absolute inset-x-3 top-1.5 h-1/3 rounded-full bg-white/25 blur-[6px]" />
        <Icon className="h-11 w-11 sm:h-14 sm:w-14" aria-hidden strokeWidth={1.7} />
      </span>

      <span className="relative space-y-1.5">
        <span className="block text-base font-bold text-foreground sm:text-lg">
          {tool.title}
        </span>
        <span className="block text-sm leading-snug text-muted-foreground">
          {tool.tagline}
        </span>
      </span>

      {/* Ligne d'action */}
      <span
        className="relative mt-auto inline-flex items-center gap-1 text-sm font-semibold opacity-80 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100"
        style={{ color: tool.color }}
      >
        Essayer maintenant
        <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden />
      </span>
    </button>
  );
}

/* ---------------------------------- Header ---------------------------------- */

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Accueil PDFFacile"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e5322d] to-[#f4840c] text-white shadow-md">
            <Heart className="h-6 w-6 fill-current" aria-hidden />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            PDF<span className="text-gradient-brand">Facile</span>
          </span>
          <span className="ml-1 hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 sm:inline">
            100 % Gratuit
          </span>
        </button>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
          100 % privé — traitement local dans votre navigateur
        </span>
      </div>
    </header>
  );
}

/* ---------------------------------- Footer ---------------------------------- */

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-semibold text-foreground">PDFFacile</span> — tous
          les outils PDF dont vous avez besoin, gratuitement.
        </p>
        <p className="flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          Gratuit, pour toujours. Aucun fichier n&apos;est envoyé sur Internet.
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function Home() {
  const [activeToolId, setActiveToolId] = React.useState<ToolId | null>(null);
  const activeTool = activeToolId ? TOOLS.find((t) => t.id === activeToolId)! : null;

  // Remonte en haut de page à chaque changement d'outil
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeToolId]);

  const goHome = () => setActiveToolId(null);

  const scrollToTools = () => {
    document.getElementById("outils")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onHome={goHome} />

      <main className="flex-1">
        {!activeTool ? (
          <>
            {/* ============================ Hero ============================ */}
            <section className="relative overflow-hidden border-b bg-gradient-to-b from-red-50 via-orange-50/60 to-transparent dark:from-red-950/25 dark:via-orange-950/10">
              {/* Blobs décoratifs */}
              <span
                aria-hidden
                className="animate-float-slow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#e5322d]/10 blur-3xl"
              />
              <span
                aria-hidden
                className="animate-float-slower pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-[#f4840c]/10 blur-3xl"
              />

              <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
                {/* Badge gratuit animé */}
                <div className="animate-rise-in mb-6 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    100 % Gratuit — Sans inscription, sans limite
                  </span>
                </div>

                <h1 className="animate-rise-in-1 mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                  Tous vos outils PDF,
                  <br />
                  <span className="text-gradient-brand">gratuits et sans effort</span>
                </h1>

                <p className="animate-rise-in-2 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Fusionnez, compressez, convertissez Word, Excel, PowerPoint et
                  images en quelques clics. <strong className="font-semibold text-foreground">Entièrement gratuit</strong>, et vos
                  fichiers ne quittent jamais votre navigateur.
                </p>

                <div className="animate-rise-in-2 mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={scrollToTools}
                    className="h-12 rounded-xl bg-gradient-to-r from-[#e5322d] to-[#f4840c] px-6 text-base font-semibold shadow-lg shadow-red-500/25 transition-transform hover:scale-[1.03]"
                  >
                    Découvrir les outils
                    <ArrowDown className="ml-2 h-5 w-5" aria-hidden />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveToolId("merge")}
                    className="h-12 rounded-xl border-2 px-6 text-base font-semibold"
                  >
                    <Combine className="mr-2 h-5 w-5" aria-hidden />
                    Fusionner un PDF
                  </Button>
                </div>

                {/* Bandeau de réassurance */}
                <div className="animate-rise-in-3 mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#f4840c]" aria-hidden />
                    Ultra rapide
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />
                    100 % confidentiel
                  </span>
                  <span className="flex items-center gap-2">
                    <WifiOff className="h-5 w-5 text-[#0cc0df]" aria-hidden />
                    Fonctionne hors ligne
                  </span>
                  <span className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-emerald-500" aria-hidden />
                    Gratuit à vie
                  </span>
                </div>
              </div>
            </section>

            {/* ======================= Chiffres clés ======================= */}
            <section aria-label="Chiffres clés" className="border-b bg-background">
              <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border px-4 py-8 sm:grid-cols-4 sm:px-6">
                {[
                  ["8", "outils gratuits"],
                  ["0 €", "pour toujours"],
                  ["0", "fichier envoyé en ligne"],
                  ["∞", "utilisations illimitées"],
                ].map(([value, label]) => (
                  <div key={label} className="px-2 text-center">
                    <p className="text-3xl font-extrabold tracking-tight text-gradient-brand sm:text-4xl">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ========================= Outils ========================= */}
            <section
              id="outils"
              className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16"
              aria-label="Liste des outils"
            >
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Choisissez votre outil <span className="text-gradient-brand">gratuit</span>
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  8 outils essentiels, sans compte, sans filigrane, sans limite d&apos;utilisation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => setActiveToolId(tool.id)} />
                ))}
              </div>
            </section>

            {/* ==================== Bandeau 100 % gratuit ==================== */}
            <section aria-label="Pourquoi c'est gratuit" className="border-y bg-gradient-to-r from-emerald-50 via-background to-orange-50/60 dark:from-emerald-950/20 dark:to-orange-950/10">
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                <div className="mb-10 text-center">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Gift className="h-4 w-4" aria-hidden />
                    Notre promesse
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Gratuit. Vraiment. <span className="text-gradient-brand">Pour tout le monde.</span>
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                    Pas de piège, pas d&apos;abonnement caché. Voici ce que « gratuit » signifie ici :
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                  {[
                    {
                      icon: Gift,
                      color: "#12b778",
                      title: "0 €, pour toujours",
                      text: "Tous les outils sont accessibles sans payer un centime, aujourd'hui comme demain.",
                    },
                    {
                      icon: MousePointerClick,
                      color: "#f4840c",
                      title: "Sans inscription",
                      text: "Aucun compte, aucun e-mail. Ouvrez la page et travaillez immédiatement.",
                    },
                    {
                      icon: InfinityIcon,
                      color: "#0cc0df",
                      title: "Utilisations illimitées",
                      text: "Autant de fichiers que vous voulez, aussi souvent que nécessaire.",
                    },
                    {
                      icon: Ban,
                      color: "#e5322d",
                      title: "Sans filigrane",
                      text: "Vos documents restent propres : aucun logo ni marque n'est ajouté à vos fichiers.",
                    },
                  ].map(({ icon: Icon, color, title, text }) => (
                    <div
                      key={title}
                      className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <span
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}c4)`,
                        }}
                      >
                        <Icon className="h-7 w-7" aria-hidden />
                      </span>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ======================= Comment ça marche ======================= */}
            <section className="bg-muted/30">
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Comment ça marche ?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Trois étapes, trente secondes, zéro complication.
                  </p>
                </div>
                <div className="grid gap-8 text-center sm:grid-cols-3 sm:gap-6">
                  {[
                    ["1", "Choisissez un outil", "Chaque outil est spécialisé et guidé, sans réglages compliqués."],
                    ["2", "Déposez vos fichiers", "Glissez-déposez ou parcourez vos documents en quelques secondes."],
                    ["3", "Téléchargez le résultat", "Le fichier traité est généré localement, prêt à être partagé."],
                  ].map(([num, title, text]) => (
                    <div key={num} className="space-y-3">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e5322d] to-[#f4840c] text-2xl font-extrabold text-white shadow-lg shadow-red-500/25">
                        {num}
                      </span>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mx-auto max-w-xs text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================== CTA final ========================== */}
            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e5322d] via-[#ee4f28] to-[#f4840c] px-6 py-12 text-center text-white shadow-xl shadow-red-500/20 sm:px-12 sm:py-16">
                <span
                  aria-hidden
                  className="animate-float-slow pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
                />
                <span
                  aria-hidden
                  className="animate-float-slower pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
                />
                <h2 className="relative text-2xl font-extrabold tracking-tight sm:text-4xl">
                  Prêt à simplifier vos PDF ?
                </h2>
                <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
                  Essayez dès maintenant — c&apos;est gratuit, illimité, et vos
                  documents restent sur votre appareil.
                </p>
                <Button
                  size="lg"
                  onClick={scrollToTools}
                  className="relative mt-7 h-12 rounded-xl bg-white px-8 text-base font-bold text-[#e5322d] shadow-lg transition-transform hover:scale-[1.04] hover:bg-white"
                >
                  <Sparkles className="mr-2 h-5 w-5" aria-hidden />
                  Commencer gratuitement
                </Button>
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
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                )}
                style={{
                  background: `linear-gradient(135deg, ${activeTool.color}, ${activeTool.color}c4)`,
                  boxShadow: `0 12px 24px -10px ${activeTool.color}73`,
                }}
              >
                {React.createElement(ICONS[activeTool.icon] ?? FileText, {
                  className: "h-8 w-8",
                })}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {activeTool.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {activeTool.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  <Gift className="h-3 w-3" aria-hidden />
                  Gratuit
                </span>
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
