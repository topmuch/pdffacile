# 🚀 Guide de déploiement gratuit — PDFFacile

L'application fonctionne **100 % dans le navigateur** : aucun serveur de traitement, aucune base de données, aucune variable d'environnement n'est nécessaire. Elle peut donc être hébergée gratuitement sur n'importe quelle plateforme.

✅ **Build de production vérifié** : compilation Next.js réussie + export statique testé (3,6 Mo).

---

## Option A — Vercel (recommandée, ~5 minutes)

> Avantage : zéro configuration, redéploiement automatique à chaque `git push`, sous-domaine gratuit `xxx.vercel.app`, HTTPS inclus.

### 1. Créer le dépôt GitHub

1. Créez un compte gratuit sur [github.com](https://github.com) si nécessaire.
2. Cliquez sur **New repository**, nommez-le par exemple `pdffacile`, visibilité **Public** (ou Private, ça marche aussi sur Vercel), sans README initial.
3. Poussez le projet :

```bash
git remote add origin https://github.com/VOTRE-PSEUDO/pdffacile.git
git push -u origin main
```

### 2. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et cliquez **Sign Up with GitHub**.
2. Cliquez **Add New… → Project** puis **Import** le dépôt `pdffacile`.
3. Ne touchez à rien : Vercel détecte Next.js automatiquement. Aucune variable d'environnement à saisir.
4. Cliquez **Deploy** et patientez ~1 minute.

🎉 Votre site est en ligne sur `https://pdffacile-xxxx.vercel.app` — partagez ce lien à qui vous voulez.

### 3. (Optionnel) Domaine personnalisé

Dans Vercel : **Settings → Domains → Add**. Vous pouvez y brancher un domaine acheté ailleurs (OVH, Namecheap…) — le HTTPS est automatique.

---

## Option B — GitHub Pages (100 % gratuit, 100 % statique)

> Avantage : gratuit à vie, sans limite de bande passante. Nécessite 2 petites modifications du code (l'app n'utilise pas d'API).

### 1. Passer en mode export statique

Dans `next.config.ts`, remplacez la config par :

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Si le site est servi depuis un sous-chemin (username.github.io/pdffacile),
  // décommentez et adaptez :
  // basePath: "/pdffacile",
  // assetPrefix: "/pdffacile",
  reactStrictMode: false,
};

export default nextConfig;
```

Puis supprimez le dossier `src/app/api` (les fonctions serveur ne sont pas compatibles avec l'export statique — l'application ne les utilise pas).

### 2. Créer le workflow de déploiement

Créez le fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx next build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Activer GitHub Pages

Sur GitHub : **Settings → Pages → Source : GitHub Actions**, puis poussez le code. Le site sera disponible sur `https://VOTRE-PSEUDO.github.io/pdffacile/`.

---

## Option C — Netlify / Cloudflare Pages (glisser-déposer)

1. Générez le site statique localement (après les modifications de l'option B) :

```bash
bun install
bunx next build   # le site statique est généré dans le dossier out/
```

2. **Netlify** : sur [app.netlify.com/drop](https://app.netlify.com/drop), glissez-déposez le dossier `out/` → en ligne en 10 secondes.
3. **Cloudflare Pages** : [pages.cloudflare.com](https://pages.cloudflare.com) → connexion GitHub → build automatique (commande : `bunx next build`, dossier de sortie : `out`).

---

## Limites du gratuit (à connaître)

| Plateforme | Gratuit pour… | Limite principale |
|---|---|---|
| Vercel Hobby | Usage personnel, bande passante 100 Go/mois | Usage commercial limité |
| GitHub Pages | Tout, à vie | Dépôt public, 1 Go, statique uniquement |
| Netlify Free | 100 Go/mois | Bande passante |
| Cloudflare Pages | Illimité en requêtes | Statique uniquement |

💡 **Conseil** : pour un outil personnel ou associatif, **Vercel** est le plus simple. Pour une tranquillité absolue sans aucune limite, **GitHub Pages**.

---

## Récapitulatif de l'état du dépôt

- ✅ Dépôt Git nettoyé : aucun secret (`.env` retiré), aucun artefact sandbox
- ✅ `.gitignore` complet (node_modules, .next, .env, db…)
- ✅ Aucune dépendance serveur requise à l'exécution
- ✅ `bun.lock` versionné pour des installations reproductibles
- ✅ Build de production et export statique testés avec succès
