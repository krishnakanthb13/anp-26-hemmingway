/**
 * @file diffViews.js
 * @description Renders the active review item inside the main canvas based on the chosen view mode.
 */

import {
  renderCleanProse,
  renderInlineDiff,
  renderSideBySide,
  renderChangesOnly,
  escapeHtml
} from "../engine/diffEngine.js";

/**
 * Renders the diff container for the active item.
 * @param {Object} item
 * @param {string} mode - "clean" | "inline" | "side" | "changes"
 * @returns {string} HTML string
 */
export function renderActiveDiff(item, mode = "clean") {
  if (!item) {
    return `<div class="hm-diff-empty">No items available in this review session.</div>`;
  }

  // If item hasn't been reviewed yet (status: pending)
  if (item.status === "pending" || !item.suggestion) {
    return `
      <div class="hm-diff-pending-state">
        <div class="hm-pending-header">Original Text (Awaiting Hemmingway Polish)</div>
        <div class="hm-pending-body">${escapeHtml(item.original).replace(/\n/g, "<br>")}</div>
        <div class="hm-pending-hint">Click <strong>Polish Current Chunk</strong> or press <strong>Enter</strong> to review.</div>
      </div>
    `;
  }

  // If item had no changes
  if (item.status === "no_change") {
    return `
      <div class="hm-diff-nochange-state">
        <div class="hm-nochange-badge">✓ Clean & Clear — No Changes Needed</div>
        <div class="hm-nochange-body">${escapeHtml(item.original).replace(/\n/g, "<br>")}</div>
      </div>
    `;
  }

  const suggestionText = item.editedContent || item.suggestion;

  switch (mode) {
    case "clean":
      return renderCleanProse(item.original, suggestionText);
    case "inline":
      return renderInlineDiff(item.original, suggestionText);
    case "side":
      return renderSideBySide(item.original, suggestionText);
    case "changes":
      return renderChangesOnly(item.original, suggestionText);
    default:
      return renderCleanProse(item.original, suggestionText);
  }
}
