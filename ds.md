# 💡 Hemmingway Writing Assistant (`anp-26-hemmingway`) — Design Specification & Execution Plan

> **Plugin:** `anp-26-hemmingway`  
> **Target Platform:** Amplenote Plugin Environment (ESM + IIFE Bundle)  
> **API Backend:** Hemmingway-1 Platform API (`https://hemmingway.io/v1`, Model: `hemmingway-27b`, 262k Context)  
> **Architectural Benchmark:** [`anp-23-grammar-reviewer`](../anp-23-grammar-reviewer)  
> **Date:** September 2026  

---

## 🎯 Phase 1: The Founder's Summary

### 1. Core Value Proposition
Most AI writing assistants in notes sound overtly artificial—dense with synthetic buzzwords, formulaic structures, and generic corporate phrasing. **Hemmingway for Amplenote** integrates the **`hemmingway-27b`** model directly into the Amplenote workflow to transform messy notes, bullet dumps, and robotic drafts into **organic, human-sounding prose that reads like a real person wrote it**.

### 2. The Specific Problem Solved
- **The "AI Slop" Trap**: Standard LLMs inflate writing with fluff. Hemmingway-1 is purpose-trained to write crisp, natural, and expressive English.
- **The Rough-Notes-to-Prose Friction**: Amplenote users capture jots and fragmented thoughts. Turning these into finished newsletters, client updates, executive memos, or journal entries takes too much manual drafting.
- **Loss of Control**: Blindly replacing entire notes causes anxiety. Authors want **granular diffs, accept/reject decision trees, and reasoning visibility** before committing changes.

### 3. Why It Will Work
- Combines the proven, zero-flicker **2-column workbench architecture** of [`anp-23-grammar-reviewer`](../anp-23-grammar-reviewer) with the specialized prose quality of **`hemmingway-27b`**.
- Native OpenAI-compatible wire format with support for **`enable_thinking`** and **`reasoning_effort`**, allowing users to see the stylistic thinking behind each revision.

---

## 🏗️ Phase 2: Deep Dive (System Architecture)

### 1. System Topology

```mermaid
graph TD
    subgraph Amplenote Host Environment
        NO[Note Option: Review in Hemmingway]
        AO[App Option: Open Studio]
        ST[Plugin Settings: API Key, Mode, Thinking]
    end

    subgraph Plugin Core (anp-26-hemmingway)
        Entry[hemmingway.js / Entry Point]
        Engine[Engine: NoteTokenizer & DiffChunker]
        Provider[HemmingwayClient: fetch /v1/chat/completions]
        UI[DashboardTemplate & Reactive Canvas]
        Session[ReviewSession State Machine]
    end

    subgraph Hemmingway Cloud
        API["https://hemmingway.io/v1/chat/completions"]
        Model["hemmingway-27b (262k context)"]
    end

    NO --> Entry
    AO --> Entry
    ST --> Entry
    Entry --> UI
    UI --> Session
    Session --> Engine
    Engine --> Provider
    Provider --> API
    API --> Model
    Model --> Provider
    Provider --> Session
    Session --> UI
```

### 2. File & Modular Architecture

```
anp-26-hemmingway/
├── hemmingway.js                 # Entry point (appOption, noteOption, renderEmbed, onEmbedCall)
├── ds.md                         # Design specification & idea-to-action blueprint
├── README.md                     # User documentation & setup guide
├── package.json                  # Package configuration & scripts
├── lib/
│   ├── constants.js              # Model ID, base URL, presets, prompt templates, themes
│   ├── api/
│   │   ├── client.js             # HTTP wrapper for https://hemmingway.io/v1
│   │   └── diagnostics.js        # Latency ping, auth check, credit/allowance validator
│   ├── engine/
│   │   ├── tokenizer.js          # Sentence, paragraph, and bullet-list tokenization
│   │   ├── diffEngine.js         # Unified, side-by-side, and word-level diff generator
│   │   └── reviewSession.js      # Undo stack, accept/reject state, pending tracking
│   ├── features/
│   │   ├── launcher.js           # Note picker and modal launcher
│   │   ├── workflow.js           # Single-chunk and batch "Transform All" controller
│   │   └── saveHandler.js        # Safe commit back to note with stale-check guard
│   ├── ui/
│   │   ├── dashboardTemplate.js  # 2-Column responsive workbench HTML/CSS
│   │   ├── diffViews.js          # Clean Prose, Inline, Side-by-Side, Changes Only
│   │   └── thinkingCard.js       # Visualizes reasoning_content from Hemmingway-1
│   └── data/
│       ├── store.js              # Active session memory
│       └── usageTracker.js       # Daily & lifetime token/cost tracking
├── test/
│   ├── client.test.js            # API request formatting & error handling tests
│   ├── tokenizer.test.js         # Markdown boundary preservation tests
│   └── diffEngine.test.js        # Diff generation & patch validation tests
└── build/
    └── hemmingway.compiled.js    # Compiled single-file bundle for Amplenote
```

### 3. API Contract (`https://hemmingway.io/v1`)

- **Base URL**: `https://hemmingway.io/v1`
- **Endpoint**: `POST /v1/chat/completions`
- **Default Model**: `hemmingway-27b`
- **Authentication**: `Authorization: Bearer <hemmingway_live_...>`
- **Request Parameters**:
  ```json
  {
    "model": "hemmingway-27b",
    "messages": [
      { "role": "system", "content": "You are Hemmingway, an expert human editor..." },
      { "role": "user", "content": "<Original Text>" }
    ],
    "temperature": 0.3,
    "enable_thinking": true,
    "reasoning_effort": "medium"
  }
  ```
- **Response Fields Utilized**:
  - `choices[0].message.content`: Revised prose.
  - `choices[0].message.reasoning_content`: Model's editorial thought process.
  - `usage`: `prompt_tokens`, `completion_tokens`, `total_tokens`, `cached_tokens`.
- **Handled Error Statuses**:
  - `400 bad_request`: Invalid parameters or empty message payload.
  - `401 bad_key`: Invalid or missing Hemmingway API key.
  - `402 out_of_credit / no_plan`: Account credit exhausted.
  - `429 allowance`: Plan limits reached; displays `resets_at` timestamp.
  - `503 busy / model_unreachable`: Graceful retry banner.

### 4. The "Secret Sauce" & Key Differentiators

1. **The "Human Voice" Presets**:
   - **`Make It Sound Human`**: Cuts robotic cadences, generic buzzwords, and AI cliches.
   - **`The Hemingway Edit`**: Strips adverbs, eliminates passive voice, and cuts bloated clauses.
   - **`Rough Notes ➔ Polished Prose`**: Expands fragments and outlines into natural narrative paragraphs.
   - **`Executive Brief`**: Sharp, punchy, decision-ready communication.
2. **Transparent "Reasoning & Style Insight"**:
   - Hemmingway-1 returns `reasoning_content`. The UI renders this inside an **"Editor's Thinking"** accordion, revealing *why* specific sentences were rearranged or simplified.
3. **Amplenote-Safe Paragraph & Markdown Tokenization**:
   - Respects task boxes (`- [ ]`), bullet hierarchies, headings, and code blocks so notes don't lose formatting during revisions.

---

## 📋 Phase 3: The Execution Plan

### 1. Concrete Actionable Steps

1. **Submodule Setup**: Link `https://github.com/krishnakanthb13/anp-26-hemmingway` as a submodule in `amplenote_stg_plugins` and initialize its directory structure.
2. **Core API Client (`lib/api/client.js`)**: Implement the OpenAI-compatible HTTP adapter for `https://hemmingway.io/v1` targeting `hemmingway-27b`, supporting `enable_thinking`, `reasoning_effort` (`low`, `medium`, `xhigh`), and error mapping (`bad_key`, `out_of_credit`, `no_plan`).
3. **Review Engine & Tokenizer**: Adapt the robust markdown tokenization and diff generation from `anp-23` to support full note, section, and paragraph granularity.
4. **Interactive 2-Column Workbench**: Build the dashboard interface with live side-by-side diff panes, synchronized scrolling, and quick keyboard shortcuts (`A`ccept, `R`eject, `U`ndo, `N`ext).
5. **Editor's Thinking Card**: Add an inspection drawer for Hemmingway's `reasoning_content` to explain stylistic improvements.
6. **API Diagnostics & Key Validator**: Provide a 1-click `[⚡ Test API]` button in settings that pings the endpoint and displays real-time latency and status.
7. **Testing Suite**: Write comprehensive Jest unit tests for tokenization, API error recovery, and diff reconstruction.
8. **Esbuild Bundler Integration**: Add `26` target support to `esbuild.js` to compile to `anp-26-hemmingway/build/hemmingway.compiled.js`.

### 2. Timeline & Milestones

| Stage | Focus | Deliverables |
| :--- | :--- | :--- |
| **Stage 1** | Repository & Foundation | Submodule linked, directory scaffolded, API client and unit tests passing. |
| **Stage 2** | Review Engine & Tokenizer | Markdown-aware chunking, diff algorithm, and session state manager. |
| **Stage 3** | UI & Thinking Drawer | Dual-pane canvas, thinking accordion, preset selector, and theme system. |
| **Stage 4** | Build & End-to-End Verification | Esbuild compilation, Jest test suite execution, and documentation. |

### 3. Risk Analysis

| Risk Type | Risk Description | Mitigation |
| :--- | :--- | :--- |
| **Technical** | `fetch` sandboxing / CORS issues within Amplenote iframe | Amplenote plugins execute in an isolated environment that allows standard `fetch()` to external HTTPS APIs. We configure exact JSON payloads and custom headers. |
| **Technical** | Long thinking tokens eating into `max_tokens` | Hemmingway-1 thinking counts toward `max_tokens`. We expose a setting to configure `reasoning_effort: "low"` or `"medium"`, or toggle `enable_thinking: false` for quick edits. |
| **Product / UX** | Stale overwrites if a note is edited while the review dashboard is open | Implement the Stale Note Overwrite Guard from `anp-23` that compares note update timestamps before writing back. |

### 4. Multilevel Explanations

#### The Pitch (ELI5)
> *"Imagine having an experienced editor sitting next to you while you take notes in Amplenote. Whenever your writing feels stiff or your thoughts are messy bullets, one click turns them into clear, natural prose that sounds like a real person wrote it—while letting you review every single change before approving it."*

#### The Specs (Technical Summary)
> *A modular ESM Amplenote plugin built with an event-driven architecture (`renderEmbed` / `onEmbedCall`). Communicates via standard HTTPS POST with `https://hemmingway.io/v1/chat/completions` using Bearer authentication (`hemmingway_live_*`). Chunks markdown documents into discrete semantic units, computes Levenshtein/word-level diffs, exposes synchronized scrolling in 4 view modes, and stores session state with complete undo/redo capabilities.*

---

## 🔬 Advanced Ideation Framework

### 1. "How Might We" (HMW) Framing
- *HMW make raw bullet points feel instantly publishable without losing the author's original voice?*
- *HMW make Hemmingway's reasoning process visible so users learn to write better as they review suggestions?*

### 2. Sharpening Questions
- **Who is this for?** Note-takers, essayists, researchers, and professionals who write in Amplenote and want high-quality prose without sounding like ChatGPT.
- **What does success look like?** Reviewing a 500-word draft in under 45 seconds, accepting revisions with confidence, and seeing clean markdown saved directly back into the note.

### 3. Hidden Assumptions
1. *Assumption*: The user has an active Hemmingway API key (`hemmingway_live_...` or plan-backed key).  
   *Safety net*: We provide inline setup instructions, key test diagnostics, and explicit error banners for `out_of_credit` or `bad_key`.
2. *Assumption*: Markdown structure (headings, checklist items) should remain intact.  
   *Safety net*: Our tokenization isolates prose blocks while preserving formatting tokens (`#`, `- [ ]`, `> `).

### 4. The "Not Doing" List (MVP Scope Discipline)
- ❌ **Not doing arbitrary multi-model routing in v1**: Focused 100% on perfecting the **`hemmingway-27b`** experience rather than cluttering the interface with 10 different LLM providers (unlike `anp-23` which supports 8 providers).
- ❌ **Not doing auto-saving without review**: The user must retain 100% control through the interactive review workbench; no destructive "auto-replace without review" mode.
- ❌ **Not doing external database syncing**: Everything runs entirely client-side inside Amplenote; zero external server telemetry or data storage.
