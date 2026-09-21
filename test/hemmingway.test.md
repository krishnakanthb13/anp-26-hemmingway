# Test Report — Hemmingway Writing Assistant (anp-26-hemmingway)

**Date**: 2026-09-21  
**Runner**: Jest (Node.js ESM VM Modules)  
**Scope**: Unit, Edge Case, Error Handling, and Regression Suites  

---

## 📊 Summary

| Metric | Result |
| :--- | :--- |
| **Total Test Suites** | 10 ✅ |
| **Total Tests** | 50 |
| **Passed** | 50 ✅ |
| **Failed** | 0 ❌ |
| **Skipped** | 0 ⚠️ |
| **Pass Rate** | 100% |
| **Confidence Score** | 10/10 |
| **Regression Coverage** | Complete |

---

## 🧪 Test Suites Breakdown

| Suite | Tests | Status | Coverage Focus |
| :--- | :---: | :---: | :--- |
| [`test/client.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/client.test.js) | 4 | ✅ Pass | Hemmingway API client, `enable_thinking: false` parameter, `reasoning_effort`, `bad_key` & `out_of_credit` error mapping |
| [`test/diagnostics.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/diagnostics.test.js) | 4 | ✅ Pass | Zero-token credentials verification via `GET /v1/models`, fallback completion, latency calculation, error handling |
| [`test/diffEngine.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/diffEngine.test.js) | 6 | ✅ Pass | Token diff computation, Clean Prose, Inline Diff (`<del>`/`<ins>`), Side-by-Side dual panes, Changes list, `escapeHtml` XSS sanitization |
| [`test/historyAndReports.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/historyAndReports.test.js) | 4 | ✅ Pass | Dynamic markdown backtick expansion, structured JSON audit records, note markdown parsing, companion changes reports |
| [`test/historyViewer.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/historyViewer.test.js) | 4 | ✅ Pass | Note query without invalid `limit` keys, fallback to changes companion notes, empty notebook handling, query exception safety |
| [`test/reviewSession.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/reviewSession.test.js) | 3 | ✅ Pass | Session initialization, inspectable item tracking, accept/reject, undo stack, paragraph-preserving markdown reconstruction |
| [`test/saveHandler.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/saveHandler.test.js) | 6 | ✅ Pass | Stale note overwrite guard with external change confirmation, audit report note generation, permission error handling |
| [`test/tokenizer.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/tokenizer.test.js) | 5 | ✅ Pass | Paragraph splitting preserving empty line separators, code fence protection, sentence splitting with abbreviation protection, full note granularity |
| [`test/usageTracker.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/usageTracker.test.js) | 8 | ✅ Pass | Token accounting with cached inputs ($0.024/M), daily midnight rollover preserving lifetime totals, corrupted JSON tolerance |
| [`test/workflow.test.js`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/workflow.test.js) | 6 | ✅ Pass | Single item review, re-review with custom follow-up guidance, system prompt preset selection, missing API key guard |

---

## 🛡️ Critical Regression Safeguards Verified

1. **Amplenote `filterNotes` Compatibility**:
   - Tests assert that `filterNotes` query objects never include an unsupported `limit` key, preventing runtime crashes reported in Amplenote's plugin runtime.
2. **Stale Note Overwrite Guard**:
   - Tests verify that external changes to notes trigger an explicit confirmation prompt, preventing accidental overwrites.
3. **Official Hemmingway API Conformance**:
   - Tests confirm that `enable_thinking: false` is only sent when thinking is toggled off, and `reasoning_effort` is sent as `"low" | "medium" | "xhigh"` when thinking is active, matching `hemmingway.io/platform/#docs`.
4. **Sandboxed Iframe Conformance**:
   - Tests confirm error and prompt recovery without relying on blocked native browser dialogs (`window.prompt` / `window.confirm`).

---

## 📁 Artifacts
- **Execution Log**: [`test/hemmingway.test.log`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/hemmingway.test.log)
- **Plaintext Summary**: [`test/hemmingway.test.txt`](file:///c:/Users/ADMIN/OneDrive/Documents/GitHub/amplenote_stg_plugins/anp-26-hemmingway/test/hemmingway.test.txt)
