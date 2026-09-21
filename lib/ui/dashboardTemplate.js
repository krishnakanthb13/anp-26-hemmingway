/**
 * @file dashboardTemplate.js
 * @description Generates the complete HTML string for the Hemmingway Studio full-screen embed.
 * Provides zero-flicker client-side reactivity, in-DOM modal dialogs, synchronized dual-pane diff scrolling,
 * 3 navigation tabs (Studio, History Logs, Settings), and deep editorial controls.
 */

import { EMBED_STYLES } from "./styles.css.js";
import { renderActiveDiff } from "./diffViews.js";
import { renderThinkingCard } from "./thinkingCard.js";
import { escapeHtml } from "../engine/diffEngine.js";
import {
  EDITORIAL_PRESETS,
  RE_REVIEW_REASONS,
  THEMES,
  GRANULARITY_MODES,
  SETTING_API_KEY,
  SETTING_BASE_URL,
  SETTING_THINKING_EFFORT,
  DEFAULT_BASE_URL,
  DEFAULT_THINKING_EFFORT
} from "../constants.js";

/**
 * Safely escapes JSON for inline script injection.
 */
function safeJsonEmbed(obj) {
  if (obj === null || obj === undefined) return "null";
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Returns a unicode icon representing item state for the Jump To selector.
 */
function getItemStatusIcon(status) {
  switch (status) {
    case "accepted": return "✓";
    case "rejected": return "✕";
    case "edited": return "✎";
    case "no_change": return "≡";
    case "ready": return "●";
    default: return "○";
  }
}

/**
 * Renders the jump selector <option> elements.
 * @param {import("../engine/reviewSession.js").ReviewSession|null} session
 * @returns {string}
 */
export function renderJumpOptions(session) {
  if (!session || !session.items) {
    return `<option value="0">No inspectable items</option>`;
  }
  const inspectables = session.items.filter(it => it.isInspectable);
  if (inspectables.length === 0) {
    return `<option value="0">No inspectable items</option>`;
  }
  const currentItem = session.getCurrentItem();
  return inspectables.map((it, idx) => {
    const isCur = it.id === currentItem?.id;
    const icon = getItemStatusIcon(it.status);
    const snippet = (it.original || "").trim().substring(0, 32);
    return `<option value="${it.id}" ${isCur ? "selected" : ""}>${icon} #${idx + 1}: ${escapeHtml(snippet)}...</option>`;
  }).join("");
}

/**
 * Renders grouped editorial presets by category with <optgroup>.
 * @param {import("../engine/reviewSession.js").ReviewSession|null} session
 * @returns {string}
 */
export function renderPresetOptions(session) {
  const categories = ["Voice & Tone", "Conciseness & Style", "Transformation", "Professional & Business", "Correction"];
  let html = "";
  for (const cat of categories) {
    const inCat = EDITORIAL_PRESETS.filter(p => p.category === cat);
    if (inCat.length > 0) {
      html += `<optgroup label="${escapeHtml(cat)}">`;
      for (const p of inCat) {
        const isSel = session && session.presetId === p.id && !session.customPrompt;
        html += `<option value="${p.id}" ${isSel ? "selected" : ""}>${escapeHtml(p.name)}</option>`;
      }
      html += `</optgroup>`;
    }
  }
  html += `<optgroup label="Custom Guidance">
    <option value="__custom__" ${session?.customPrompt ? "selected" : ""}>🎯 Custom Prompt Override...</option>
  </optgroup>`;
  return html;
}

/**
 * Renders state-aware action buttons for the current diff card.
 */
function renderActionButtons(currentItem, canUndo) {
  if (!currentItem) return "";

  const id = currentItem.id;
  const status = currentItem.status || "pending";

  if (status === "pending") {
    return `
      <button class="hm-btn hm-btn-primary" onclick="reviewCurrentChunk()">
        ⚡ Polish This Item
      </button>
      <button class="hm-btn hm-btn-secondary" onclick="promptManualEdit(${id})">
        ✏️ Manual Edit
      </button>
    `;
  }

  if (status === "ready") {
    return `
      <button id="btn-accept" class="hm-btn hm-btn-success" onclick="acceptCurrent()">
        ✓ Accept <kbd style="margin-left: 4px; background: rgba(0,0,0,0.2); border: none; color: #fff;">A</kbd>
      </button>
      <button id="btn-reject" class="hm-btn hm-btn-secondary" onclick="rejectCurrent()">
        ✕ Reject <kbd style="margin-left: 4px; background: rgba(0,0,0,0.2); border: none; color: inherit;">R</kbd>
      </button>
      <button class="hm-btn hm-btn-secondary" onclick="promptManualEdit(${id})">
        ✏️ Edit
      </button>
      <button class="hm-btn hm-btn-secondary" onclick="openReReviewDialog(${id})">
        🔄 Re-Review
      </button>
      ${canUndo ? `<button id="btn-undo" class="hm-btn hm-btn-secondary" onclick="undoAction()">↩ Undo (U)</button>` : ""}
    `;
  }

  if (status === "edited") {
    return `
      <button id="btn-accept" class="hm-btn hm-btn-success" onclick="acceptCurrent()">
        ✓ Accept Edit <kbd style="margin-left: 4px; background: rgba(0,0,0,0.2); border: none; color: #fff;">A</kbd>
      </button>
      <button id="btn-reject" class="hm-btn hm-btn-secondary" onclick="rejectCurrent()">
        ✕ Reject <kbd style="margin-left: 4px; background: rgba(0,0,0,0.2); border: none; color: inherit;">R</kbd>
      </button>
      <button class="hm-btn hm-btn-secondary" onclick="promptManualEdit(${id})">
        ✏️ Edit
      </button>
      <button class="hm-btn hm-btn-secondary" onclick="openReReviewDialog(${id})">
        🔄 Re-Review
      </button>
      ${canUndo ? `<button id="btn-undo" class="hm-btn hm-btn-secondary" onclick="undoAction()">↩ Undo (U)</button>` : ""}
    `;
  }

  // accepted, rejected, no_change
  return `
    <span class="hm-status-tag hm-status-${status}">
      ${status === "accepted" ? "✓ Accepted" : status === "rejected" ? "✕ Kept Original" : "✓ No Changes"}
    </span>
    ${canUndo ? `<button id="btn-undo" class="hm-btn hm-btn-secondary" onclick="undoAction()">↩ Undo (U)</button>` : ""}
    <button class="hm-btn hm-btn-secondary" onclick="promptManualEdit(${id})">
      ✏️ Edit
    </button>
    <button class="hm-btn hm-btn-secondary" onclick="openReReviewDialog(${id})">
      🔄 Re-Review
    </button>
  `;
}

/**
 * Renders the complete Main Canvas HTML (toolbar, word counts, diff viewer, thinking drawer, and bottom actions).
 * @param {import("../engine/reviewSession.js").ReviewSession|null} session
 * @returns {string} HTML string
 */
export function renderCanvasHtml(session) {
  if (!session) {
    return `
      <div class="hm-canvas-scroll" style="align-items: center; justify-content: center; display: flex;">
        <div style="text-align: center; max-width: 440px; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🖋️</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">No Note Selected</h2>
          <p style="font-size: 14px; color: var(--hm-text-muted); margin-bottom: 24px; line-height: 1.5;">
            Select a note from your notebook to begin polishing prose, trimming fluff, and transforming rough drafts into clean prose with Hemmingway.
          </p>
          <button class="hm-btn hm-btn-primary" style="padding: 10px 20px; font-size: 14px;" onclick="changeActiveNote()">
            📂 Select Note to Review
          </button>
        </div>
      </div>
    `;
  }

  const currentItem = session.getCurrentItem();
  const inspectables = session.items.filter(it => it.isInspectable);
  const total = inspectables.length;
  const inspectableIdx = inspectables.indexOf(currentItem);
  const itemNum = inspectableIdx >= 0 ? inspectableIdx + 1 : 1;
  const mode = session.diffViewMode || "clean";

  // Word count metrics
  const origWords = (currentItem?.original || "").trim().split(/\s+/).filter(Boolean).length;
  const suggText = currentItem?.editedContent || currentItem?.suggestion || currentItem?.original || "";
  const suggWords = suggText.trim().split(/\s+/).filter(Boolean).length;
  const diffWords = suggWords - origWords;

  const canUndo = typeof session.canUndo === "function" ? session.canUndo() : (session.undoStack && session.undoStack.length > 0);

  return `
    <!-- View Modes Toolbar -->
    <div class="hm-canvas-toolbar">
      <div class="hm-view-modes">
        <button class="hm-view-mode-btn ${mode === "clean" ? "active" : ""}" onclick="setViewMode('clean')">✨ Clean Prose</button>
        <button class="hm-view-mode-btn ${mode === "inline" ? "active" : ""}" onclick="setViewMode('inline')">🔀 Inline Diff</button>
        <button class="hm-view-mode-btn ${mode === "side" ? "active" : ""}" onclick="setViewMode('side')">👥 Side-by-Side</button>
        <button class="hm-view-mode-btn ${mode === "changes" ? "active" : ""}" onclick="setViewMode('changes')">📋 Changes Only</button>
      </div>

      <div class="hm-word-count-badge">
        <span>Original: <strong>${origWords}</strong>w</span>
        <span>Suggested: <strong>${suggWords}</strong>w</span>
        <span>Diff: <strong>${diffWords >= 0 ? "+" + diffWords : diffWords}</strong>w</span>
      </div>

      <button class="hm-btn hm-btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="copyRevisedText()" title="Copy full revised note markdown to clipboard">
        📋 Copy Revised
      </button>

      <div style="font-size: 12px; color: var(--hm-text-muted); display: flex; align-items: center; gap: 8px;">
        <span>Item <strong>#${itemNum}</strong> of <strong>${total}</strong></span>
        <span style="font-size: 14px;">&bull;</span>
        <span>Status: <strong class="hm-status-tag hm-status-${currentItem?.status || "pending"}">${currentItem?.status || "Pending"}</strong></span>
      </div>
    </div>

    <!-- Diff Scroll Body -->
    <div class="hm-canvas-scroll">
      <div id="diff-mount-point" class="hm-diff-container">
        ${renderActiveDiff(currentItem, mode)}
      </div>

      <div id="thinking-mount-point">
        ${currentItem?.reasoning ? renderThinkingCard(currentItem.reasoning) : ""}
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <footer class="hm-action-bar">
      <div class="hm-action-group">
        ${renderActionButtons(currentItem, canUndo)}
      </div>
      <div class="hm-action-group">
        <button class="hm-btn hm-btn-secondary" onclick="sendAction('prevPending')" title="Jump to previous unreviewed chunk">⏮ Prev Pending</button>
        <button class="hm-btn hm-btn-secondary" onclick="navigatePrev()">← Prev (P)</button>
        <button class="hm-btn hm-btn-secondary" onclick="navigateNext()">Next (N) →</button>
        <button class="hm-btn hm-btn-secondary" onclick="sendAction('nextPending')" title="Jump to next unreviewed chunk">Next Pending ⏭</button>
        <button id="btn-apply-note" class="hm-btn hm-btn-primary" onclick="applyToNote()">💾 Save to Note</button>
      </div>
    </footer>
  `;
}

/**
 * Renders the History Logs view tab.
 */
function renderHistoryView(historyRecords = []) {
  if (!historyRecords || historyRecords.length === 0) {
    return `
      <div class="hm-history-container">
        <div style="text-align: center; padding: 60px 20px; color: var(--hm-text-muted);">
          <div style="font-size: 40px; margin-bottom: 12px;">📜</div>
          <h3 style="font-size: 16px; color: var(--hm-text-main); margin-bottom: 6px;">No Review History Found</h3>
          <p style="font-size: 13px; line-height: 1.5;">
            When you save a reviewed note with the Companion Report option enabled, full audit records and diff summaries are saved here.
          </p>
        </div>
      </div>
    `;
  }

  const cardsHtml = historyRecords.map(rec => {
    const title = rec.sourceNote?.title || rec.noteName || "Untitled Note";
    const date = rec.isoDate ? rec.isoDate.replace("T", " ").substring(0, 16) : "Recent";
    const model = "hemmingway-27b";
    const accepted = rec.session?.stats?.accepted ?? (rec.session?.metrics?.accepted ?? 0);
    const edited = rec.session?.stats?.edited ?? 0;
    const rejected = rec.session?.stats?.rejected ?? 0;

    return `
      <div class="hm-history-card">
        <div class="hm-history-header">
          <a class="hm-history-title" href="javascript:void(0)" onclick="callHost('openNote', '${rec.noteUUID}')" title="Open record note in Amplenote">
            📄 ${escapeHtml(title)} ↗
          </a>
          <span style="font-size: 12px; color: var(--hm-text-muted); font-family: ui-monospace, monospace;">${escapeHtml(date)}</span>
        </div>
        <div class="hm-history-meta">
          <span>Model: <code>${escapeHtml(model)}</code></span>
          <span>&bull;</span>
          <span>Accepted: <strong style="color: var(--hm-success);">${accepted}</strong></span>
          ${edited > 0 ? `<span>&bull;</span><span>Edited: <strong style="color: #f59e0b;">${edited}</strong></span>` : ""}
          <span>&bull;</span>
          <span>Kept Original: <strong style="color: var(--hm-danger);">${rejected}</strong></span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="hm-history-container">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 18px; font-weight: 700;">📜 Review History Records (${historyRecords.length})</h2>
        <button class="hm-btn hm-btn-secondary" style="font-size: 12px;" onclick="sendAction('refreshHistory')">🔄 Refresh</button>
      </div>
      ${cardsHtml}
    </div>
  `;
}

/**
 * Builds the full interactive dashboard HTML.
 * @param {Object} params
 * @param {import("../engine/reviewSession.js").ReviewSession|null} params.session
 * @param {Object} params.settings
 * @param {Object} params.usageStats
 * @param {Array} [params.historyRecords=[]]
 * @param {string} [params.activeTab="review"]
 * @param {string} [params.activeTheme="espresso"]
 * @returns {string} HTML string
 */
export function buildDashboardTemplate({
  session,
  settings = {},
  usageStats = {},
  historyRecords = [],
  activeTab = "review",
  activeTheme = "espresso"
}) {
  const stats = session ? session.getStats() : {
    totalInspectable: 0,
    reviewed: 0,
    pending: 0,
    ready: 0,
    accepted: 0,
    rejected: 0,
    edited: 0,
    progressPercent: 0
  };

  const hasApiKey = Boolean(settings[SETTING_API_KEY] && settings[SETTING_API_KEY].trim());
  const serializedSession = safeJsonEmbed(session ? session.toJSON() : null);
  const serializedStats = safeJsonEmbed(usageStats);
  const serializedReasons = safeJsonEmbed(RE_REVIEW_REASONS);

  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(activeTheme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hemmingway Writing Studio</title>
  <style>
    ${EMBED_STYLES}
  </style>
</head>
<body>

  <!-- Universal Sandboxed-Safe In-DOM Modal Dialog -->
  <div id="hm-modal-backdrop" class="hm-modal-backdrop" style="display: none;">
    <div class="hm-modal-box" id="hm-modal-box">
      <div class="hm-modal-header">
        <h3 id="hm-modal-title" class="hm-modal-title">Dialog</h3>
        <div class="hm-modal-header-actions">
          <button id="hm-modal-btn-enlarge" class="hm-modal-enlarge-btn" onclick="toggleModalEnlarge()" title="Enlarge window / Restore">⛶</button>
          <button class="hm-modal-close" onclick="closeAppModal()" title="Close">✕</button>
        </div>
      </div>
      <div class="hm-modal-body">
        <p id="hm-modal-message" class="hm-modal-message"></p>
        <div id="hm-modal-input-container"></div>
      </div>
      <div class="hm-modal-footer">
        <button class="hm-btn hm-btn-secondary" onclick="closeAppModal()">Cancel</button>
        <button id="hm-modal-btn-confirm" class="hm-btn hm-btn-primary">Confirm</button>
      </div>
    </div>
  </div>

  <!-- Top Progress Loading Bar -->
  <div id="hm-top-loader" class="hm-top-loader"><div class="hm-top-loader-bar"></div></div>

  <!-- Top Operation Toast Banner -->
  <div id="hm-op-banner" class="hm-op-banner">
    <div class="hm-op-spinner"></div>
    <span id="hm-op-banner-text">Hemmingway is writing...</span>
    <button class="hm-btn hm-btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="cancelActiveOperation()">✕ Stop</button>
  </div>

  <!-- Header -->
  <header class="hm-header">
    <div class="hm-header-left">
      <span class="hm-brand-logo">🖋️</span>
      <span class="hm-brand-title">Hemmingway Studio</span>
      ${session?.noteTitle ? `
        <button class="hm-note-link-btn" onclick="handleOpenNote()" title="Open active note in Amplenote (↗)">
          <span>📄</span>
          <strong>${escapeHtml(session.noteTitle)}</strong>
          <span style="font-size: 11px; opacity: 0.75;">↗</span>
        </button>
      ` : `
        <span id="note-title-badge" class="hm-note-badge">📄 No note selected</span>
      `}
      ${session?.noteTags && session.noteTags.length > 0 ? `
        <div style="display: inline-flex; gap: 4px; align-items: center; flex-wrap: wrap;">
          ${session.noteTags.map(t => `<span class="hm-tag-pill">#${escapeHtml(String(t).replace(/^#/, ''))}</span>`).join("")}
        </div>
      ` : ""}
      <button class="hm-btn hm-btn-secondary" style="padding: 3px 8px; font-size: 11px;" onclick="changeActiveNote()" title="Open note search picker">
        📂 ${session ? "Switch Note" : "Select Note"}
      </button>
      ${session ? `
        <button class="hm-btn hm-btn-secondary" style="padding: 3px 8px; font-size: 11px; color: var(--hm-danger);" onclick="confirmResetSession()" title="Reset review session and clear in-progress changes">
          ✕ Reset
        </button>
      ` : ""}
    </div>
    <div class="hm-header-right">
      <div class="hm-nav-tabs">
        <button id="tab-btn-review" class="hm-nav-tab ${activeTab === "review" ? "active" : ""}" onclick="switchTab('review')">Studio</button>
        <button id="tab-btn-history" class="hm-nav-tab ${activeTab === "history" ? "active" : ""}" onclick="switchTab('history')">History Logs (${historyRecords.length})</button>
        <button id="tab-btn-settings" class="hm-nav-tab ${activeTab === "settings" ? "active" : ""}" onclick="switchTab('settings')">⚙️ Settings</button>
      </div>
      <button class="hm-btn hm-btn-secondary" id="theme-cycler-btn" onclick="cycleTheme()" title="Click to cycle themes (or press T)">
        <span id="theme-icon">☕</span>
        <span id="theme-name">Theme</span>
      </button>
    </div>
  </header>

  <!-- Main View Area (Studio) -->
  <div id="view-review" class="hm-workbench" style="${activeTab === "review" ? "" : "display: none;"}">
    
    <!-- Left Sidebar Inspector -->
    <aside class="hm-sidebar">
      
      <!-- Preset Selection -->
      <div class="hm-control-group">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label class="hm-section-title">Editorial Preset</label>
          <button class="hm-btn hm-btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="openCustomPromptModal()" title="Add custom instruction">+ Custom</button>
        </div>
        <select id="preset-selector" class="hm-select" onchange="onPresetChange(this.value)">
          ${renderPresetOptions(session)}
        </select>
        
        <div id="preset-desc-box" class="hm-preset-desc">
          ${session?.customPrompt
            ? `🎯 <em>Custom:</em> "${escapeHtml(session.customPrompt)}"`
            : (EDITORIAL_PRESETS.find(p => p.id === (session?.presetId || "human_polish"))?.description || "")}
        </div>

        ${session?.customPrompt ? `
          <button class="hm-btn hm-btn-secondary" style="font-size: 11px; padding: 2px 8px; margin-top: 4px;" onclick="handleClearCustomPrompt()">
            ✕ Clear Custom Prompt
          </button>
        ` : ""}
      </div>

      <!-- Granularity Segmented Control -->
      <div class="hm-control-group">
        <label class="hm-section-title">Granularity</label>
        <div class="hm-segmented">
          <button id="seg-btn-full" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.FULL ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.FULL}')">Full Note</button>
          <button id="seg-btn-paragraph" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.PARAGRAPH ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.PARAGRAPH}')">Paragraph</button>
          <button id="seg-btn-sentence" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.SENTENCE ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.SENTENCE}')">Sentence</button>
        </div>
      </div>

      <!-- Primary Action Buttons -->
      <div class="hm-control-group" style="gap: 8px;">
        <button id="btn-review-chunk" class="hm-btn hm-btn-primary hm-btn-full" onclick="reviewCurrentChunk()">
          ✨ Polish Current Chunk
        </button>
        <button id="btn-review-all" class="hm-btn hm-btn-secondary hm-btn-full" onclick="reviewAllPending()">
          ⚡ Transform All Pending
        </button>
      </div>

      <!-- Progress Tracking -->
      <div class="hm-progress-card">
        <div class="hm-progress-header">
          <span id="progress-label">Progress (${stats.reviewed}/${stats.totalInspectable})</span>
          <span id="progress-pct">${stats.progressPercent}%</span>
        </div>
        <div class="hm-progress-bar-bg">
          <div id="progress-bar-fill" class="hm-progress-bar-fill" style="width: ${stats.progressPercent}%;"></div>
        </div>
      </div>

      <!-- Jump to Chunk Selector -->
      <div class="hm-control-group">
        <label class="hm-section-title">Jump to Item</label>
        <select id="jump-selector" class="hm-select" onchange="jumpToItem(Number(this.value))">
          ${renderJumpOptions(session)}
        </select>
      </div>

      <!-- Power Shortcuts -->
      <div class="hm-control-group" style="margin-top: auto; font-size: 11px; color: var(--hm-text-muted);">
        <div class="hm-section-title">Shortcuts</div>
        <div><kbd>A</kbd> Accept &bull; <kbd>R</kbd> Reject &bull; <kbd>U</kbd> Undo</div>
        <div><kbd>N</kbd> / <kbd>→</kbd> Next &bull; <kbd>P</kbd> / <kbd>←</kbd> Prev</div>
        <div><kbd>T</kbd> Cycle Theme &bull; <kbd>Enter</kbd> Polish Chunk</div>
      </div>

    </aside>

    <!-- Main Canvas Mount -->
    <main id="main-canvas-mount" class="hm-canvas">
      ${renderCanvasHtml(session)}
    </main>

  </div>

  <!-- History View Area -->
  <div id="view-history" class="hm-workbench" style="${activeTab === "history" ? "" : "display: none;"}">
    ${renderHistoryView(historyRecords)}
  </div>

  <!-- Settings View Area -->
  <div id="view-settings" class="hm-workbench" style="${activeTab === "settings" ? "" : "display: none;"}">
    <div class="hm-settings-container">
      
      <div class="hm-settings-card">
        <div class="hm-settings-title">
          <span>🔑 Hemmingway API Credentials</span>
          <span id="api-status-badge" style="font-size: 12px; margin-left: auto; color: ${hasApiKey ? "var(--hm-success)" : "var(--hm-danger)"};">
            ${hasApiKey ? "🟢 Connected" : "🔴 Missing Key"}
          </span>
        </div>
        <p style="font-size: 13px; color: var(--hm-text-muted);">
          Enter your Hemmingway API key to connect to <code>hemmingway-27b</code>. 
          Manage your keys at <a href="https://hemmingway.io/platform/#keys" target="_blank" style="color: var(--hm-accent);">hemmingway.io/platform/#keys</a>.
        </p>
        <div class="hm-control-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="hm-section-title">Hemmingway API Key</label>
            <button class="hm-btn hm-btn-secondary" style="font-size: 11px; padding: 2px 6px;" onclick="toggleKeyVisibility()">👁️ Show/Hide</button>
          </div>
          <input type="password" id="input-api-key" class="hm-input" placeholder="hemmingway_live_..." value="${escapeHtml(settings[SETTING_API_KEY] || "")}">
        </div>
        <div class="hm-control-group">
          <label class="hm-section-title">Custom Base URL (Optional)</label>
          <input type="text" id="input-base-url" class="hm-input" placeholder="https://hemmingway.io/v1" value="${escapeHtml(settings[SETTING_BASE_URL] || DEFAULT_BASE_URL)}">
        </div>
        <div class="hm-control-group">
          <label class="hm-section-title">Thinking Mode / Reasoning Effort</label>
          <select id="input-thinking-effort" class="hm-select">
            <option value="off" ${(settings[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT) === "off" ? "selected" : ""}>Off (Fastest standard generation)</option>
            <option value="low" ${(settings[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT) === "low" ? "selected" : ""}>Low (Quick reasoning check)</option>
            <option value="medium" ${(settings[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT) === "medium" ? "selected" : ""}>Medium (Recommended default)</option>
            <option value="xhigh" ${(settings[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT) === "xhigh" ? "selected" : ""}>X-High (Maximum deep reflection)</option>
          </select>
        </div>
        <div class="hm-control-group">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="settings-audit-toggle" onchange="toggleAuditNotesSetting(this.checked)">
            <span>Generate companion report and audit log notes when saving</span>
          </label>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button class="hm-btn hm-btn-primary" onclick="saveSettings()">Save Settings</button>
          <button id="btn-test-api" class="hm-btn hm-btn-secondary" onclick="testConnection()">⚡ Test Connection</button>
        </div>
        <div id="test-api-result" style="font-size: 13px; display: none;"></div>
      </div>

      <!-- Usage Statistics -->
      <div class="hm-settings-card">
        <div class="hm-settings-title">
          <span>📊 Token Usage & Cost Analytics</span>
        </div>
        <table class="hm-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Requests</th>
              <th>Prompt Tokens</th>
              <th>Completion Tokens</th>
              <th>Thinking Tokens</th>
              <th>Est. Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Today</strong></td>
              <td>${usageStats.todayRequests || 0}</td>
              <td>${usageStats.todayPromptTokens || 0}</td>
              <td>${usageStats.todayCompletionTokens || 0}</td>
              <td>${usageStats.todayThinkingTokens || 0}</td>
              <td>$${(usageStats.todayCostUSD || 0).toFixed(4)}</td>
            </tr>
            <tr>
              <td><strong>Lifetime</strong></td>
              <td>${usageStats.lifetimeRequests || 0}</td>
              <td>${usageStats.lifetimePromptTokens || 0}</td>
              <td>${usageStats.lifetimeCompletionTokens || 0}</td>
              <td>${usageStats.lifetimeThinkingTokens || 0}</td>
              <td>$${(usageStats.lifetimeCostUSD || 0).toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button class="hm-btn hm-btn-secondary" style="font-size: 12px;" onclick="resetUsageStats(false)">Reset Today's Stats</button>
          <button class="hm-btn hm-btn-secondary" style="font-size: 12px;" onclick="resetUsageStats(true)">Reset All Stats</button>
        </div>
      </div>

    </div>
  </div>

  <!-- Injected Client State & Script -->
  <script>
    let currentSession = ${serializedSession};
    let currentUsage = ${serializedStats};
    const RE_REVIEW_REASONS = ${serializedReasons};
    const THEMES = ${safeJsonEmbed(THEMES)};
    let activeModalCallback = null;

    // In-DOM Modal Helpers
    function showAppPrompt({ title = "Input", message = "", defaultValue = "", isTextarea = false, isLarge = false, allowEnlarge = false, placeholder = "", onConfirm }) {
      const backdrop = document.getElementById("hm-modal-backdrop");
      const titleElem = document.getElementById("hm-modal-title");
      const msgElem = document.getElementById("hm-modal-message");
      const inputContainer = document.getElementById("hm-modal-input-container");
      const confirmBtn = document.getElementById("hm-modal-btn-confirm");
      const enlargeBtn = document.getElementById("hm-modal-btn-enlarge");
      const box = document.getElementById("hm-modal-box");

      if (!backdrop || !inputContainer) return;

      titleElem.innerText = title;
      msgElem.innerText = message;
      msgElem.style.display = message ? "block" : "none";

      if (enlargeBtn) enlargeBtn.style.display = allowEnlarge ? "inline-flex" : "none";
      if (box) {
        box.classList.toggle("hm-modal-large", isLarge);
        box.classList.remove("enlarged");
      }

      if (isTextarea) {
        inputContainer.innerHTML = '<textarea id="hm-modal-input" class="hm-modal-input" rows="8" style="resize: vertical; font-family: ui-monospace, monospace; font-size: 13.5px;" placeholder="' + escapeHtml(placeholder) + '">' + escapeHtml(defaultValue) + '</textarea>';
      } else {
        inputContainer.innerHTML = '<input type="text" id="hm-modal-input" class="hm-modal-input" value="' + escapeHtml(defaultValue) + '" placeholder="' + escapeHtml(placeholder) + '">';
      }

      confirmBtn.className = "hm-btn hm-btn-primary";
      confirmBtn.innerText = "Confirm";

      activeModalCallback = () => {
        const input = document.getElementById("hm-modal-input");
        const val = input ? input.value : "";
        closeAppModal();
        if (typeof onConfirm === "function") onConfirm(val);
      };

      confirmBtn.onclick = activeModalCallback;
      backdrop.style.display = "flex";
      setTimeout(() => document.getElementById("hm-modal-input")?.focus(), 50);
    }

    function showAppChoice({ title = "Select Option", message = "", options = [], defaultSelected = "", onConfirm }) {
      const backdrop = document.getElementById("hm-modal-backdrop");
      const titleElem = document.getElementById("hm-modal-title");
      const msgElem = document.getElementById("hm-modal-message");
      const inputContainer = document.getElementById("hm-modal-input-container");
      const confirmBtn = document.getElementById("hm-modal-btn-confirm");

      if (!backdrop || !inputContainer) return;

      titleElem.innerText = title;
      msgElem.innerHTML = message;
      msgElem.style.display = message ? "block" : "none";

      const selectedVal = defaultSelected || (options[0] && options[0].id) || "";

      const optionsHtml = options.map((opt, i) => {
        const isSel = opt.id === selectedVal || (!selectedVal && i === 0);
        return '<label class="hm-modal-radio-item ' + (isSel ? 'selected' : '') + '" data-opt-id="' + opt.id + '" onclick="selectModalRadioOption(this.dataset.optId)">' +
          '<input type="radio" name="modal_choice" value="' + opt.id + '" ' + (isSel ? 'checked' : '') + ' style="margin-top: 3px;">' +
          '<div>' +
            '<div style="font-weight: 600; font-size: 13px; color: var(--hm-text-main);">' + (opt.label || opt.name) + '</div>' +
            (opt.prompt ? '<div style="font-size: 11.5px; color: var(--hm-text-muted); margin-top: 2px;">' + opt.prompt + '</div>' : '') +
          '</div>' +
        '</label>';
      }).join("");

      inputContainer.innerHTML = '<div class="hm-modal-radio-list">' + optionsHtml + '</div>' +
        '<div id="modal-custom-subinput-area" style="margin-top: 10px; display: none;">' +
          '<input type="text" id="modal-custom-subinput" class="hm-modal-input" placeholder="Enter custom instructions for Hemmingway...">' +
        '</div>';

      confirmBtn.className = "hm-btn hm-btn-primary";
      confirmBtn.innerText = "Apply & Review";

      activeModalCallback = () => {
        const checkedRadio = document.querySelector('input[name="modal_choice"]:checked');
        const choiceId = checkedRadio ? checkedRadio.value : selectedVal;
        const customSub = document.getElementById("modal-custom-subinput")?.value || "";
        closeAppModal();
        if (typeof onConfirm === "function") onConfirm(choiceId, customSub);
      };

      confirmBtn.onclick = activeModalCallback;
      backdrop.style.display = "flex";
    }

    function selectModalRadioOption(val) {
      document.querySelectorAll(".hm-modal-radio-item").forEach(el => {
        const input = el.querySelector("input");
        if (input) {
          const isMatch = input.value === val;
          input.checked = isMatch;
          el.classList.toggle("selected", isMatch);
        }
      });
      const subArea = document.getElementById("modal-custom-subinput-area");
      if (subArea) {
        subArea.style.display = val === "custom" ? "block" : "none";
        if (val === "custom") {
          document.getElementById("modal-custom-subinput")?.focus();
        }
      }
    }

    function showAppConfirm({ title = "Confirm", message = "", confirmLabel = "OK", isDanger = false, onConfirm }) {
      const backdrop = document.getElementById("hm-modal-backdrop");
      const titleElem = document.getElementById("hm-modal-title");
      const msgElem = document.getElementById("hm-modal-message");
      const inputContainer = document.getElementById("hm-modal-input-container");
      const confirmBtn = document.getElementById("hm-modal-btn-confirm");

      if (!backdrop) return;
      titleElem.innerText = title;
      msgElem.innerHTML = message;
      msgElem.style.display = message ? "block" : "none";
      if (inputContainer) inputContainer.innerHTML = "";

      confirmBtn.className = isDanger ? "hm-btn hm-btn-danger" : "hm-btn hm-btn-primary";
      confirmBtn.innerText = confirmLabel;

      activeModalCallback = () => {
        closeAppModal();
        if (typeof onConfirm === "function") onConfirm();
      };

      confirmBtn.onclick = activeModalCallback;
      backdrop.style.display = "flex";
    }

    function closeAppModal() {
      const backdrop = document.getElementById("hm-modal-backdrop");
      if (backdrop) backdrop.style.display = "none";
      activeModalCallback = null;
    }

    function toggleModalEnlarge() {
      const box = document.getElementById("hm-modal-box");
      if (box) box.classList.toggle("enlarged");
    }

    function promptManualEdit(itemId) {
      const item = currentSession?.items?.find(it => it.id === itemId);
      const currentText = item?.editedContent || item?.suggestion || item?.original || "";
      showAppPrompt({
        title: "Manual Edit (Item #" + (itemId + 1) + ")",
        message: "Directly edit the rewritten text before accepting (click ⛶ to expand full-screen):",
        defaultValue: currentText,
        isTextarea: true,
        isLarge: true,
        allowEnlarge: true,
        onConfirm: (edited) => {
          if (edited !== null && edited !== undefined) {
            sendAction("manualEditItem", itemId, edited);
          }
        }
      });
    }

    function openReReviewDialog(itemId) {
      showAppChoice({
        title: "Re-Review Item #" + (itemId + 1),
        message: "Select guidance for re-reviewing this section with Hemmingway-1:",
        options: RE_REVIEW_REASONS,
        defaultSelected: "more_human",
        onConfirm: (choiceId, customSub) => {
          let instruction = "";
          if (choiceId === "custom" && customSub && customSub.trim().length > 0) {
            instruction = customSub.trim();
          } else {
            const selected = RE_REVIEW_REASONS.find(r => r.id === choiceId);
            if (selected) instruction = selected.prompt;
          }
          showBanner("Re-reviewing Item #" + (itemId + 1) + " with Hemmingway...");
          sendAction("reReviewItem", itemId, instruction).then(() => hideBanner());
        }
      });
    }

    function openCustomPromptModal() {
      const cur = currentSession?.customPrompt || "";
      showAppPrompt({
        title: "Custom Editorial Instruction",
        message: "Provide specific guidance for how Hemmingway should edit or polish your text:",
        defaultValue: cur,
        isTextarea: true,
        isLarge: true,
        placeholder: "e.g. Write in first person, keep bullet points intact, sound conversational...",
        onConfirm: (customText) => {
          const trimmed = (customText || "").trim();
          if (trimmed.length > 0) {
            sendAction("setCustomPrompt", trimmed);
          } else {
            sendAction("clearCustomPrompt");
          }
        }
      });
    }

    function handleClearCustomPrompt() {
      sendAction("clearCustomPrompt");
    }

    function handleOpenNote() {
      if (currentSession?.noteUUID) {
        callHost("openNote", currentSession.noteUUID);
      }
    }

    // Synchronized Scrolling for Dual-Pane Diff View
    function initScrollSync() {
      const leftPane = document.getElementById("original-pane");
      const rightPane = document.getElementById("suggestion-pane");
      if (!leftPane || !rightPane) return;

      let isSyncingLeft = false;
      let isSyncingRight = false;

      leftPane.onscroll = () => {
        if (isSyncingLeft) {
          isSyncingLeft = false;
          return;
        }
        isSyncingRight = true;
        const maxLeft = leftPane.scrollHeight - leftPane.clientHeight;
        const maxRight = rightPane.scrollHeight - rightPane.clientHeight;
        if (maxLeft > 0 && maxRight > 0) {
          rightPane.scrollTop = (leftPane.scrollTop / maxLeft) * maxRight;
        } else {
          rightPane.scrollTop = leftPane.scrollTop;
        }
      };

      rightPane.onscroll = () => {
        if (isSyncingRight) {
          isSyncingRight = false;
          return;
        }
        isSyncingLeft = true;
        const maxLeft = leftPane.scrollHeight - leftPane.clientHeight;
        const maxRight = rightPane.scrollHeight - rightPane.clientHeight;
        if (maxLeft > 0 && maxRight > 0) {
          leftPane.scrollTop = (rightPane.scrollTop / maxRight) * maxLeft;
        } else {
          leftPane.scrollTop = rightPane.scrollTop;
        }
      };
    }

    // Session Persistence in localStorage
    const STORAGE_KEY = "ANP_HEMMINGWAY_SESSION_STATE";
    if (currentSession) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
      } catch (e) {}
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.noteUUID && parsed.items && parsed.items.length > 0) {
            sendAction("restoreSession", parsed);
          }
        }
      } catch (e) {}
    }

    function confirmResetSession() {
      showAppConfirm({
        title: "Reset Review Session?",
        message: "Are you sure you want to reset the current review session and clear in-progress changes? This will restore the original note baseline.",
        confirmLabel: "Yes, Reset",
        isDanger: true,
        onConfirm: () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
          sendAction("clearSession");
        }
      });
    }

    async function copyRevisedText() {
      const res = await callHost("getRevisedContent");
      if (res && res.content !== undefined) {
        try {
          await navigator.clipboard.writeText(res.content);
          showBanner("✓ Copied full revised note text to clipboard!");
          setTimeout(hideBanner, 2000);
        } catch (e) {
          showAppPrompt({
            title: "Revised Document Markdown",
            message: "Copy the full revised text below (click ⛶ to expand full-screen):",
            defaultValue: res.content,
            isTextarea: true,
            isLarge: true,
            allowEnlarge: true
          });
        }
      }
    }

    // Companion Audit Note setting in localStorage
    const AUDIT_STORAGE_KEY = "ANP_HEMMINGWAY_CREATE_AUDIT_NOTES";
    function isAuditNotesEnabled() {
      try {
        return localStorage.getItem(AUDIT_STORAGE_KEY) === "true";
      } catch (e) {
        return false;
      }
    }
    function toggleAuditNotesSetting(checked) {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, checked ? "true" : "false");
      } catch (e) {}
    }
    function syncAuditCheckboxes() {
      const cb = document.getElementById("settings-audit-toggle");
      if (cb) cb.checked = isAuditNotesEnabled();
    }
    syncAuditCheckboxes();

    function callHost(action, ...args) {
      if (typeof window.callAmplenotePlugin === "function") {
        return window.callAmplenotePlugin(action, ...args);
      }
      console.warn("callAmplenotePlugin not available in this environment.");
      return Promise.resolve(null);
    }

    function showBanner(text) {
      const b = document.getElementById("hm-op-banner");
      const t = document.getElementById("hm-op-banner-text");
      const l = document.getElementById("hm-top-loader");
      if (b && t) {
        t.textContent = text;
        b.style.display = "flex";
      }
      if (l) l.style.display = "block";
    }

    function hideBanner() {
      const b = document.getElementById("hm-op-banner");
      const l = document.getElementById("hm-top-loader");
      if (b) b.style.display = "none";
      if (l) l.style.display = "none";
    }

    function switchTab(tab) {
      document.getElementById("view-review").style.display = tab === "review" ? "flex" : "none";
      document.getElementById("view-history").style.display = tab === "history" ? "flex" : "none";
      document.getElementById("view-settings").style.display = tab === "settings" ? "flex" : "none";
      document.getElementById("tab-btn-review").classList.toggle("active", tab === "review");
      document.getElementById("tab-btn-history").classList.toggle("active", tab === "history");
      document.getElementById("tab-btn-settings").classList.toggle("active", tab === "settings");
    }

    let activeThemeIndex = 0;
    function cycleTheme() {
      activeThemeIndex = (activeThemeIndex + 1) % THEMES.length;
      const theme = THEMES[activeThemeIndex];
      document.documentElement.setAttribute("data-theme", theme.id);
      const icon = document.getElementById("theme-icon");
      const name = document.getElementById("theme-name");
      if (icon) icon.textContent = theme.icon;
      if (name) name.textContent = theme.name;
      callHost("setTheme", theme.id);
    }

    function toggleKeyVisibility() {
      const inp = document.getElementById("input-api-key");
      if (inp) {
        inp.type = inp.type === "password" ? "text" : "password";
      }
    }

    async function sendAction(action, ...args) {
      const res = await callHost(action, ...args);
      if (res) {
        if (res.session) {
          currentSession = res.session;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.session));
          } catch (e) {}
        }
        if (res.canvasHtml) {
          const mount = document.getElementById("main-canvas-mount");
          if (mount) {
            mount.innerHTML = res.canvasHtml;
            initScrollSync();
          }
        }
        if (res.stats) {
          const pl = document.getElementById("progress-label");
          const pp = document.getElementById("progress-pct");
          const pb = document.getElementById("progress-bar-fill");
          if (pl) pl.textContent = "Progress (" + res.stats.reviewed + "/" + res.stats.totalInspectable + ")";
          if (pp) pp.textContent = res.stats.progressPercent + "%";
          if (pb) pb.style.width = res.stats.progressPercent + "%";
        }
        if (res.jumpOptionsHtml) {
          const js = document.getElementById("jump-selector");
          if (js) js.innerHTML = res.jumpOptionsHtml;
        }
        if (res.noteTitle) {
          const nb = document.getElementById("note-title-badge");
          if (nb) nb.textContent = "📄 " + res.noteTitle;
        }
        if (res.granularity) {
          const btns = ["full", "paragraph", "sentence"];
          btns.forEach(b => {
            const el = document.getElementById("seg-btn-" + b);
            if (el) el.classList.toggle("active", b === res.granularity);
          });
        }
      }
      return res;
    }

    async function changeActiveNote() {
      showBanner("Selecting note...");
      await sendAction("selectNote");
      hideBanner();
    }

    function onPresetChange(presetId) {
      if (presetId === "__custom__") {
        openCustomPromptModal();
        return;
      }
      if (currentSession) {
        currentSession.presetId = presetId;
        currentSession.customPrompt = "";
      }
      sendAction("setPreset", presetId);
    }

    async function setGranularity(granularity) {
      if (currentSession?.granularity === granularity) return;
      const hasDecidedWork = currentSession && currentSession.items && currentSession.items.some(i => i.status === "accepted" || i.status === "edited" || i.status === "rejected");
      if (hasDecidedWork) {
        const stats = currentSession.items.reduce((acc, it) => {
          if (it.status === "accepted") acc.accepted++;
          if (it.status === "rejected") acc.rejected++;
          if (it.status === "edited") acc.edited++;
          return acc;
        }, { accepted: 0, rejected: 0, edited: 0 });

        showAppConfirm({
          title: "Change Review Granularity?",
          message: "Changing granularity will rebuild review chunks and reset progress.<br><br>Current progress:<br>• " + stats.accepted + " accepted<br>• " + stats.rejected + " rejected<br>• " + stats.edited + " edited<br><br>Proceed and re-chunk note?",
          confirmLabel: "Start New Review",
          isDanger: true,
          onConfirm: async () => {
            showBanner("Re-tokenizing document...");
            await sendAction("setGranularity", granularity);
            hideBanner();
          }
        });
        return;
      }

      showBanner("Re-tokenizing document...");
      await sendAction("setGranularity", granularity);
      hideBanner();
    }

    async function reviewCurrentChunk() {
      showBanner("Hemmingway is polishing current chunk...");
      await sendAction("reviewCurrent");
      hideBanner();
    }

    async function reviewAllPending() {
      showBanner("Hemmingway is transforming all pending chunks...");
      await sendAction("reviewAll");
      hideBanner();
    }

    function cancelActiveOperation() {
      callHost("cancelReviewAll");
      hideBanner();
    }

    async function acceptCurrent() {
      await sendAction("acceptCurrent");
    }

    async function rejectCurrent() {
      await sendAction("rejectCurrent");
    }

    async function undoAction() {
      await sendAction("undo");
    }

    async function navigateNext() {
      await sendAction("navigateNext");
    }

    async function navigatePrev() {
      await sendAction("navigatePrev");
    }

    async function jumpToItem(id) {
      await sendAction("jumpTo", id);
    }

    async function setViewMode(mode) {
      await sendAction("setViewMode", mode);
    }

    async function applyToNote() {
      showBanner("Applying changes to note in Amplenote...");
      const res = await sendAction("saveAndCommit", isAuditNotesEnabled());
      hideBanner();

      if (res?.saveResult?.success) {
        showAppConfirm({
          title: "Changes Saved Successfully!",
          message: "All accepted and modified changes have been committed to <strong>" + escapeHtml(currentSession?.noteTitle || "your note") + "</strong>.<br><br>Would you like to open and view the note in Amplenote now?",
          confirmLabel: "Open Note in Amplenote ↗",
          onConfirm: () => {
            handleOpenNote();
          }
        });
      } else if (res?.saveResult?.cancelled) {
        showAppConfirm({
          title: "Save Cancelled",
          message: "The note was modified externally. Save was cancelled to prevent accidental overwrites.",
          confirmLabel: "OK"
        });
      }
    }

    async function saveSettings() {
      const apiKey = document.getElementById("input-api-key").value;
      const baseUrl = document.getElementById("input-base-url").value;
      const thinkingEffort = document.getElementById("input-thinking-effort").value;
      await callHost("saveSettings", { apiKey, baseUrl, thinkingEffort });
      const badge = document.getElementById("api-status-badge");
      if (badge) {
        const has = Boolean(apiKey && apiKey.trim());
        badge.style.color = has ? "var(--hm-success)" : "var(--hm-danger)";
        badge.textContent = has ? "🟢 Connected" : "🔴 Missing Key";
      }
    }

    async function testConnection() {
      const apiKey = document.getElementById("input-api-key").value;
      const baseUrl = document.getElementById("input-base-url").value;
      const resDiv = document.getElementById("test-api-result");
      resDiv.style.display = "block";
      resDiv.style.color = "var(--hm-text-muted)";
      resDiv.textContent = "Testing connection to Hemmingway API...";

      const res = await callHost("testConnection", { apiKey, baseUrl });
      if (res?.ok) {
        resDiv.style.color = "var(--hm-success)";
        resDiv.textContent = "✓ Connected successfully! Latency: " + (res.latencyMs || 0) + "ms. Model: " + (res.model || "hemmingway-27b");
      } else {
        resDiv.style.color = "var(--hm-danger)";
        resDiv.textContent = "✕ Error: " + (res?.error || "Connection failed.");
      }
    }

    async function resetUsageStats(all) {
      showAppConfirm({
        title: all ? "Reset Lifetime Usage Stats?" : "Reset Today's Usage Stats?",
        message: "Are you sure you want to reset token usage statistics?",
        confirmLabel: "Reset",
        isDanger: true,
        onConfirm: async () => {
          await callHost("resetUsage", { all });
          location.reload();
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }
      const key = e.key.toUpperCase();
      if (key === "T") {
        cycleTheme();
      } else if (key === "A") {
        e.preventDefault();
        acceptCurrent();
      } else if (key === "R") {
        e.preventDefault();
        rejectCurrent();
      } else if (key === "U" || (e.ctrlKey && key === "Z")) {
        e.preventDefault();
        undoAction();
      } else if (key === "N" || e.key === "ArrowRight") {
        e.preventDefault();
        navigateNext();
      } else if (key === "P" || e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        reviewCurrentChunk();
      }
    });

    initScrollSync();
  </script>
</body>
</html>`;
}
