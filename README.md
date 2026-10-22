# Carl John Haro — Interactive portfolio

A static React, Vite, and TypeScript application with six viewport-based sections, Motion transitions, and an interactive Canvas experiment. Current résumé content is sourced from `src/newcv/newcv.pdf`.

## Run locally

Requires Node.js 22.12+ (or a supported newer release).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use the index or keys **1–6** to navigate: Home, About Me, Builds, Experience, Stack, and Contact. Press **?** for keyboard shortcuts. Section hashes support direct links and browser history.

About Me is a top-level section at `#about`, with position `02 / 06`. Use Home in the index or key **1** to return to the hero. Desktop layouts keep the index, content frame, and footer; narrower desktop layouts retain keyboard-accessible About detail tabs. Phones and touch tablets use Menu to open the numbered index in an accessible dialog. Each mobile section scrolls as a document, with the footer following its content. Mobile About presents the portrait, profile, all four disciplines, approach, and recent experience in sequence.

## Add your portrait

Your supplied portrait is installed at **`public/images/profile.jpg`**. To replace it, put the new photo at that same path, then reload the application (or rebuild and redeploy a hosted copy). No code changes are needed. The image fills the existing 4:5 frame with `object-fit: cover`; the frame’s dimensions stay the same while the file loads. A missing or invalid file leaves the designed placeholder visible, with no broken-image icon. No stock or generated person image is included.

## Build and preview

```sh
npm run build
npm run preview
```

The portfolio pages can be served from `dist/` on a static host. The AI chat additionally needs the server endpoint described below; a static-only deployment cannot run Groq requests. Vite uses relative asset paths and navigation uses hashes.

## Portfolio AI chat (Groq)

The assistant has a chat history, free-text input (Enter to send, Shift+Enter for a new line), suggested questions, retry, and New chat. Conversation history stays in browser memory and is sent to Groq for replies; it is not saved to localStorage. Responses use the portfolio's profile, projects, stack, and a server-side experience summary. The UI never substitutes canned answers for AI replies.

1. Set `GROQ_API_KEY` in the local `.env` file (or copy `.env.example` to `.env.local`). Both are ignored by Git. Never put the key in a `VITE_` variable or commit it.
2. Run/restart `npm run dev`. Vite serves `/api/chat` locally and loads the server-only key.
3. For production, deploy this repository to Vercel with the Vite preset and set `GROQ_API_KEY` in the project's server environment. `api/chat.ts` supplies the Node function at `/api/chat`. Other hosts need an equivalent Node handler at that route; `npm run preview` only previews the static frontend.

`GROQ_MODEL` optionally overrides the default `openai/gpt-oss-20b` model. See [Groq's Chat API](https://console.groq.com/docs/api-reference) and [Vercel's Node functions](https://vercel.com/docs/functions/runtimes/node-js). There are no additional SDK dependencies.

The endpoint validates and limits messages, caps output, times out upstream requests, and has a basic per-instance request limit. For a public deployment, use hosting-level rate limits and Groq project spending limits as well; the in-memory limiter is not shared across server instances. Provider errors and secrets are never returned to the browser. An absent key produces an honest connection message with a direct Contact Carl link.

## Project structure

- `src/App.tsx`: persistent shell, navigation, keyboard shortcuts, and transitions.
- `src/views/`: Home, About, Builds, Experience, Stack, and Contact.
- `src/components/Playground.tsx`: responsive Tech Stack Globe with mouse and touch rotation and reduced-motion support.
- `src/components/Portrait.tsx`: local profile photo with a designed loading/missing-image fallback.
- `src/components/Demos.tsx`: preview thumbnails and the demo entry point.
- `src/components/FlightGame.tsx`: original Flappy-style canvas game with tap/click/Space input, collision detection, scoring, pause, and replay. It fills the Builds preview, pauses when hidden or out of view, and cleans up its animation and observers on unmount.
- `src/data.ts`: profile, project descriptions, and stack groups.
- `src/styles.css`: visual system and component styles.
- `src/responsive.css`: desktop viewport adaptations and reduced-motion support.
- `src/mobile.css`: the shared phone/tablet reading flow, touch controls, and section compositions; no height-based text compression.
- `src/about.css`: scoped About layout and compact detail panels.
- `src/navigation.css`: shared index and Connect styling, including the mobile menu dialog. App renders one navigation instance per layout.
- `src/typography.css`: locally hosted font faces and typography hierarchy.
- `public/Carl-John-Haro-Resume.pdf`: downloadable copy of `src/newcv/newcv.pdf`. Replace this public copy when updating; `dist/` is regenerated by the build.
- `tests/portfolio.spec.ts`: navigation, interactions, contact actions, responsive layout, and accessibility checks.
- `tests/about-typography.spec.ts`: section navigation, About panel fit, font rendering, and extended viewport coverage.
- `tests/portrait.spec.ts`: missing/invalid image fallback, successful photo decoding, and stable frame dimensions.
- `tests/mobile-composition.spec.ts`: all six sections across phone/tablet/desktop sizes, document flow, menu focus and resize behavior, actual résumé downloads, mobile demos, and accessibility.

## Typography

Satoshi is the primary variable font (weights 300–900); Geist Mono Regular is reserved for technical metadata. The existing Georgia italic accents remain intentional. Both WOFF2 files live in `public/fonts/`, use `font-display: swap`, and are preloaded locally. No external font requests are made by the application.

Satoshi was obtained from [Fontshare’s official distribution](https://www.fontshare.com/fonts/satoshi), with its original `Satoshi-FFL.txt` license. Geist Mono comes from [Vercel’s official font repository](https://github.com/vercel/geist-font), with `GeistMono-OFL.txt`. The font files are unmodified; retain these license notices when deploying.

## Content and demos

Home's Tech Stack Globe is centered and sized to fill the available visual area, without a frame, projector, captions, or controls. It includes every entry from the existing Stack data and reuses `TechnologyIcon` for local brand logos and semantic icons for unbranded concepts. Technology positions and the closed signal route are randomized on mount. Drag with a mouse or swipe horizontally to rotate; vertical touch scrolling remains available. Front-facing icons appear with their names, positioned to avoid collisions. Mobile uses fewer visible nodes and mesh lines. The existing 2D canvas renderer respects reduced motion and cleans up on unmount, without an additional dependency.

### Iconography

Technology brands use locally hosted SVGs in `public/icons/brands/`, rendered by `BrandIcon.tsx`. Original brand colors and aspect ratios are preserved. SQL, REST APIs, API Integration, RAG, Embeddings, Machine Learning, and PDF Text Extraction are concepts rather than proprietary brands and use semantic Lucide symbols.

Brand assets come from [SVGL](https://github.com/pheralb/svgl), with the missing marks obtained directly from [Phaser](https://phaser.io/download/logo), [Microsoft Power BI](https://github.com/microsoft/PowerBI-Icons), and [Tableau](https://www.tableau.com/themes/custom/tableau_www/logo.v2.svg). Power BI artwork is credited to Microsoft under CC BY 4.0. Included license notices and `sources.json` record the original URLs, hashes, and presentation adjustments. Only the Phaser canvas whitespace and Tableau wordmark canvas are cropped; logo paths and native colors are unchanged.

UI icons use the existing `lucide-react` package. `src/icons.css` defines the shared stroke treatment. GitHub links use the same real brand mark as Stack. The numbered main navigation stays typographic. No external logo requests or additional icon dependencies are needed at runtime.

Stack follows the seven user-supplied résumé groups in `src/data.ts`; `src/stack.css` adapts their tiles for portrait and landscape. To refresh the documented logo sources, run `node scripts/sync-brand-icons.mjs` deliberately (network required); it is not part of normal builds.

### Portfolio content

Builds lists six projects: Playable experiences, CareerForge AI, InsightVault Lite, Developer Portfolio (04), StudyBuddyGPT, and Danger Zone. Developer Portfolio uses a local screenshot and links back to this site's Home view. CareerForge AI's public landing-page screenshot supplies its Builds preview and Home thumbnail, linking to `https://mycareerforge.vercel.app/`. Stack and the Home globe also include Prisma ORM, NextAuth.js, Xendit Payment Integration, Neon, and Playwright.

Project descriptions and work history reflect the updated résumé, including HPL Game Design employment from April through October 2026. Home and About describe this as recent work rather than current employment. Playable experiences emphasizes frontend development and interactive gameplay. Its description explains that client previews and source code are unavailable due to NDA; the Flappy game remains an independent example demo. Danger Zone uses a screenshot linked to its public site.

InsightVault Lite and StudyBuddyGPT use real screenshots captured from their public live sites on October 7, 2026. Optimized JPEGs in `public/images` supply Home thumbnails and edge-to-edge Builds previews. InsightVault's screenshot shows its public sign-in screen; StudyBuddyGPT shows its PDF study entry page. Both screenshots link to the actual apps. These are static images, not embedded apps or generated interfaces. `tests/project-images.spec.ts` verifies image assets, live links, and responsive preview bounds.

GitHub and email use the supplied contact details. InsightVault Lite and StudyBuddyGPT link to the live-demo URLs embedded in the updated résumé. Update `src/data.ts` when those URLs or project details change.

The Contact view opens an email client with the selected topic; it does not submit or store messages. Fonts are bundled locally. There are no tracking scripts or external runtime dependencies.

The Contact page uses `profile.phone` (+63 961 083 4292) for Viber, Telegram, and WhatsApp. Viber uses a native app chat link; Telegram and WhatsApp use phone-number links. Chat delivery/account availability has not been verified. Messaging logos are bundled Simple Icons brand marks in the portfolio's muted color; their source hashes and license are included in `public/icons/brands`.

## Checks

```sh
npm test
npm run format:check
npm run build
```

Playwright uses the locally installed Google Chrome browser. Tests start Vite automatically when needed. The suite covers desktop, mobile, and landscape sizes, reduced motion, browser history, all demos, clipboard copy, résumé downloads, and automated axe accessibility checks.

Desktop retains the one-screen composition, with panel scrolling available on unusually short screens or at increased zoom. Mobile and portrait tablets use natural vertical scrolling, readable supporting type, 44px touch targets, a dedicated live canvas block, vertical Home project previews, and a footer in the document flow. The same data, local brand assets, résumé, and interactive demos serve every layout.

To format source files:

```sh
npm run format
```
