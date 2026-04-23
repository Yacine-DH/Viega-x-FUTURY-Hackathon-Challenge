# CLAUDE.md — Viega Intelligent Compass

> Context file for Claude (and any future AI assistant) working on this repo.
> Read this first before making changes.

## Project

**Name:** Viega Intelligent Compass
**Context:** Futury × Viega Hackathon 2026
**Repo:** [Viega-x-FUTURY-Hackathon-Challenge](https://github.com/) — frontend prototype

### The pitch
Product Managers at Viega (building-installation technology leader) are "thirsty for insight but drowning in data." Market signals — patents, competitor news, regulations — are scattered and decisions are reactive.

The Intelligent Compass aggregates these signals and translates each into one of three actionable paths:

1. **BUILD** a product (immediate development)
2. **INVEST** in technology (R&D focus)
3. **IGNORE** the hype (filter noise)

### The wow-factor
AI personas debate each signal before a verdict is issued:

- **David** — Digital Innovator (smart-home, IoT, software)
- **Josef** — Loyal Traditionalist (core plumbing, brass, reliability)
- **Steffen** — Efficiency Seeker (installation speed, jobsite ROI)

## Tech stack

- **React 18** with Vite
- **Tailwind CSS** (standard utility classes only — no arbitrary values like `bg-[#FFCC00]`, use inline style for brand colors)
- **lucide-react** for icons
- No backend dependency yet — all data is seeded in `src/constants/`

## Design system

| Token | Value |
|---|---|
| Viega Yellow | `#FFCC00` (exported as `YELLOW`) |
| Yellow hover | `#FFD633` |
| Base background | `zinc-950` / `#09090b` |
| Elevated surface | `zinc-900` / `#18181b` |
| Border | `zinc-800` / `#27272a` |
| Text primary | white |
| Text muted | `zinc-400` / `zinc-500` |

**Rules:**
- Yellow is an accent, never a fill for large areas
- Dark anthracite is the base — premium tech feel
- Animations are subtle (glow pulse on primary rec, staggered fade-in for debate)
- Brand colors go in inline `style={{}}`, layout in Tailwind classes

## Architecture

```
src/
├── App.jsx                      # Top-level view switcher (home / app)
├── pages/
│   ├── HomePage.jsx             # Landing page with hero + feature cards
│   └── Dashboard.jsx            # Main 3-column app
├── components/                  # Reusable UI
├── constants/                   # Seeded data (signals, personas, etc.)
└── lib/
    └── preference.js            # ⚠️ BACKEND CONTRACT — see below
```

### Data flow
1. `App.jsx` toggles between `HomePage` and `Dashboard` based on login state
2. `Dashboard` owns all app state: selected signal, active personas, strategic preference, focus
3. Child components are presentational — state flows down, events bubble up

## Backend contract — `src/lib/preference.js`

**This is the single most important integration point.** The backend team is implementing the "Strategic Preference" logic. The frontend calls `applyPreference(signal, preference)` everywhere the recommendation is rendered.

**Current frontend placeholder:**
```js
applyPreference(signal, preference) → 'BUILD' | 'INVEST' | 'IGNORE'
```

When the backend ships, **swap the function body, keep the signature.** Everything downstream continues to work. No other file needs to change.

**Logic today (to be replaced):**
- `conservative`: requires confidence ≥ 85 for BUILD; downgrades low-impact INVEST to IGNORE
- `balanced`: returns signal's baseline recommendation
- `aggressive`: escalates INVEST→BUILD when impact ≥ 65; IGNORE→INVEST when impact ≥ 70

There's also `getConfidenceAdjusted(signal, preference)` that nudges the confidence number ±6% for visual feedback.

## Features shipped

- [x] Home page with hero, feature cards, stat strip, CTA buttons
- [x] Login modal (demo credentials: `test` / `test`)
- [x] Onboarding modal with 3 strategic focus options — auto-weights persona toggles
- [x] Market Radar feed with type filters and 6 seeded signals
- [x] Compass panel with BUILD/INVEST/IGNORE, animated confidence ring, reasoning bullets
- [x] Strategic Preference toggle (Conservative / Balanced / Aggressive) in header
- [x] Persona toggles in sidebar (David / Josef / Steffen on/off)
- [x] Debate modal with staggered message reveal and per-persona vote summary
- [x] Sign out → returns to home page

## Features not yet built

- [ ] Real Claude API integration for live persona debates (currently scripted)
- [ ] Real backend for preference logic (frontend placeholder in place)
- [ ] Search bar is decorative — no filter logic yet
- [ ] Notifications bell is decorative
- [ ] Settings gear is decorative
- [ ] "Escalate to PM" button is decorative
- [ ] Navigation items besides "Radar" are decorative

## Conventions for future changes

1. **Never use Tailwind arbitrary values** (`bg-[#FFCC00]`, `text-[10px]`) — they don't compile in the artifact sandbox and cause parse errors. Use inline `style={{}}` for brand colors and exact sizes.
2. **Keep `lib/preference.js` as the sole logic boundary** — any logic that could live server-side goes there.
3. **Seed data lives in `constants/`** — treat it as replaceable by API responses.
4. **No localStorage / sessionStorage** — state is in-memory only for the demo.
5. **Personas, preferences and signals are keyed by stable string IDs** (`'david'`, `'conservative'`, etc.) — never by array index.

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, click **Sign In** (top right), enter `test` / `test`, pick a strategic focus, and play with the Strategy toggle + Persona switches.

## Chat log summary (what got built)

1. **Plan** — agreed on 3-column dashboard, persona toggles, debate modal, Viega brand palette
2. **V1 prototype** — single-artifact React app with all core features
3. **Bug fix** — rewrote to eliminate Tailwind arbitrary values that broke the parser
4. **Home page + Login** — added landing page and `test/test` auth gate
5. **Strategic Preference toggle** — implemented frontend logic that dynamically re-highlights the recommended decision across all signals, with "STRATEGY-ADJUSTED" badge when the verdict shifts from baseline
6. **File split** — broke monolith into modular structure (this state)