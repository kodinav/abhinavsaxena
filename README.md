# abhinavsaxena.in

Personal website of Abhinav Saxena — philosopher and researcher working on AI, mind, ethics and epistemology.

Built with [Astro 7](https://astro.build): static output, zero framework runtime, self-hosted variable fonts, content collections for everything that changes.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server at `http://localhost:4321` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check Astro, TypeScript and content schemas |
| `npm run cv:pdf` | Render `/cv` to `public/cv/abhinav-saxena-cv.pdf` (run after `build`) |
| `npm run qa:shots` | Screenshot every page at desktop/mobile × light/dark into `qa/` (run after `build`) |
| `npm run qa:interactions` | Drive every interactive feature in headless Chromium and report failures/console errors (run after `build`) |
| `npm run qa:axe` | Run axe-core accessibility checks on every page in both themes (run after `build`) |
| `node scripts/og-image.mjs` | Regenerate the Open Graph image and icons |

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages). No server is required.

## Where things live

```
src/
  content/            ← all editable content (one file per item)
    research/         research areas (.md)
    publications/     papers (.md; body = abstract)
    essays/           essays (.mdx; footnotes + references supported)
    lab/              experiment metadata (.md); code lives in src/scripts/lab
    questions/        the "current questions" on the home page (.md)
    concepts/         nodes of the concept map (.md)
  content.config.ts   schemas — a typo in a reference fails the build, not the reader
  data/site.ts        name, email, profiles, navigation   ← PLACEHOLDERS live here
  data/cv.ts          CV entries                           ← PLACEHOLDERS live here
  components/         Hero, Questions, Constellation, PublicationEntry, EssayCard, …
  layouts/Base.astro  shell: fonts, SEO head, nav, footer, view transitions
  pages/              routes (index, research, publications, essays, lab, ideas, about, cv, contact, rss, robots)
  scripts/            client behaviour (hero field, graphs, reader, archive filters, lab)
  styles/             tokens, base, prose, lab, print
```

## Adding content

**A paper** — create `src/content/publications/<slug>.md`:

```md
---
title: "Title of the paper"
authors: ["Abhinav Saxena"]
venue: "Journal Name"
venueType: journal        # journal | conference | chapter | book | preprint | thesis | other
year: 2026
status: published         # published | forthcoming | under-review | in-progress | preprint
doi: "10.xxxx/xxxxx"      # optional
url: "https://…"          # optional
pdf: "/papers/file.pdf"   # optional (put the file in public/papers/)
areas: [philosophy-of-ai, epistemology]   # ids from src/content/research
topics: [understanding, language models]
featured: true
---
The abstract, in Markdown.
```

**An essay** — create `src/content/essays/<slug>.mdx` with `title`, `description`, `date`, `areas`, `tags`, and optional `subtitle`, `references` (list of `{ text, url }`), `related`. Use `[^1]` for footnotes and `##` headings for the table of contents. Reading time is computed at build.

**A research area** — create `src/content/research/<slug>.md` with `title`, `short`, `order`, `keyQuestions`, `related` (other area ids), `concepts`, and optional `angle`/`radius` hints for the constellation.

**A thought experiment**

1. `src/content/lab/<slug>.md` with `title`, `question`, `summary`, `module`, `duration`, `tags`, `areas`, `concepts`. The body is the framing text.
2. `src/scripts/lab/experiments/<module>.ts` exporting `{ mount(root, ctx) { …; return cleanup } }`. Helpers for sliders, toggles, bars and verdicts are in `src/scripts/lab/ui.ts`.
3. Register the module key in `src/scripts/lab/registry.ts`. It is code-split automatically.

**A concept** — create `src/content/concepts/<slug>.md` with `title`, `definition`, `relations` (`to`, `type`, `note`), `areas`, and `spine: true` if it belongs on the central thread.

## Placeholders to replace

Nothing on the site is invented. Where real information was not available, the placeholder is visible and labelled:

- `src/data/site.ts` — email, affiliation, location, profile URLs (empty URLs render as "link pending"), X handle.
- `src/data/cv.ts` — education, positions, talks, teaching, service, languages (entries with `placeholder: true` show a "replace" mark).
- `src/content/publications/sample-*.md` — six sample entries showing the archive's format. Delete them or set `placeholder: false` after editing.
- The five essays were drafted as starting material in your voice, with real references only. Edit freely.

## Design notes

- **Typography**: Newsreader (variable, optical sizes) for editorial text, Instrument Sans for interface. Both self-hosted and preloaded via Astro's Fonts API with metric-matched fallbacks (no layout shift).
- **Colour**: warm paper + ink + red ochre in light; graphite + bone + ember in dark. Theme follows the system and can be toggled; the choice persists.
- **Motion**: every interaction has a job. Scroll reveals, the hero field, the constellation drift and page transitions all respect `prefers-reduced-motion`; canvases pause when off-screen or when the tab is hidden; particle counts scale with device capability.
- **Performance**: no framework runtime. The home page ships ~50 KB of JavaScript (uncompressed) across code-split modules; lab experiments load only on their own page. Stylesheets are inlined per page; upright font cuts are preloaded, italics load on demand. Lighthouse (desktop, home): 100 / 100 / 100 / 100.
- **SEO**: canonical URLs, Open Graph and Twitter cards, sitemap, robots, RSS, and JSON-LD for Person, WebSite, Article, ScholarlyArticle, BreadcrumbList and ProfilePage.
