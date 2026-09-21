# 🖋️ Hemmingway Writing Assistant for Amplenote

A modular, human-first AI writing and prose editing assistant for Amplenote powered by the **`hemmingway-27b`** model ([hemmingway.io](https://hemmingway.io/)). Transform rough notes, fragmented outlines, meeting dumps, and robotic drafts into crisp, natural, engaging prose that sounds unmistakably human.

---

## ✨ Key Features

- **Human-First Prose Polishing**:
  - Powered by **`hemmingway-27b`** (262k context), an open-weights model fine-tuned specifically to eliminate artificial AI cliches, repetitive cadences, formulaic transitions ("delve", "testament", "tapestry"), and robotic filler.
- **7 Pre-built Editorial Presets**:
  - `Make It Sound Human (De-AIify)`: Strips buzzwords, robotic transitions, and formulaic structure to make drafts sound natural and grounded.
  - `The Hemingway Edit (Bold & Direct)`: Cuts weak adverbs, converts passive voice to active, prunes bloated clauses, and uses vigorous verbs.
  - `Rough Notes ➔ Polished Prose`: Seamlessly transforms meeting fragments and bullet outlines into cohesive narrative paragraphs.
  - `Executive Brief`: High-signal, authoritative, decision-ready communication for leadership and stakeholders.
  - `Storytelling & Vivid Narrative`: Enriches drafts with sensory imagery, varied sentence lengths, and natural cadence.
  - `Simplify & Clarify (Plain English)`: Replaces convoluted clauses with simple, crystal-clear prose.
  - `Clean Grammar & Typos Only`: Minimal intervention copyediting focused purely on spelling, typos, and grammar errors.
- **4 Interactive Diff View Modes**:
  - `✨ Clean Prose`: Displays clean, revised readable text with polished improvements highlighted in emerald green.
  - `🔀 Inline Diff`: Traditional unified diff with inline `<del>` and `<ins>` highlights.
  - `👥 Side-by-Side`: Dual-pane side-by-side comparison with original strikethroughs and suggestion insertions.
  - `📋 Changes Only`: Structured tabular list of itemized modifications with change numbers and type badges.
- **Universal Sandboxed-Safe In-DOM Modal Architecture**:
  - Completely eliminates browser-native `window.prompt()` / `window.confirm()` restrictions inside Amplenote's iframe sandbox.
  - **Manual Edit Modal (`✏️ Edit`)**: Inspect and tweak Hemmingway's suggested rewrite in a full-screen expandable textarea before accepting.
  - **Re-Review with Guidance Modal (`🔄 Re-Review`)**: Re-prompt Hemmingway with targeted editorial instructions (*Make it sound more human*, *Make shorter & punchier*, *Preserve original phrasing*, *Grammar & typos only*, or *Custom prompt*).
  - **Custom Prompt Modal (`+ Custom`)**: Add bespoke system-level editorial instructions for the entire note.
  - **Granularity Change Guard**: Warns before rebuilding chunks if you have unsaved accepted or modified decisions.
- **Review Navigator & Pending Skip Helpers**:
  - `⏮ Prev Pending` and `Next Pending ⏭` skip reviewed items and jump directly to pending unresolved chunks.
  - Jump to Item selector with live state icons (`✓`, `✕`, `✎`, `●`, `○`).
- **Synchronized Dual-Pane Scrolling**:
  - In Side-by-Side view, scrolling the Original draft proportionally moves the Hemmingway Polish pane in real-time.
- **Word Count & Diff Metrics Badges**:
  - Live metric badges showing original word count, suggested word count, difference (+/- words), and number of modifications.
- **`📋 Copy Revised` Quick Action**:
  - Instantly copies the full reconstructed markdown document to your clipboard with in-DOM fallback.
- **Session Persistence in LocalStorage**:
  - In-progress sessions and manual edits are saved to `localStorage` (`ANP_HEMMINGWAY_SESSION_STATE`), ensuring uncommitted work is preserved across refreshes.
- **3-Tab Navigation Architecture**:
  - `Studio`: Clean zero-flicker review workbench.
  - `History Logs`: Past review audit records and companion revision notes.
  - `Settings`: Live API diagnostics ping test, Thinking Mode / Reasoning Effort selector, Token usage analytics, and Companion Note Audit toggle.
- **Companion Reports & Audit Logs (Optional)**:
  - Optional generation of human-readable Markdown changes reports (tagged `-reports/-hemmingway/-changes`) and machine-readable JSON history logs (tagged `-reports/-hemmingway/-history`).
- **Live Token & Cost Analytics**:
  - Tracks prompt tokens, completion tokens, thinking tokens, and estimated costs directly in Amplenote settings, accounting for cached inputs ($0.024/M) vs standard inputs ($0.24/M).
- **Stale Note Overwrite Guard**:
  - Prevents accidental overwrites if the note was modified externally while the studio was open.
- **12 Dynamic Themes**:
  - 12 curated themes across dark and light palettes (Espresso Obsidian, Midnight Slate, Nord Arctic, Glassmorphism, Emerald Forest, Cyber Violet, Dracula Neo, Sepia Parchment, Clean Daylight, Sakura Blossom, Matcha Latte, Nord Frost).

---

## ⚡ Quick Start & Installation

### 1. Create a Plugin Note
In Amplenote, create a new note named `Hemmingway Writing Assistant`.

### 2. Add Metadata Table
Insert a table at the very top of your plugin note:

| Field | Value |
| :--- | :--- |
| `name` | Hemmingway |
| `icon` | `edit` |
| `description` | Human-first writing assistant powered by hemmingway-27b. Transform rough notes into natural, polished prose with side-by-side diffs. |
| `instructions` | Select 'Polish with Hemmingway' from Note Options or 'Open Studio' from the Apps menu. Add your API key from hemmingway.io/platform/#keys in Plugin Settings. |
| `setting` | `Hemmingway API Key` |
| `setting` | `Thinking Effort` |
| `setting` | `Custom Base URL` |
| `setting` | `Hemmingway Usage Stats` |

### 3. Insert Compiled Code
1. Below the table, insert a Javascript code block (type ` ```javascript `).
2. Copy the entire contents of [`build/hemmingway.compiled.js`](build/hemmingway.compiled.js) and paste it into the code block.

### 4. Configure Your Credentials
1. Obtain an API key from [hemmingway.io/platform/#keys](https://hemmingway.io/platform/#keys) (starts with `hemmingway_live_`).
2. Open **Plugin Settings** in Amplenote (or use the **⚙️ Settings** tab inside Hemmingway Studio) and paste your key.
3. Click **⚡ Test Connection** to verify zero-token authentication.

---

## 🎯 Usage & Workflow

### Launching Hemmingway
- **From Any Note**: Click the note triple-dot menu (`...`) ➔ **Note Options** ➔ **Polish with Hemmingway**.
- **From Global Menu**: Open the top-level **Apps** menu ➔ select **Open Studio** ➔ pick any note using the native search picker.

### Reviewing Chunks
1. **Choose Granularity**: Select `Full Note` (for short notes or speeches), `Paragraph` (recommended for essays and documentation), or `Sentence` (for meticulous line-editing).
2. **Select Preset**: Choose an editorial style from the categorized dropdown (e.g. *Make It Sound Human*, *The Hemingway Edit*, *Rough Notes ➔ Polished Prose*) or enter a *Custom Prompt Override*.
3. **Polish**: Click **✨ Polish Current Chunk** (or press `Enter`) or click **⚡ Transform All Pending** to batch-review the entire note sequentially.
4. **Inspect Diff**: Switch between `✨ Clean Prose`, `🔀 Inline Diff`, `👥 Side-by-Side`, and `📋 Changes Only`.
5. **Decide**:
   - `✓ Accept` (or press `A`) to adopt the revision.
   - `✕ Reject` (or press `R`) to keep your original text.
   - `✏️ Edit` to fine-tune the suggestion in an in-DOM modal editor.
   - `🔄 Re-Review` to re-prompt Hemmingway with specific follow-up guidance.
   - `↩ Undo` (or press `U` / `Ctrl+Z`) to reverse your last action.
6. **Save to Note**: Click **💾 Save to Note** to commit changes directly back to your note in Amplenote.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `A` | Accept active suggestion & navigate to next pending item |
| `R` | Reject suggestion & navigate to next pending item |
| `U` or `Ctrl+Z` | Undo last accept, reject, or edit action |
| `N` or `→` | Navigate to Next item |
| `P` or `←` | Navigate to Previous item |
| `Enter` | Polish currently active item |
| `T` | Cycle through 12 dynamic color themes |

---

## ⚙️ Plugin Configuration

| Setting | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `Hemmingway API Key` | String | API key from [hemmingway.io/platform/#keys](https://hemmingway.io/platform/#keys) (`hemmingway_live_...`). | `""` |
| `Thinking Effort` | Select | Reasoning effort level: `off`, `low`, `medium`, or `xhigh`. | `medium` |
| `Custom Base URL` | String | Custom API gateway endpoint. | `https://hemmingway.io/v1` |
| `Hemmingway Usage Stats` | JSON | Automatically managed token counters, daily rollover, and cost estimates. | `{}` |

---

## 🏗️ Technical Architecture

The plugin is structured in a modular, maintainable architecture:

```
anp-26-hemmingway/
├── hemmingway.js                  # Plugin entry point & Amplenote API hooks
├── lib/
│   ├── constants.js               # Presets, theme definitions, and setting keys
│   ├── api/
│   │   ├── client.js              # Hemmingway HTTP client with thinking toggle
│   │   └── diagnostics.js         # Zero-token model check & connection diagnostics
│   ├── data/
│   │   ├── store.js               # In-memory session state store
│   │   ├── usageTracker.js        # Token accounting & cached input cost calculator
│   │   ├── historyManager.js      # Structured JSON audit log builder & parser
│   │   └── reportGenerator.js     # Human-readable Markdown changes report generator
│   ├── engine/
│   │   ├── diffEngine.js          # Token-level LCS diff algorithm & HTML sanitizer
│   │   ├── tokenizer.js           # Markdown paragraph/sentence splitter with code fence protection
│   │   └── reviewSession.js       # Interactive state machine, stats, & undo stack
│   ├── features/
│   │   ├── launcher.js            # Note selection & session bootstrap
│   │   ├── saveHandler.js         # Stale note overwrite guard & commit handler
│   │   ├── historyViewer.js       # Past audit record loader with query fallbacks
│   │   └── workflow.js            # Review orchestrator & batch transformer
│   └── ui/
│       ├── styles.css.js          # 12 themes, modal styling, & scroll sync layout
│       ├── dashboardTemplate.js   # Main full-screen workbench template
│       ├── diffViews.js           # 4 diff mode renderers
│       └── thinkingCard.js        # Collapsible reasoning disclosure component
├── build/
│   └── hemmingway.compiled.js     # Single-file bundled IIFE artifact
├── test/                          # Comprehensive Jest test suite (50 tests, 10 suites)
└── SECURITY.md                    # Security audit verification documentation
```

### Build Command
Compile the single-file distribution bundle:
```bash
node esbuild.js 26
```

### Test Command
Execute the full unit and regression test suite:
```bash
npm test -- anp-26-hemmingway
```

---

## 📄 License

GPL v3 - Copyright (C) 2026 Krishna Kanth B