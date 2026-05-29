# Praksis·ai

Statisk website for Praksis·ai — et dansk AI-uddannelses-bibliotek med 14 områder, hver med en områdeside og en uddybende undervisningsside.

## Struktur

**Forside**
- `index.html` — Landingside med alle 14 områder

**14 områdesider** (oversigt, pensum, smagsprøver, priser)
- `data.html`, `marketing.html`, `finans.html`, `bolig.html`, `kode.html`, `hverdag.html`, `karriere.html`, `sundhed.html`, `laering.html`, `skriv.html`, `ivaerksaetteri.html`, `salg.html`, `rejse.html`, `mad.html`

**14 undervisningssider** (5 dybdegående lektioner per område)
- `data-undervisning.html`, `marketing-undervisning.html`, … `mad-undervisning.html`

I alt 29 HTML-sider og 70 lektioner.

## Hvad er nyt i denne version

1. **Modul-kort linker til undervisning.** Hvert modul på en områdeside er nu et klikbart kort der fører til den tilsvarende lektion på undervisningssiden. Hver pensum-sektion har desuden en "Åbn hele undervisningen"-knap.

2. **Navigation på undervisningssider.** Hver lektion har "← Forrige / Næste →"-knapper. En progress-bar i toppen viser hvor langt man er scrollet. Sektions-navigationen fremhæver den aktive lektion. En "til toppen"-knap dukker op ved scroll.

3. **Optimering på tværs af alle sider:**
   - SEO: `<meta description>`, Open Graph- og Twitter-tags, canonical-URL på hver side
   - `scroll-margin-top` så anker-links ikke gemmer sig bag den sticky nav
   - `prefers-reduced-motion` respekteres (animationer slås fra for brugere der ønsker det)
   - SVG-favicon, theme-color
   - `sitemap.xml` og `robots.txt` til søgemaskiner
   - Sikkerheds- og cache-headers i `vercel.json`

## Deploy til GitHub + Vercel

### 1. GitHub
```bash
git init
git add .
git commit -m "Praksis·ai komplet site med undervisning"
git branch -M main
git remote add origin https://github.com/DIT-BRUGERNAVN/praksis-ai.git
git push -u origin main
```

### 2. Vercel
- **Dashboard:** Gå til https://vercel.com/new, importer repoet, tryk Deploy.
- **CLI:** `npm i -g vercel && vercel`
- **Drag-and-drop:** Træk hele mappen ind på https://vercel.com/new

Ingen build-step. Ren statisk HTML/CSS/JS.

### 3. Custom domæne (valgfrit)
Vercel dashboard → Project Settings → Domains. Husk at opdatere `SITE_URL` i `sitemap.xml`, `robots.txt` og canonical/OG-tags hvis du skifter domæne.

## Lokal udvikling
```bash
python3 -m http.server 8000
# eller
npx serve
```
Åbn `http://localhost:8000`.

## Teknisk
- Ren HTML/CSS/vanilla JS — ingen byggeproces, ingen frameworks
- Google Fonts: Fraunces (display), Manrope (body), JetBrains Mono (labels)
- CSS-animationer (ingen JS-libs)
- Responsivt (breakpoint 980px)
- Selvbærende sider — hver HTML-fil indeholder sin egen CSS og JS
- `cleanUrls: true` → `/data-undervisning` i stedet for `/data-undervisning.html`

## Næste skridt
- [ ] Køb domæne, opdater URL i sitemap/robots/meta
- [ ] Forbind Stripe til CTA-knapper
- [ ] Byg medlemslogin og betalings-gate
- [ ] Tilføj et delbart OG-billede (og:image) for pænere links på sociale medier
- [ ] Skriv det fulde lektionsindhold bag hver "Læs hele lektionen"
