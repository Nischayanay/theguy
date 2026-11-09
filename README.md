# Content Autopilot — website prototype

Landing page for [@theguy](https://www.instagram.com/theguy/) / [@contentautopilot](https://www.instagram.com/contentautopilot/): a crew flies to the client's city every month, films for 2–3 days, and the next 30 days of content are done.

The page is one overnight flight — it starts in the dark ("unseen") and lands in daylight ("known").

## Run

```bash
npm install
npm run dev -- --port 5173
```

`?intro=1` replays the boarding-pass intro.

## Stack

- Vite + React + TypeScript
- GSAP (ScrollTrigger, SplitText, ScrambleText, DrawSVG, MotionPath) + Lenis smooth scroll
- Vaul (drawer), Sonner (toast), NumberFlow (stats)
- Archivo variable (width axis) + Departure Mono

## Assets

- `public/ig/` — images from the Instagram accounts above
- `public/reels/` — 12s muted loops cut from his reels (see `public/reels/README.txt`)

## Status

Prototype. Not yet done:
- The seat request form is simulated — not wired to email/CRM.
- Sounds are synthesized placeholders.
- Founder name/story copy is a placeholder pending his input.
