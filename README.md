# Senior Frontend Developer Portfolio

A simple yet complete portfolio website built with React, TypeScript, and Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Design system primitives
│   │   ├── Button.tsx   # Variants: primary, secondary, ghost
│   │   ├── Input.tsx    # Accessible form input with error states
│   │   └── Card.tsx     # Compound component for content containers
│   └── layout/          # Page structure components
│       ├── Container.tsx
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── PageLayout.tsx
├── pages/
│   ├── Home.tsx         # Landing page with positioning
│   ├── CaseStudies.tsx  # Case study overview
│   ├── CaseStudyDetail.tsx  # Individual case study template
│   ├── HowIWork.tsx     # Approach and philosophy
│   ├── Components.tsx   # Design system documentation
│   └── About.tsx        # Personal background
├── data/
│   └── caseStudies.ts   # Case study content
├── types/
│   └── index.ts         # Shared type definitions
├── App.tsx              # Routing and layout
├── main.tsx             # Entry point
└── index.css            # Tailwind imports and custom styles
```

## Architecture Decisions

### Why These Choices

- **No UI library**: Components are simple enough that a library adds more complexity than value
- **CSS-in-Tailwind**: Utility classes for most styling, custom CSS only for prose content
- **Route-based code splitting**: Pages load on demand for smaller initial bundle
- **Typed data files**: Case studies as TypeScript objects provide type safety without CMS complexity

### Component Patterns

- **Compound components** (Card.Header, Card.Body): Composition over configuration
- **forwardRef on form elements**: Compatibility with form libraries
- **useId for accessibility**: Automatic unique ID generation for label/input pairs

### What's Intentionally Simple

- No global state management (not needed for a portfolio)
- No form library (controlled inputs are sufficient)
- No animation library (CSS transitions handle hover states)
- No image optimization (native loading="lazy" is enough)

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Customization

### Adding a Case Study

Edit `src/data/caseStudies.ts` and add a new `CaseStudyDetail` object. The type system will enforce the required structure.

### Changing the Theme

Edit `tailwind.config.js` to modify:
- Colors in `theme.extend.colors`
- Fonts in `theme.extend.fontFamily`
- Spacing and other design tokens

### Adding Components

New UI components go in `src/components/ui/`. Follow the existing patterns:
- Accept `className` for styling overrides
- Use `forwardRef` for interactive elements
- Document design decisions in comments

