/**
 * @file thinkingCard.js
 * @description Component that renders Hemmingway-1's editorial reasoning_content.
 */

import { escapeHtml } from "../engine/diffEngine.js";

/**
 * Renders the Editor's Thinking card for the active item.
 * @param {string} [reasoning] - The reasoning_content string returned by Hemmingway
 * @returns {string} HTML string
 */
export function renderThinkingCard(reasoning) {
  if (!reasoning || !reasoning.trim()) {
    return "";
  }

  const safeReasoning = escapeHtml(reasoning.trim()).replace(/\n/g, "<br>");

  return `
    <div class="hm-thinking-card">
      <details class="hm-thinking-details" open>
        <summary class="hm-thinking-summary">
          <span class="hm-thinking-icon">🧠</span>
          <span class="hm-thinking-title">Editor's Thinking & Rationale</span>
          <span class="hm-thinking-badge">Hemmingway-1</span>
        </summary>
        <div class="hm-thinking-body">
          ${safeReasoning}
        </div>
      </details>
    </div>
  `;
}
