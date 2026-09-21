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
    const models = await client.listModels();
    const latencyMs = Date.now() - t0;
    const modelObj = models.find(m => m.id === model) || models[0];
    return {
      ok: true,
      latencyMs,
      model: modelObj ? modelObj.id : model,
      sample: "Authentication verified (0 tokens used)"
    };
  } catch (modelsErr) {
    // If GET /models fails, fallback to chat completion health check
    try {
      const res = await client.complete({
        prompt: "Respond with: OK",
        systemPrompt: "Diagnostic check.",
        thinkingEffort: THINKING_EFFORT_MODES.OFF,
        maxTokens: 5
      });

      return {
        ok: true,
        latencyMs: Date.now() - t0,
        model: res.model,
        sample: res.content.trim()
      };
    } catch (completeErr) {
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        error: completeErr.message || modelsErr.message || String(completeErr)
      };
    }
  }
}
