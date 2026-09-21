"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { ADS } from "@/lib/ads";
import { cn } from "@/lib/utils";

const ROTATE_MS = 5000;

/**
 * Carrousel de bannières publicitaires défilantes.
 * - Défilement automatique toutes les 5 secondes
 * - Pause au survol et pour les utilisateurs préférant moins d'animations
 * - Barre d'étiquetage « Publicité » (transparence légale)
 */
export function AdBanner({ className }: { className?: string }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = ADS.length;

  React.useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  const go = React.useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  return (
    <section
      className={cn(
        "group/ad relative overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
      aria-roledescription="carrousel"
      aria-label="Publicité"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Barre d'étiquetage légale */}
      <div className="flex items-center justify-between border-b bg-muted/70 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Megaphone className="h-3 w-3" aria-hidden />
          Publicité
        </span>
        <span className="hidden text-[10px] text-muted-foreground/80 sm:inline">
          Soutenez PDFFacile — le service reste gratuit
        </span>
      </div>

      {/* Piste défilante */}
      <div className="relative">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live="off"
        >
          {ADS.map((ad, i) => (
            <div
              key={ad.id}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${i + 1} sur ${count}`}
              aria-hidden={i !== index}
              className="min-w-full"
            >
              <a
                href={ad.href}
                tabIndex={i === index ? 0 : -1}
                className={cn(
                  "flex items-center gap-3 bg-gradient-to-r px-4 py-6 sm:gap-5 sm:px-8",
                  ad.gradient,
                  i === index ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm sm:h-14 sm:w-14 sm:rounded-2xl">
                  <ad.icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="line-clamp-2 block text-sm font-extrabold leading-tight text-white sm:text-base">
                    {ad.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-white/90 sm:text-sm">
                    {ad.description}
                  </span>
                </span>
                <span className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-md transition-transform hover:scale-105 sm:inline-block">
                  {ad.cta}
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* Flèches */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Publicité précédente"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-1.5 text-white opacity-70 shadow backdrop-blur-sm transition-all hover:bg-black/40 hover:opacity-100 focus-visible:opacity-100 sm:left-2 sm:opacity-0 sm:group-hover/ad:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Publicité suivante"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-1.5 text-white opacity-70 shadow backdrop-blur-sm transition-all hover:bg-black/40 hover:opacity-100 focus-visible:opacity-100 sm:right-2 sm:opacity-0 sm:group-hover/ad:opacity-100"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>

        {/* Pastilles */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {ADS.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Aller à la publicité ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index
                  ? "w-5 bg-white shadow"
                  : "w-2 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
