# abhinavsaxena.in

Personal website of Abhinav Saxena — philosopher and researcher working on AI, mind, ethics and epistemology.

Built with [Astro 7](https://astro.build): static output, no framework runtime, self-hosted variable fonts, content collections for everything that changes. The front end is a motion-first experience: a persistent WebGL2 "field of thought" behind every page, a typographic intro, Lenis smooth scrolling with GSAP ScrollTrigger scrollytelling, cinematic page transitions and kinetic variable-font lettering.

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
| `node scripts/qa-experience.mjs` | Capture the intro, hero hover, thread chapter and a page transition with WebGL enabled (run after `build`) |
| `node scripts/og-image.mjs` | Regenerate the Open Graph image and icons |

## Deploying

The repository deploys itself. Every push to `main` runs `.github/workflows/deploy.yml`, which type-checks, builds and publishes `dist/` to **GitHub Pages**. One-time setup on GitHub:

1. Repository → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
2. Under *Custom domain* enter `abhinavsaxena.in` (the `public/CNAME` file already carries it) and tick *Enforce HTTPS* once the certificate is issued.
3. At your DNS provider, point the apex to GitHub Pages (`A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and add `CNAME www → kodinav.github.io`.

Netlify (`netlify.toml`), Vercel (`vercel.json`) and Cloudflare Pages (`public/_headers`) are also configured; any of them can build the repo directly with `npm run build` and publish `dist/`. No server is required.

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
  data/site.ts        name, email, affiliation, profiles, navigation
  data/cv.ts          CV sections (publications come from the collection)
  components/         Hero, Questions, Constellation, PublicationEntry, EssayCard, …
  layouts/Base.astro  shell: fonts, SEO head, nav, footer, view transitions
  pages/              routes (index, research, publications, essays, lab, ideas, about, cv, contact, rss, robots)
  scripts/            client behaviour (graphs, reader, archive filters, lab, home orchestration)
  scripts/field/      the WebGL2 field: gl.ts (helpers), shaders.ts (GLSL), field.ts (engine + presets)
  scripts/motion/     GSAP/Lenis layer: core (registration, smooth scroll, lifecycle), preloader, transitions, text reveals, tilt, kinetic type
  styles/             tokens (dark-first), base, motion, prose, lab, print
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

## Where the facts come from

Everything about Abhinav's record — contact details, education, publications, presentations, referees — comes from his CV and from the published and forthcoming papers. Abstracts are verbatim. Papers under review carry no abstract until he supplies one (the Abstract button hides itself when the body is empty), and their `note` field holds the editorial status, e.g. "Minor revisions requested". A section of the CV with no real entries is removed rather than left empty.

- Add a profile in `src/data/site.ts` and it appears in the footer, About, Contact and the Person JSON-LD.
- Change a paper's `status` (e.g. `under-review` → `forthcoming` → `published`, adding `doi`, `volume`, `pages`) and the archive, CV, PDF and citations follow.
- After any CV change: `npm run build && npm run cv:pdf` to refresh the downloadable PDF.

## The stories

The home page tells stories in its field.

**The hero** plays **"The voice from the wall"** on arrival (eight scenes, about 100 seconds, looping): Plato's cave, from the fire and the shadows to the sun, then the testimony chain and the wall that speaks without a speaker.

**Every other section** has its own story, which begins once a visitor has stayed in it for five seconds without scrolling, clicking or typing, and ends when they move on (or close it):

| Section | Story | Source |
| --- | --- | --- |
| Introduction | The oracle at Delphi | Plato, *Apology* (Jowett) |
| The thread | The gift of fire | Plato, *Protagoras* (Jowett) |
| Questions | What is knowledge? | Plato, *Theaetetus*, *Meno* (Jowett); told after Russell and Gettier |
| Research | The blind men and the elephant | John Godfrey Saxe (1872), after the *Udāna* |
| Publications | The invention of writing | Plato, *Phaedrus* (Jowett) |
| Essays | The piece of wax | Descartes, *Discourse* and *Meditations* (Veitch) |
| Lab | The ship of Theseus | Plutarch (Dryden, ed. Clough); told after Hobbes |
| Ideas | Indra's net | told after the *Avataṃsaka Sūtra* |
| Correspondence | The happy fish | *Zhuangzi* 17 (Giles, 1889) |

Quotations are verbatim from those public-domain translations, checked against Project Gutenberg and Wikisource. Scenes marked `kind: 'telling'` are narration in the site's own words, set upright rather than in italics, with a source line saying what they are told after.

Where a section story plays: the host looks at what is on screen and finds the largest empty area. If there is room, the story plays there in the background, like the hero's, with its caption beneath; the research story plays behind the constellation itself. If there is no room (phones, dense sections), it comes in a small card whose picture mirrors the stage the field draws, placed in empty space or, failing that, where it hides least (never the end of a heading).

- `src/data/stories.ts` — every story's titles, durations, quotations and sources. Edit captions here.
- `src/scripts/story/stories/*.ts` — the pictures: one module per story, each scene a function of time.
- `src/scripts/story/kit.ts` — the scene vocabulary (formations, shadows, lights, glows, lines, labels).
- `src/scripts/story/shapes.ts` — silhouettes and a posable human figure, drawn with Canvas 2D.
- `src/scripts/story/player.ts` — plays a story in the field; `hero.ts` and `sections.ts` decide where and when.
- The field engine's story layer (`StoryState`, `setFormation`, `setMask`, `setMarks`, the `WALL_FS` pass) is inert when no story is playing.
- Reduced motion: scenes are still frames, chosen with the scene buttons. Without WebGL the stories are hidden.
- QA: append `?fieldBudget=0.5` to force particle density on software renderers. `window.__story.go(scene, seconds)` jumps the hero's story; `window.__sectionStory.open(id, scene, seconds)` opens a section story and `.debug(id)` prints the room-finding grid.

## The motion system

- **The field** (`src/scripts/field/`) is raw WebGL2, no Three.js: transform-feedback particles advected by curl noise, bent by concept anchors, the pointer and an ink trail the pointer leaves; a domain-warped fbm fog at reduced resolution; threads and glows between an active concept and its relations. `field.setPreset('mind')` morphs its character; presets exist for every concept on the thread plus `hero`, `ambient`, `reading` and `off`. Each page declares its mode through the `field` prop of `Base.astro`. Software renderers get a light budget; reduced motion renders one settled frame; no WebGL2 falls back to a CSS gradient.
- **Motion layer** (`src/scripts/motion/`): `core.ts` registers GSAP (ScrollTrigger, SplitText, CustomEase) and Lenis and wires them to Astro's ClientRouter lifecycle; `preloader.ts` plays the typographic intro once per session; `transitions.ts` replaces the default crossfade with a curtain that carries the destination's name; `text.ts` powers `data-split="lines|chars|words"`, `data-motion` and `data-parallax`; `kinetic.ts` swells variable-font glyphs under the pointer; `tilt.ts` adds 3D tilt to `[data-tilt]` cards.
- **The thread** (home): a pinned chapter that walks AI → Mind → Agency → Knowledge → Ethics → Responsibility → Technology, morphing the field per concept. It is generated from the `spine: true` concepts, so editing a concept file updates it.
- Everything respects `prefers-reduced-motion`: no intro, no pinning, static thread, no smooth scroll, a still field.

## Design notes

- **Typography**: Newsreader (variable, optical sizes) for editorial text, Instrument Sans for interface. Both self-hosted and preloaded via Astro's Fonts API with metric-matched fallbacks (no layout shift).
- **Colour**: warm paper + ink + red ochre in light; graphite + bone + ember in dark. Theme follows the system and can be toggled; the choice persists.
- **Motion**: every interaction has a job. Scroll reveals, the hero field, the constellation drift and page transitions all respect `prefers-reduced-motion`; canvases pause when off-screen or when the tab is hidden; particle counts scale with device capability.
- **Performance**: no framework runtime. The shared motion bundle (GSAP, Lenis, the field) is ~170 KB uncompressed / ~55 KB over the wire; lab experiments and graphs load only on their own pages. Stylesheets are inlined per page; upright font cuts are preloaded, italics load on demand. Shader compilation is staged across frames and deferred to idle time so first paint is never blocked.
- **SEO**: canonical URLs, Open Graph and Twitter cards, sitemap, robots, RSS, and JSON-LD for Person, WebSite, Article, ScholarlyArticle, BreadcrumbList and ProfilePage.
