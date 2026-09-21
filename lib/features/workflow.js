/**
 * @file workflow.js
 * @description Coordinates AI review requests (single chunk & batch Review All) with Hemmingway-1 API.
 */

import { HemmingwayClient } from "../api/client.js";
import { getActiveSession, setActiveSession } from "../data/store.js";
import { recordUsage } from "../data/usageTracker.js";
import { ReviewSession } from "../engine/reviewSession.js";
import {
  SETTING_API_KEY,
  SETTING_THINKING_EFFORT,
  SETTING_BASE_URL,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  EDITORIAL_PRESETS,
  DEFAULT_THINKING_EFFORT
} from "../constants.js";

let isReviewAllActive = false;
let isReviewAllCancelled = false;

/**
 * Gets the active system prompt for a preset ID or custom prompt.
 * @param {string} presetId
 * @param {string} [customPrompt]
 * @returns {string}
 */
export function getEffectiveSystemPrompt(presetId, customPrompt = "") {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt.trim();
  }
  const preset = EDITORIAL_PRESETS.find(p => p.id === presetId);
  return preset ? preset.systemPrompt : EDITORIAL_PRESETS[0].systemPrompt;
}

/**
 * Runs review for a specific chunk or the currently active chunk.
 * @param {Object} app
 * @param {number|Object} [targetItemId=null] - Specific item ID or options object
 * @param {string} [instruction=""] - Additional instruction for re-review
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function handleRunReview(app, targetItemId = null, instruction = "") {
  const session = getActiveSession();
  if (!session) return { ok: false, error: "No active review session found." };

  let itemId = null;
  let customInstr = "";
  let thinkingEffort = null;

  if (typeof targetItemId === "object" && targetItemId !== null) {
    itemId = targetItemId.itemId ?? null;
    customInstr = targetItemId.customPrompt || targetItemId.instruction || "";
    thinkingEffort = targetItemId.thinkingEffort || null;
  } else {
    itemId = targetItemId;
    customInstr = instruction || "";
  }

  let item = null;
  if (typeof itemId === "number" && itemId >= 0) {
    item = session.items.find(it => it.id === itemId);
    if (item) {
      session.jumpTo(itemId);
    }
  }

  if (!item) {
    item = session.getCurrentItem();
  }

  if (!item || !item.isInspectable) {
    return { ok: false, error: "Active item is not inspectable." };
  }

  const apiKey = app.settings?.[SETTING_API_KEY];
  const baseUrl = app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
  const effort = thinkingEffort || app.settings?.[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT;

  if (!apiKey || !apiKey.trim()) {
    return { ok: false, error: "Please enter your Hemmingway API key in Plugin Settings." };
  }

  const client = new HemmingwayClient({ apiKey, baseUrl, model: DEFAULT_MODEL });
  let systemPrompt = getEffectiveSystemPrompt(session.presetId, session.customPrompt);
  if (customInstr && customInstr.trim()) {
    systemPrompt += `\n\nSpecific Editorial Instruction for this section:\n${customInstr.trim()}`;
  }

  try {
    const res = await client.complete({
      prompt: item.original,
      systemPrompt,
      thinkingEffort: effort
    });

    session.setItemSuggestion(item.id, res.content, res.reasoningContent);
    await recordUsage(app, res.usage, true);
    return { ok: true };
  } catch (err) {
    await recordUsage(app, {}, false);
    return { ok: false, error: err.message || String(err) };
  }
}

/**
 * Runs batch transformation across all pending items.
 * @param {Object} app
 * @param {Function} [onProgress] - Callback for each completed item: (completed, total) => void
 * @returns {Promise<{ ok: boolean, completedCount: number, error?: string }>}
 */
export async function handleReviewAll(app, onProgress = null) {
  const session = getActiveSession();
  if (!session) return { ok: false, completedCount: 0, error: "No active review session." };

  if (isReviewAllActive) {
    return { ok: false, completedCount: 0, error: "Batch review is already in progress." };
  }

  const apiKey = app.settings?.[SETTING_API_KEY];
  const baseUrl = app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
  const effort = app.settings?.[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT;

  if (!apiKey || !apiKey.trim()) {
    return { ok: false, completedCount: 0, error: "Missing Hemmingway API Key." };
  }

  const client = new HemmingwayClient({ apiKey, baseUrl, model: DEFAULT_MODEL });
  const systemPrompt = getEffectiveSystemPrompt(session.presetId);

  const pendingItems = session.items.filter(it => it.isInspectable && it.status === "pending");
  if (pendingItems.length === 0) {
    return { ok: true, completedCount: 0, error: "No pending items to review." };
  }

  isReviewAllActive = true;
  isReviewAllCancelled = false;
  let count = 0;

  try {
    for (let i = 0; i < pendingItems.length; i++) {
      if (isReviewAllCancelled) {
        break;
      }

      const item = pendingItems[i];
      try {
        const res = await client.complete({
          prompt: item.original,
          systemPrompt,
          thinkingEffort: effort
        });

        session.setItemSuggestion(item.id, res.content, res.reasoningContent);
        await recordUsage(app, res.usage, true);
        count++;

        if (typeof onProgress === "function") {
          onProgress(count, pendingItems.length);
        }
      } catch (itemErr) {
        console.warn(`[Hemmingway] Review chunk #${item.id} failed:`, itemErr);
        // Continue processing remaining chunks rather than failing entire batch
      }
    }

    return { ok: true, completedCount: count };
  } finally {
    isReviewAllActive = false;
    isReviewAllCancelled = false;
  }
}

/**
 * Signals active batch review to cancel early.
 */
export function cancelReviewAll() {
  if (isReviewAllActive) {
    isReviewAllCancelled = true;
  }
}

/**
 * Changes granularity and re-tokenizes the active session without losing note context.
 * @param {Object} app
 * @param {string} newGranularity - "full" | "paragraph" | "sentence"
 */
export function handleSetGranularity(app, newGranularity) {
  const session = getActiveSession();
  if (!session) return;

  const fresh = new ReviewSession({
    noteUUID: session.noteUUID,
    noteTitle: session.noteTitle,
    noteContent: session.initialContent,
    noteTags: session.noteTags,
    updatedAt: session.updatedAt,
    granularity: newGranularity,
    presetId: session.presetId
  });

  fresh.diffViewMode = session.diffViewMode;
  setActiveSession(fresh);
}
