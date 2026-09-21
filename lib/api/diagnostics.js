/**
 * @file diagnostics.js
 * @description API health and connection diagnostics for Hemmingway API.
 */

import { HemmingwayClient } from "./client.js";
import { DEFAULT_BASE_URL, DEFAULT_MODEL, THINKING_EFFORT_MODES } from "../constants.js";

/**
 * Tests connection to Hemmingway API by sending a minimal prompt.
 * @param {Object} options
 * @param {string} options.apiKey
 * @param {string} [options.baseUrl]
 * @param {string} [options.model]
 * @returns {Promise<{ ok: boolean, latencyMs?: number, model?: string, error?: string }>}
 */
export async function testHemmingwayConnection({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  model = DEFAULT_MODEL
}) {
  if (!apiKey || !apiKey.trim()) {
    return {
      ok: false,
      error: "No API key provided. Please enter a valid Hemmingway API key."
    };
  }

  const client = new HemmingwayClient({ apiKey, baseUrl, model });
  const t0 = Date.now();

  try {
    const res = await client.complete({
      prompt: "Respond with only the single word: OK",
      systemPrompt: "You are a health check diagnostic. Answer only with OK.",
      thinkingEffort: THINKING_EFFORT_MODES.OFF,
      maxTokens: 10
    });

    const latencyMs = Date.now() - t0;
    return {
      ok: true,
      latencyMs,
      model: res.model,
      sample: res.content.trim()
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err.message || String(err)
    };
  }
}
