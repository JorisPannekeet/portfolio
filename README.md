# Joris Pannekeet — Portfolio

Personal portfolio with a "Gundam Unicorn / futuristic-manga mecha" visual identity:
ivory armor panels, crimson energy accents, ink panel-lining, background gears and
steam, GSAP-driven motion.

## Stack

- Vite + React 18 + TypeScript + react-router
- GSAP (ScrollTrigger + ScrollSmoother) for smooth scrolling, panel reveals, and the load sequence
- Plain CSS design system in `src/index.css` (no CSS framework)

## Quick start

```bash
npm install
npm run dev
```

## Structure

```
src/
├── data/           # All written content (content.ts, caseStudies.ts) — copy lives here, not in JSX
├── lib/motion.ts   # GSAP setup + scroll-reveal hook
├── components/     # Layout (smooth scroll, header/footer), Panel, Backdrop (gears/steam), Sparkle
└── pages/          # Home, CaseStudies, CaseStudyDetail, HowIWork, About
```

`content.json` in the repo root is the content audit from the redesign — the
agreed inventory of copy that survived it.

## Accessibility & motion

- `prefers-reduced-motion` disables smooth scrolling, reveals, gears, and steam (static fallback)
- Semantic HTML, skip link, visible focus states, WCAG AA contrast on the ivory/crimson palette
- Background gears/steam are dialed back on small screens
