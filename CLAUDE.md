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
# CLAUDE.md — Viega Intelligent Compass: Hackathon Execution Plan

> **This file is the permanent system prompt and strict execution contract for all AI-assisted development during the Futury Accel AI Hack-510 hackathon. Every code decision must reference and respect this document.**

---

## Project Mission

We are building the **Viega Intelligent Compass** — an AI-powered Strategic Intelligence Engine that transforms fragmented public market signals (patents, regulations, competitor PR, commodity prices, tenders) into clear, weighted product decisions (`BUILD / INVEST / IGNORE`) for Viega's Product Managers.
The system uses a Dual-Pass Vertex AI reasoning engine, a multi-source async scraping pipeline, an on-page RAG Evidence Chatbot for interactive signal exploration, and a Human-in-the-Loop 5-Persona Tribunal to replace reactive decision-making with proactive, explainable strategic guidance.

---

## Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| **API Framework** | FastAPI (async, uvicorn server) |
| **Data Validation** | Pydantic v2 (strict models throughout) |
| **AI Reasoning** | Vertex AI — Gemini 1.5 Flash (fast zero-shot filtering) + Gemini 1.5 Pro (dual-pass intelligence engine & persona tribunal) |
| **Database** | Google Cloud Firestore (primary) — SQLite for local dev fallback |
| **Web Scraping** | `async-playwright` + `playwright-stealth` (anti-bot bypass) |
| **Scraping Fallback** | Firecrawl API or ZenRows if Playwright is blocked |
| **RAG Chatbot** | Vertex AI — Gemini 1.5 Pro (context-injected streaming agent) + Firestore as knowledge store |
| **Task Scheduling** | APScheduler (cron trigger every 3 days) |
| **Structured APIs** | EPO OPS REST API, TED EU API, NewsAPI, sec-api, Trading Economics API |
| **Language** | Python 3.10+ |
| **Cloud** | Google Cloud Platform (Vertex AI + Firestore) |

---

## Architecture Data Flow

### Phase 1 — Data Acquisition
A Python APScheduler cron triggers every **3 days**. A fleet of async Playwright-stealth scrapers targets 7 priority source categories (Certifications, Patents, Regulations, Competitor IR/PR, Commodities, Geopolitics, Tenders). Each scraper `POST`s raw collected data to a **FastAPI `/webhook/ingest` endpoint**.

Source coefficient weights (used downstream in scoring):
- Certifications, Patents, Regulations, Competitor PR → `1.0`
- Commodities, Public Tenders → `0.8`
- Geopolitical / Tariff signals → `0.7`

### Phase 2 — Filtration
The webhook handler applies two sequential filters:
1. **Time Filter**: Discard any signal with a timestamp older than 3 days.
2. **LLM Zero-Shot Anti-Hallucination Filter**: A fast Gemini 1.5 Flash call classifies each signal as `RELEVANT` or `SPAM/NOISE`. Only `RELEVANT` signals pass through and are validated against a Pydantic `RawSignal` schema before being queued for the engine.

### Phase 3 — Intelligence Engine (Vertex AI Dual-Pass)
Each validated signal is processed by Gemini 1.5 Pro in two sequential passes, both forced to output strict JSON via `response_mime_type="application/json"`:

- **Pass 1 — Routing Factors**: Extracts `quality_score`, `benefit_score`, `timing_score`, `tech_direction_score` (used for decision routing).
- **Pass 2 — UI Display Metrics**: Estimates `relevance`, `impact`, `urgency`, `risk`, `profit_impact` scores (used for frontend display).

The math engine then applies source coefficient weights and routes the signal to one of three decisions:
- `BUILD` — Gap or unmet demand detected
- `INVEST` — Material or technology shift opportunity
- `IGNORE` — Low confidence, hype, or noise

The final enriched `StrategicSignal` payload (decision + all scores + evidence) is written to **Firestore**.

### Phase 4 — RAG Evidence Chatbot
From the Dashboard, a user can drill into any trend via a **Trend Detail Page**. That page hosts an **On-Page RAG Chatbot** that lets the user interrogate the evidence behind any decision in natural language.

The chat flow hits `POST /chat/rag`:

1. **Fetch context**: retrieve the full `StrategicSignal` document (evidence trail, scores, decision reasoning) from Firestore by `signal_id`.
2. **Inject into prompt**: build a context-enriched prompt — signal evidence + user question — and send it to Gemini 1.5 Pro.
3. **Stream answer**: the response is streamed back to the frontend (Server-Sent Events).

The RAG agent must NEVER hallucinate sources. It may only cite evidence that exists in the retrieved Firestore document. If the answer cannot be derived from the evidence, it must say so explicitly.

### Phase 5 — Human-in-the-Loop (5-Persona Tribunal)
A user on the dashboard clicks **"Summon Tribunal"** and optionally adds free-text feedback. This triggers a `POST /tribunal/summon` endpoint which sends the signal + feedback to Gemini 1.5 Pro with a structured prompt that forces a **5-persona internal debate**:

| Persona | Archetype |
|---|---|
| Josef | The Loyal Traditionalist |
| Steffen | The Demanding Doer |
| David | The Digital Innovator |
| Volkmar | The Cautious Follower |
| Nick | The Sustainable Companion |

The model outputs a structured consensus with a final validated decision and reasoning. If the user validates the consensus, the system **adjusts the math coefficients** in Firestore and reprocesses the signal with the new weights — closing the feedback loop.

---

## Hackathon Implementation Plan (Prioritized)

### Phase 1 — FastAPI Setup & Pydantic Schemas ✅ COMPLETE

- `main.py`: FastAPI app, lifespan setup, router inclusion, uvicorn entry
- `schemas/signals.py`: `RawSignal`, `FilteredSignal`, `StrategicSignal`, `TribunalRequest`, `TribunalResponse` Pydantic models
- `schemas/decisions.py`: `DecisionType` enum, `RoutingFactors`, `UIMetrics`, `StrategicDecision`
- `routers/webhook.py`: `POST /webhook/ingest` endpoint
- `routers/tribunal.py`: `POST /tribunal/summon` endpoint
- `config.py`: Env var loading (GCP project ID, Firestore collection names, model IDs)

### Phase 2 — Playwright Stealth Scrapers ✅ COMPLETE

- `scrapers/base_scraper.py`: Abstract async base class with 3-day freshness check and stealth setup
- `scrapers/scraper_epo_patents.py`: EPO OPS REST API (structured JSON, highest priority)
- `scrapers/scraper_eurlex.py`: EUR-Lex RSS feed parser (regulations)
- `scrapers/scraper_competitor_ir.py`: Playwright-stealth scraper for Geberit, Aalberts, NIBCO IR pages
- `scrapers/scraper_ted_tenders.py`: TED EU API with CPV code 45330000 filtering
- `scrapers/scraper_commodities.py`: Trading Economics / LME copper prices
- `scrapers/scraper_news.py`: NewsAPI with boolean keyword filter
- `scheduler.py`: APScheduler cron job wiring all scrapers → webhook POST

### Phase 3 — Vertex AI Connection & Prompts ✅ COMPLETE

- `engine/vertex_client.py`: Authenticated `GenerativeModel` client wrapper
- `engine/zero_shot_filter.py`: Gemini Flash call — outputs `{"relevant": true/false, "reason": "..."}`
- `engine/dual_pass_extractor.py`: Gemini Pro Pass 1 (routing factors) + Pass 2 (UI metrics)
- `engine/decision_classifier.py`: Math layer — applies weights, computes final `DecisionType`
- `engine/prompts.py`: All prompt templates (zero-shot, dual-pass, tribunal) as typed constants

### Phase 4 — Firestore Integration ✅ COMPLETE

- `database/firestore_client.py`: Authenticated Firestore async client wrapper
- `database/signal_repository.py`: `save_signal()`, `get_signals()`, `update_coefficients()`, `get_signals_by_decision()`
- Collections: `raw_signals`, `strategic_signals`, `tribunal_sessions`, `system_config`

### Phase 5 — RAG Evidence Chatbot ✅ COMPLETE

- `schemas/chat.py`: `ChatRequest` (signal_id, user_question), `ChatResponse` (answer, cited_sources)
- `routers/chat.py`: `POST /chat/rag` endpoint — fetches signal from Firestore, builds context prompt, streams Gemini response via SSE
- `engine/rag_agent.py`: Builds context-injected prompt from `StrategicSignal` evidence + user question; calls Gemini 1.5 Pro with `stream=True`; enforces the no-hallucination rule in the system prompt
- `engine/prompts.py`: Add `RAG_SYSTEM_PROMPT` constant — instructs the model to cite only evidence present in the provided context

### Phase 6 — The Persona Tribunal ✅ COMPLETE

- `engine/tribunal_engine.py`: Builds 5-persona debate prompt → calls Gemini Pro → parses structured consensus JSON
- `engine/coefficient_adjuster.py`: Updates Firestore `system_config` with validated weight changes
- Wire `POST /tribunal/summon` router through tribunal engine → adjuster → Firestore update

---

## Strict Coding Directives

### Python Version & Typing
- Target **Python 3.10+** minimum.
- Use full type annotations everywhere: function signatures, Pydantic fields, return types.
- Prefer `typing.Annotated` + Pydantic `Field()` for schema documentation.

### Vertex AI — Strict JSON Enforcement
Always force structured output from Gemini. **Never parse free-form text from the LLM.**
```python
response = model.generate_content(
    prompt,
    generation_config=GenerationConfig(
        response_mime_type="application/json",
        response_schema=YOUR_PYDANTIC_SCHEMA,
        temperature=0.1,  # Low temp for determinism
    ),
)
```

### Scraping Rule — Playwright Stealth First, Fallback Documented
**ALWAYS use `async-playwright` with `playwright-stealth`** as the default for any scraping target that is not a structured API.
```python
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()
    await stealth_async(page)  # Apply stealth BEFORE navigation
    await page.goto(url)
```
If Playwright is completely blocked by a target (persistent Cloudflare 403 after stealth, CAPTCHA, JS challenge loop), **document the failure in a `SCRAPER_FALLBACKS.md` file** and implement the fallback using the **Firecrawl API** (`firecrawl-py`) or **ZenRows** (`requests` + ZenRows proxy URL). Never silently fail.

### Modularity Rule
- One function = one responsibility. Keep functions under ~40 lines.
- All LLM calls must be in `engine/` only — never inline prompt construction in routers or scrapers.
- All Firestore operations must go through `database/signal_repository.py` — never call Firestore directly from routers.
- Use `async/await` throughout: all FastAPI routes, all scrapers, all DB calls.

### Error Handling
- Use `try/except` only at system boundaries (scraper HTTP calls, Vertex AI calls, Firestore writes).
- On scraper failure: log the error with `logging`, skip the signal, do **not** crash the cron job.
- On LLM parsing failure: log the raw response, raise `ValueError` with the raw text for debugging.

### Environment & Secrets
- All secrets and config in `.env` via `python-dotenv`. Never hardcode project IDs, API keys, or collection names.
- Required env vars: `GCP_PROJECT_ID`, `GCP_LOCATION`, `FIRESTORE_DATABASE`, `NEWS_API_KEY`, `TRADING_ECONOMICS_API_KEY`, `FIRECRAWL_API_KEY` (fallback).

---

## Key Business Constraints (Never Violate)

- **Data scope**: Public data ONLY. No internal Viega systems, no confidential competitor data.
- **Geography**: European Union focus. Prioritize EU regulatory sources and EU competitor filings.
- **Decision output**: Every processed signal MUST resolve to one of: `BUILD | INVEST | IGNORE`. No ambiguous outputs.
- **Freshness**: Signals older than 72 hours are invalid. Enforce this at the time filter, not downstream.
- **Competitors monitored**: Geberit, Conex Bänninger, NIBCO, TECE, SCHELL, Aliaxis, Aalberts.

---

## Data Model Quick Reference

```
RawSignal         → raw webhook payload (source, url, raw_text, timestamp)
FilteredSignal    → post zero-shot validation (adds: relevant: bool, filter_reason)
RoutingFactors    → quality, benefit, timing, tech_direction (0.0–1.0 each)
UIMetrics         → relevance, impact, urgency, risk, profit_impact (0.0–1.0 each)
StrategicSignal   → final DB record (decision, routing_factors, ui_metrics, source_weight, evidence_trail)
TribunalRequest   → signal_id + user_feedback (free text)
TribunalResponse  → persona_votes (dict), consensus_decision, consensus_reasoning, coefficient_adjustments
ChatRequest       → signal_id + user_question (free text)
ChatResponse      → answer (streamed text), cited_sources (list of evidence keys from the signal)
```

---

## File Structure Target

```
viegtor/
└── backend/
    ├── main.py                        ✅
    ├── config.py                      ✅
    ├── scheduler.py                   ✅
    ├── .env.example                   ✅
    ├── requirements.txt               ✅
    ├── routers/
    │   ├── webhook.py                 ✅
    │   ├── signals.py                 ✅
    │   ├── tribunal.py                ✅
    │   └── chat.py                    ✅
    ├── schemas/
    │   ├── signals.py                 ✅
    │   ├── decisions.py               ✅
    │   └── chat.py                    ✅
    ├── engine/
    │   ├── vertex_client.py           ✅
    │   ├── zero_shot_filter.py        ✅
    │   ├── dual_pass_extractor.py     ✅
    │   ├── decision_classifier.py     ✅
    │   ├── rag_agent.py               ✅
    │   ├── tribunal_engine.py         ✅
    │   ├── coefficient_adjuster.py    ✅
    │   └── prompts.py                 ✅
    ├── scrapers/
    │   ├── base_scraper.py            ✅
    │   ├── scraper_epo_patents.py     ✅
    │   ├── scraper_eurlex.py          ✅
    │   ├── scraper_competitor_ir.py   ✅
    │   ├── scraper_ted_tenders.py     ✅
    │   ├── scraper_commodities.py     ✅
    │   └── scraper_news.py            ✅
    └── database/
        ├── firestore_client.py        ✅
        └── signal_repository.py       ✅
```
