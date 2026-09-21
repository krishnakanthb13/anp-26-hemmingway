/**
 * @file dashboardTemplate.js
 * @description Generates the complete HTML string for the Hemmingway Studio full-screen embed.
 * Provides zero-flicker client-side reactivity and instant DOM updates.
 */

import { EMBED_STYLES } from "./styles.css.js";
import { renderActiveDiff } from "./diffViews.js";
import { renderThinkingCard } from "./thinkingCard.js";
import { escapeHtml } from "../engine/diffEngine.js";
import {
  EDITORIAL_PRESETS,
  THEMES,
  GRANULARITY_MODES,
  SETTING_API_KEY,
  SETTING_BASE_URL,
  DEFAULT_BASE_URL
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
    const icon = it.status === "accepted" ? "✓" : it.status === "rejected" ? "✕" : it.status === "ready" ? "●" : "○";
    const snippet = (it.original || "").trim().substring(0, 32);
    return `<option value="${it.id}" ${isCur ? "selected" : ""}>${icon} #${idx + 1}: ${escapeHtml(snippet)}...</option>`;
  }).join("");
}

/**
 * Renders the complete Main Canvas HTML (toolbar, diff viewer, thinking drawer, and bottom actions).
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

  const isReady = currentItem?.status === "ready" || currentItem?.status === "edited";

  return `
    <!-- View Modes Toolbar -->
    <div class="hm-canvas-toolbar">
      <div class="hm-view-modes">
        <button class="hm-view-mode-btn ${mode === "clean" ? "active" : ""}" onclick="setViewMode('clean')">✨ Clean Prose</button>
        <button class="hm-view-mode-btn ${mode === "inline" ? "active" : ""}" onclick="setViewMode('inline')">🔀 Inline Diff</button>
        <button class="hm-view-mode-btn ${mode === "side" ? "active" : ""}" onclick="setViewMode('side')">👥 Side-by-Side</button>
        <button class="hm-view-mode-btn ${mode === "changes" ? "active" : ""}" onclick="setViewMode('changes')">📋 Changes Only</button>
      </div>
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
        <button id="btn-accept" class="hm-btn hm-btn-success" onclick="acceptCurrent()" ${isReady ? "" : "disabled style='opacity: 0.5; cursor: not-allowed;'"}>✓ Accept (A)</button>
        <button id="btn-reject" class="hm-btn hm-btn-secondary" onclick="rejectCurrent()">✕ Reject (R)</button>
        <button id="btn-undo" class="hm-btn hm-btn-secondary" onclick="undoAction()">↩ Undo (U)</button>
      </div>
      <div class="hm-action-group">
        <button class="hm-btn hm-btn-secondary" onclick="navigatePrev()">⏮ Prev (P)</button>
        <button class="hm-btn hm-btn-secondary" onclick="navigateNext()">Next (N) ⏭</button>
        <button id="btn-apply-note" class="hm-btn hm-btn-primary" onclick="applyToNote()">💾 Save to Note</button>
      </div>
    </footer>
  `;
}

/**
 * Builds the full interactive dashboard HTML.
 * @param {Object} params
 * @param {import("../engine/reviewSession.js").ReviewSession|null} params.session
 * @param {Object} params.settings
 * @param {Object} params.usageStats
 * @param {string} [params.activeTab="review"]
 * @param {string} [params.activeTheme="espresso"]
 * @returns {string} HTML string
 */
export function buildDashboardTemplate({
  session,
  settings = {},
  usageStats = {},
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
    progressPercent: 0
  };

  const hasApiKey = Boolean(settings[SETTING_API_KEY] && settings[SETTING_API_KEY].trim());
  const serializedSession = safeJsonEmbed(session ? session.toJSON() : null);
  const serializedStats = safeJsonEmbed(usageStats);

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
      <span id="note-title-badge" class="hm-note-badge" title="${escapeHtml(session?.noteTitle || "No note selected")}">
        ${session?.noteTitle ? `📄 ${escapeHtml(session.noteTitle)}` : "📄 No note selected"}
      </span>
      <button class="hm-btn hm-btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="changeActiveNote()" title="Open note search picker">
        📂 Switch Note
      </button>
    </div>
    <div class="hm-header-right">
      <div class="hm-nav-tabs">
        <button id="tab-btn-review" class="hm-nav-tab ${activeTab === "review" ? "active" : ""}" onclick="switchTab('review')">Review</button>
        <button id="tab-btn-settings" class="hm-nav-tab ${activeTab === "settings" ? "active" : ""}" onclick="switchTab('settings')">Settings</button>
      </div>
      <select id="theme-selector" class="hm-theme-select" onchange="changeTheme(this.value)">
        ${THEMES.map(t => `<option value="${t.id}" ${t.id === activeTheme ? "selected" : ""}>${t.icon} ${t.name}</option>`).join("")}
      </select>
    </div>
  </header>

  <!-- Main View Area -->
  <div id="view-review" class="hm-workbench" style="${activeTab === "review" ? "" : "display: none;"}">
    
    <!-- Left Sidebar Inspector -->
    <aside class="hm-sidebar">
      
      <!-- Preset Selection -->
      <div class="hm-control-group">
        <label class="hm-section-title">Editorial Preset</label>
        <select id="preset-selector" class="hm-select" onchange="onPresetChange(this.value)">
          ${EDITORIAL_PRESETS.map(p => `
            <option value="${p.id}" ${session && session.presetId === p.id ? "selected" : ""}>
              ${p.name}
            </option>
          `).join("")}
        </select>
        <div id="preset-desc-box" class="hm-preset-desc">
          ${EDITORIAL_PRESETS.find(p => p.id === (session?.presetId || "human_polish"))?.description || ""}
        </div>
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
        <div><kbd>Enter</kbd> Polish Chunk</div>
      </div>

    </aside>

    <!-- Main Canvas Mount -->
    <main id="main-canvas-mount" class="hm-canvas">
      ${renderCanvasHtml(session)}
    </main>

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
          Enter your Hemmingway API key (starts with <code>hemmingway_live_</code>) to connect to <code>hemmingway-27b</code>. 
          Manage your keys at <a href="https://hemmingway.io/platform/#keys" target="_blank" style="color: var(--hm-accent);">hemmingway.io/platform/#keys</a>.
        </p>
        <div class="hm-control-group">
          <label class="hm-section-title">Hemmingway API Key</label>
          <input type="password" id="input-api-key" class="hm-input" placeholder="hemmingway_live_..." value="${escapeHtml(settings[SETTING_API_KEY] || "")}">
        </div>
        <div class="hm-control-group">
          <label class="hm-section-title">Custom Base URL (Optional)</label>
          <input type="text" id="input-base-url" class="hm-input" placeholder="https://hemmingway.io/v1" value="${escapeHtml(settings[SETTING_BASE_URL] || DEFAULT_BASE_URL)}">
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
              <th>Est. Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Today</strong></td>
              <td>${usageStats.todayRequests || 0}</td>
              <td>${usageStats.todayPromptTokens || 0}</td>
              <td>${usageStats.todayCompletionTokens || 0}</td>
              <td>$${(usageStats.todayCostUSD || 0).toFixed(4)}</td>
            </tr>
            <tr>
              <td><strong>Lifetime</strong></td>
              <td>${usageStats.lifetimeRequests || 0}</td>
              <td>${usageStats.lifetimePromptTokens || 0}</td>
              <td>${usageStats.lifetimeCompletionTokens || 0}</td>
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

    function callHost(action, payload = null) {
      if (typeof window.callAmplenotePlugin === "function") {
        return window.callAmplenotePlugin(action, payload);
      }
      console.warn("callAmplenotePlugin not available in this environment.");
      return Promise.resolve(null);
    }

    function showBanner(text) {
      const b = document.getElementById("hm-op-banner");
      const t = document.getElementById("hm-op-banner-text");
      if (b && t) {
        t.textContent = text;
        b.style.display = "flex";
      }
    }

    function hideBanner() {
      const b = document.getElementById("hm-op-banner");
      if (b) b.style.display = "none";
    }

    function switchTab(tab) {
      document.getElementById("view-review").style.display = tab === "review" ? "flex" : "none";
      document.getElementById("view-settings").style.display = tab === "settings" ? "flex" : "none";
      document.getElementById("tab-btn-review").classList.toggle("active", tab === "review");
      document.getElementById("tab-btn-settings").classList.toggle("active", tab === "settings");
    }

    function changeTheme(themeId) {
      document.documentElement.setAttribute("data-theme", themeId);
      callHost("setTheme", themeId);
    }

    async function sendAction(action, payload = null) {
      const res = await callHost(action, payload);
      if (res) {
        if (res.session) {
          currentSession = res.session;
        }
        if (res.canvasHtml) {
          const mount = document.getElementById("main-canvas-mount");
          if (mount) mount.innerHTML = res.canvasHtml;
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
      if (currentSession) {
        currentSession.presetId = presetId;
      }
      sendAction("setPreset", presetId);
    }

    async function setGranularity(granularity) {
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
      showBanner("Applying changes to note...");
      await sendAction("applyToNote");
      hideBanner();
    }

    async function saveSettings() {
      const apiKey = document.getElementById("input-api-key").value;
      const baseUrl = document.getElementById("input-base-url").value;
      await callHost("saveSettings", { apiKey, baseUrl });
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
      if (confirm(all ? "Reset all usage metrics?" : "Reset today's usage metrics?")) {
        await callHost("resetUsage", { all });
        location.reload();
      }
    }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }
      const key = e.key.toUpperCase();
      if (key === "A") {
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
  </script>
</body>
</html>`;
}
