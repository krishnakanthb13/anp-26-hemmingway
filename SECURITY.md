# Security Audit — Hemmingway Writing Assistant (anp-26-hemmingway)

**Date**: 2026-09-21  
**Auditor**: Antigravity Agent  
**Version**: 1.0.0  

---

## Summary

| Severity | Count | Status |
| :--- | :--- | :--- |
| 🔴 Critical | 0 | None detected |
| 🟡 Warning | 0 | None detected |
| 🟢 Passed | 8 | All checks passed |

---

## Findings

### 🔴 Critical
*None.*

### 🟡 Warning
*None.*

### 🟢 Passed

- **Zero Hardcoded Secrets**: Scanned the entire source tree (`hemmingway.js`, `lib/**/*.js`) for hardcoded credentials, API keys, and sensitive tokens. API keys are purely retrieved at runtime from Amplenote plugin settings (`app.settings`) or user inputs, and are never logged or persisted in source.
- **XSS & Injection Protection**: All note titles, user content, diff fragments, and reasoning insights injected into the DOM or HTML templates are strictly sanitized through `escapeHtml()` in `lib/engine/diffEngine.js`.
- **Safe JSON Embed**: Session data embedded into `<script>` blocks is serialized via `safeJsonEmbed()`, escaping `<`, `>`, `\u2028`, and `\u2029` to prevent `<script>` breakout or inline execution vulnerabilities.
- **No Unsafe Execution (`eval` / `Function`)**: Codebase has zero instances of `eval()`, `new Function()`, `document.write()`, or dynamic code evaluation.
- **Sandboxed Iframe Conformance**: All user dialogs and confirmations use in-DOM modal components (`showAppPrompt`, `showAppChoice`, `showAppConfirm`) instead of browser-level `window.prompt()` / `window.confirm()`, ensuring full compliance with iframe sandboxing policies.
- **Stale Note Overwrite Guard**: `handleSaveAndCommit` checks `app.findNote` timestamps before writing to prevent race conditions and accidental overwrites of externally modified notes.
- **Zero Runtime Dependencies**: The compiled plugin (`build/hemmingway.compiled.js`) has zero runtime third-party npm dependencies; all network communication uses standard Fetch API and native browser runtime capabilities.
- **Root DevDependencies Audit**: `npm audit` was conducted on root repo tooling; devDependencies advisories (`eslint`/`js-yaml`) do not affect the client-side bundle.

---

## Reporting Vulnerabilities

If you discover a potential security vulnerability in this plugin, please open an issue or submit a pull request with details on reproduction steps.
