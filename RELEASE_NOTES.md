# Release Notes: Amplenote Hemmingway Writing Assistant

## v0.0.4 (2026-09-21)

### 🏗️ Infrastructure & Maintenance
- **Comprehensive Jest Test Suite**: Built 10 dedicated test suites containing 50 unit and integration tests covering the entire plugin pipeline with 100% pass rate:
  - `tokenizer.test.js`: Markdown segmentation, code fence protection, and list boundary handling.
  - `diffEngine.test.js`: Myers/LCS token-level diffing, HTML escaping, and format reconstruction.
  - `reviewSession.test.js`: State transitions, accept/reject/edit decisions, stats calculation, and undo stack.
  - `client.test.js`: API payload generation, thinking toggle, system prompts, and streaming mocks.
  - `diagnostics.test.js`: Zero-token `listModels` connectivity verification and error normalization.
  - `usageTracker.test.js`: Token accounting, daily rollover, and cached input cost calculator.
  - `saveHandler.test.js`: Stale note detection, external edit guards, and Amplenote API commits.
  - `historyViewer.test.js`: Structured audit log parser and companion note fallbacks.
  - `workflow.test.js`: Review orchestration, sequential batch processing, and cancel handlers.
  - `launcher.test.js`: Note selection, pre-flight checks, and session initialization.
- **Automated Test Logging**: Generated standardized test execution logs and artifacts (`test/hemmingway.test.log`, `test/hemmingway.test.txt`, `test/hemmingway.test.md`).
- **Codebase Quality & Lint Hygiene**: Resolved all unused variables and parameters across `launcher.js`, `dashboardTemplate.js`, and test suites. Verified clean lint pass with 0 errors and 0 warnings.

### 🛡️ Security & Integrity
- **Comprehensive Security Audit (`SECURITY.md`)**: Conducted thorough OWASP-aligned audit across iframe sandbox constraints, API key storage, DOM injection vectors, and network boundaries.
- **XSS & Injection Mitigation**: Enforced strict HTML escaping on all raw user prose, markdown diffs, diff chunks, and API error strings before DOM insertion.
- **Iframe & PostMessage Hardening**: Confirmed postMessage target origin validation and iframe sandboxing (`allow-scripts`, `allow-forms`) with zero direct cross-frame exposure.

### 📚 Documentation
- **Technical Architecture & Operations Guide**: Enriched `README.md` with complete module architecture hierarchy, build and test commands, settings references, keyboard shortcuts, and editorial preset guides.

---

## v0.0.3 (2026-09-21)

### 🚀 New Features
- **Zero-Token Connection Diagnostics**: Implemented `listModels` verification (`GET /v1/models`) in Settings and pre-flight to validate API keys and connectivity without consuming token budget.
- **Session Persistence Across Reloads**: In-progress review state, manual modifications, and active decisions are automatically saved to `localStorage` (`ANP_HEMMINGWAY_SESSION_STATE`), ensuring work is never lost during accidental page reloads.
- **Note Tags in Header**: Active Amplenote note tags are queried and rendered as subtle pills (`#tag`) next to the note title in the header subtitle.
- **1-Click Copy Revised Text**: Added a `📋 Copy Revised` action button in the workbench toolbar to instantly copy the full reconstructed markdown document to the clipboard with an in-DOM textarea fallback.

### ⚡ Improvements
- **Ergonomic Model Selectors**: Added reasoning effort configuration (`off`, `low`, `medium`, `xhigh`) directly accessible in the Settings panel.
- **Defensive Error Reporting**: Enhanced network failure notices with actionable instructions for API key provisioning and CORS configuration.

---

## v0.0.2 (2026-09-21)

### 🚀 New Features
- **Sandboxed-Safe In-DOM Modal Architecture**: Replaced all native browser `window.prompt()` and `window.confirm()` calls with responsive in-DOM modal dialogs, eliminating silent iframe restrictions in Amplenote.
- **Interactive Manual Edit Modal (`✏️ Edit`)**: Inspect and fine-tune suggested rewrites in an expansive dialog before accepting.
- **Targeted Guidance Re-Review Modal (`🔄 Re-Review`)**: Re-prompt Hemmingway with targeted editorial instructions (*Make it sound more human*, *Make shorter & punchier*, *Preserve original phrasing*, or *Custom prompt*).
- **Synchronized Dual-Pane Scrolling**: Proportional real-time scroll synchronization between Original draft and Revised polish in side-by-side view.
- **Companion Audit Note Generator**: Optional generation of human-readable Markdown change reports and structured JSON audit records saved under `-reports/-hemmingway/*`.

### ⚡ Improvements
- **Review Navigator Skip Helpers**: Added `⏮ Prev Pending` and `Next Pending ⏭` buttons to skip accepted or rejected items and jump directly to remaining unresolved prose chunks.
- **Dynamic Diff Metrics**: Added live word count differential (+/- words) and total edit counter badges to the workbench toolbar.

---

## v0.0.1 (2026-09-21)

### 🚀 New Features
- **Initial Release: Hemmingway Writing Assistant**: Native Amplenote plugin integrating the open-weights `hemmingway-27b` prose editing model (262k context).
- **7 Pre-Built Editorial Presets**:
  - `Make It Sound Human (De-AIify)`: Eliminates robotic filler, buzzwords, and AI cliches.
  - `The Hemingway Edit (Bold & Direct)`: Trims adverbs, eliminates passive voice, and tightens clauses.
  - `Rough Notes ➔ Polished Prose`: Converts fragmented bullet points into engaging narrative flow.
  - `Executive Brief`: High-signal, structured communication for leaders.
  - `Storytelling & Vivid Narrative`: Enriches drafts with sensory imagery and natural cadence.
  - `Simplify & Clarify (Plain English)`: Demystifies dense academic or technical jargon.
  - `Clean Grammar & Typos Only`: Targeted copyediting preserving author voice.
- **4 Interactive Diff View Modes**: Clean Prose, Unified Inline Diff, Side-by-Side Dual Pane, and Changes Only tabular view.
- **12 Thematic Palettes**: 5 light modes (Clean Daylight, Sepia Parchment, Sakura Blossom, Matcha Latte, Nord Frost) and 7 dark modes (Midnight Slate, Nord Arctic, Glassmorphism, Emerald Forest, Cyber Violet, Espresso Obsidian, Dracula Neo).
