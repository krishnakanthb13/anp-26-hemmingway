# 🖋️ Hemmingway Writing Assistant for Amplenote

A modular, human-first AI writing and prose editing assistant for Amplenote powered by the **`hemmingway-27b`** model ([hemmingway.io](https://hemmingway.io/)). Transform rough notes, bullet dumps, and robotic drafts into crisp, natural, engaging prose that reads like a real person wrote it.

---

## ✨ Key Features

- **Human-First Prose Polishing**:
  - Powered by **`hemmingway-27b`** (262k context), an open-weights model fine-tuned specifically to eliminate artificial AI cliches, synthetic cadences, and filler phrases.
- **7 Pre-built Editorial Presets**:
  - `Make It Sound Human (De-AIify)`: Strips buzzwords, robotic transitions, and formulaic structure.
  - `The Hemingway Edit (Bold & Direct)`: Cuts weak adverbs, converts passive voice to active, prunes bloated clauses, and uses vigorous verbs.
  - `Rough Notes ➔ Polished Prose`: Seamlessly transforms meeting fragments and bullet outlines into cohesive narrative paragraphs.
  - `Executive Brief`: High-signal, authoritative, decision-ready communication.
  - `Storytelling & Vivid Narrative`: Enriches drafts with sensory imagery, varied sentence lengths, and natural cadence.
  - `Simplify & Clarify (Plain English)`: Replaces convoluted clauses with simple, crystal-clear prose.
  - `Clean Grammar & Typos Only`: Minimal intervention copyediting.
- **Universal Sandboxed-Safe In-DOM Modal Dialogs**:
  - Eliminates browser-native `window.prompt()`/`window.confirm()` restrictions inside Amplenote iframe embeds.
  - **Manual Edit Modal (`✏️ Edit`)**: Inspect and tweak Hemmingway's suggested rewrite in a full-screen expandable textarea before accepting.
  - **Re-Review with Guidance Modal (`🔄 Re-Review`)**: Re-prompt Hemmingway with targeted editorial instructions (*Make it sound more human*, *Make shorter & punchier*, *Preserve original phrasing*, *Grammar & typos only*, or *Custom prompt*).
  - **Custom Prompt Modal (`+ Custom`)**: Add bespoke system-level editorial instructions for the entire note.
- **Review Navigator & Pending Skip Helpers**:
  - `⏮ Prev Pending` and `Next Pending ⏭` skip reviewed items and jump directly to pending unresolved chunks.
  - Jump to Item selector with live state icons (`✓`, `✕`, `✎`, `●`, `○`).
- **Synchronized Dual-Pane Scrolling**:
  - In Side-by-Side view, scrolling the Original draft proportionally moves the Hemmingway Polish pane in real-time.
- **Word Count & Diff Metrics Badges**:
  - Live metric badges showing original word count, suggested word count, difference (+/- words), and number of modifications.
- **3-Tab Navigation Architecture**:
  - `Studio`: Clean zero-flicker review workbench.
  - `History Logs`: Past review audit records and companion revision notes.
  - `Settings`: Live API diagnostics ping test, Thinking Mode / Reasoning Effort selector, Token usage analytics, and Companion Note Audit toggle.
- **Companion Reports & Audit Logs**:
  - Optional generation of human-readable Markdown changes reports (tagged `-reports/-hemmingway/-changes`) and machine-readable JSON history logs (tagged `-reports/-hemmingway/-history`).
- **Live Token & Cost Analytics**:
  - Tracks prompt tokens, completion tokens, thinking tokens, and estimated costs directly in Amplenote settings.
- **Stale Note Overwrite Guard**:
  - Prevents accidental overwrites if the note was modified externally while the studio was open.

---

## ⚡ Quick Start & Installation

1. **Create a Plugin Note**: In Amplenote, create a new note named `Hemmingway`.
2. **Add Metadata Table**: Insert a table at the very top of your plugin note:

| Field | Value |
| :--- | :--- |
| `name` | Hemmingway |
| `icon` | `edit` |
| `description` | Human-first writing assistant powered by hemmingway-27b. Transform rough notes into natural, polished prose with side-by-side diffs. |
| `instructions` | Select 'Polish with Hemmingway' from Note Options or 'Open Studio' from the Apps menu. Add your API key from hemmingway.io/platform/#keys in Plugin Settings. |
| `setting` | `Hemmingway API Key` |
| `setting` | `Custom Base URL` |
| `setting` | `Hemmingway Usage Stats` |

3. **Paste Compiled Code**: Copy the contents of `build/hemmingway.compiled.js` into the plugin code block.
4. **Configure Your API Key**:
   - Get an API key from [hemmingway.io/platform/#keys](https://hemmingway.io/platform/#keys) (starts with `hemmingway_live_`).
   - Paste your key into the Plugin Settings inside Amplenote.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `A` | Accept active suggestion & jump to next pending |
| `R` | Reject suggestion & jump to next pending |
| `U` or `Ctrl+Z` | Undo last action |
| `N` / `→` | Navigate to Next item |
| `P` / `←` | Navigate to Previous item |
| `Enter` | Polish current item |

---

## 📄 License
GPL v3 - Copyright (C) 2026 Krishna Kanth B