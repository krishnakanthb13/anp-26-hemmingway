/**
 * @file usageTracker.js
 * @description Tracks Hemmingway API token usage, daily counts, and estimated costs in Amplenote settings.
 */

import { SETTING_USAGE_STATS } from "../constants.js";

// Hemmingway-1 Pricing (per 1,000,000 tokens)
const COST_INPUT_PER_M = 0.24;
const COST_CACHED_INPUT_PER_M = 0.024;
const COST_OUTPUT_PER_M = 0.90;

/**
 * @typedef {Object} UsageStats
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {number} todayRequests
 * @property {number} todayPromptTokens
 * @property {number} todayCompletionTokens
 * @property {number} todayCachedTokens
 * @property {number} todayCostUSD
 * @property {number} lifetimeRequests
 * @property {number} lifetimePromptTokens
 * @property {number} lifetimeCompletionTokens
 * @property {number} lifetimeCachedTokens
 * @property {number} lifetimeCostUSD
 */

/**
 * Returns default empty usage statistics.
 * @returns {UsageStats}
 */
function createDefaultStats() {
  const today = new Date().toISOString().split("T")[0];
  return {
    date: today,
    todayRequests: 0,
    todayPromptTokens: 0,
    todayCompletionTokens: 0,
    todayCachedTokens: 0,
    todayCostUSD: 0,
    lifetimeRequests: 0,
    lifetimePromptTokens: 0,
    lifetimeCompletionTokens: 0,
    lifetimeCachedTokens: 0,
    lifetimeCostUSD: 0
  };
}

/**
 * Retrieves the parsed usage stats from Amplenote plugin settings.
 * @param {Object} app
 * @returns {UsageStats}
 */
export function getUsageStats(app) {
  const raw = app?.settings?.[SETTING_USAGE_STATS];
  if (!raw || typeof raw !== "string") {
    return createDefaultStats();
  }

  try {
    const stats = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];

    // Check if daily rollover is needed
    if (stats.date !== today) {
      stats.date = today;
      stats.todayRequests = 0;
      stats.todayPromptTokens = 0;
      stats.todayCompletionTokens = 0;
      stats.todayCachedTokens = 0;
      stats.todayCostUSD = 0;
    }
    return stats;
  } catch {
    return createDefaultStats();
  }
}

/**
 * Records a successful or failed request usage into settings.
 * @param {Object} app
 * @param {Object} [usage]
 * @param {number} [usage.prompt_tokens]
 * @param {number} [usage.completion_tokens]
 * @param {Object} [usage.prompt_tokens_details]
 * @param {boolean} [success=true]
 */
export async function recordUsage(app, usage = {}, success = true) {
  if (!app || typeof app.setSetting !== "function") return;

  const stats = getUsageStats(app);
  const promptTokens = Number(usage.prompt_tokens) || 0;
  const completionTokens = Number(usage.completion_tokens) || 0;
  const cachedTokens = Number(usage.prompt_tokens_details?.cached_tokens) || 0;
  const uncachedPromptTokens = Math.max(0, promptTokens - cachedTokens);

  // Compute cost: (tokens / 1,000,000) * price
  const cost = (uncachedPromptTokens / 1e6) * COST_INPUT_PER_M +
               (cachedTokens / 1e6) * COST_CACHED_INPUT_PER_M +
               (completionTokens / 1e6) * COST_OUTPUT_PER_M;

  stats.todayRequests += 1;
  stats.todayPromptTokens += promptTokens;
  stats.todayCompletionTokens += completionTokens;
  stats.todayCachedTokens += cachedTokens;
  stats.todayCostUSD = Number((stats.todayCostUSD + cost).toFixed(6));

  stats.lifetimeRequests += 1;
  stats.lifetimePromptTokens += promptTokens;
  stats.lifetimeCompletionTokens += completionTokens;
  stats.lifetimeCachedTokens += cachedTokens;
  stats.lifetimeCostUSD = Number((stats.lifetimeCostUSD + cost).toFixed(6));

  try {
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(stats));
  } catch (err) {
    console.warn("[Hemmingway] Failed to persist usage stats:", err);
  }
}

/**
 * Resets either today's or all usage statistics.
 * @param {Object} app
 * @param {boolean} [all=false]
 */
export async function resetUsage(app, all = false) {
  if (!app || typeof app.setSetting !== "function") return;
  const stats = getUsageStats(app);

  if (all) {
    const fresh = createDefaultStats();
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(fresh));
  } else {
    stats.todayRequests = 0;
    stats.todayPromptTokens = 0;
    stats.todayCompletionTokens = 0;
    stats.todayCachedTokens = 0;
    stats.todayCostUSD = 0;
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(stats));
  }
}
