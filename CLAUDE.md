# CLAUDE.md — Viega Intelligent Compass: Hackathon Execution Plan

> **This file is the permanent system prompt and strict execution contract for all AI-assisted development during the Futury Accel AI Hack-510 hackathon. Every code decision must reference and respect this document.**

---

## Project Mission

We are building the **Viega Intelligent Compass** — an AI-powered Strategic Intelligence Engine that transforms fragmented public market signals (patents, regulations, competitor PR, commodity prices, tenders) into clear, weighted product decisions (`BUILD / INVEST / ADJUST / IGNORE`) for Viega's Product Managers.
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

The math engine then applies source coefficient weights and routes the signal to one of four decisions:
- `BUILD` — Gap or unmet demand detected
- `INVEST` — Material or technology shift opportunity
- `ADJUST` — Direct competitor threat identified
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
- **Decision output**: Every processed signal MUST resolve to one of: `BUILD | INVEST | ADJUST | IGNORE`. No ambiguous outputs.
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
