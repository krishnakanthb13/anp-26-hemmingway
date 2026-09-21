/**
 * @file client.js
 * @description HTTP client for Hemmingway-1 API (https://hemmingway.io/v1)
 * Supports OpenAI-compatible Chat Completions, reasoning_content, thinking options,
 * and structured error responses.
 */

import { DEFAULT_BASE_URL, DEFAULT_MODEL, THINKING_EFFORT_MODES } from "../constants.js";

export class HemmingwayClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Hemmingway API Key (hemmingway_live_...)
   * @param {string} [options.baseUrl] - Base API URL (default: https://hemmingway.io/v1)
   * @param {string} [options.model] - Model name (default: hemmingway-27b)
   */
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL } = {}) {
    this.apiKey = apiKey ? apiKey.trim() : "";
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.model = model || DEFAULT_MODEL;
  }

  /**
   * Sends a completion request to Hemmingway API.
   * @param {Object} params
   * @param {string} params.prompt - User input text to review/rewrite
   * @param {string} [params.systemPrompt] - System editorial instructions
   * @param {string} [params.thinkingEffort] - "xhigh", "medium", "low", or "off"
   * @param {number} [params.temperature] - Sampling temperature (0.0 to 1.0)
   * @param {number} [params.maxTokens] - Max completion tokens (default: 4096)
   * @returns {Promise<{ content: string, reasoningContent: string, usage: Object, model: string }>}
   */
  async complete({
    prompt,
    systemPrompt = "You are Hemmingway, an expert editor. Rewrite the text to sound natural, human, and clear.",
    thinkingEffort = THINKING_EFFORT_MODES.MEDIUM,
    temperature = 0.3,
    maxTokens = 4096
  }) {
    if (!this.apiKey) {
      throw new Error("No Hemmingway API Key configured. Please enter your API key in Plugin Settings.");
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }
    messages.push({ role: "user", content: prompt });

    const payload = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    // Configure thinking / reasoning
    if (thinkingEffort === THINKING_EFFORT_MODES.OFF) {
      payload.enable_thinking = false;
    } else {
      payload.enable_thinking = true;
      payload.reasoning_effort = thinkingEffort; // "low", "medium", or "xhigh"
    }

    const endpoint = `${this.baseUrl}/chat/completions`;
    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      throw new Error(`Network error connecting to Hemmingway API (${endpoint}): ${networkErr.message}`);
    }

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorCode = data?.error?.code || `HTTP_${response.status}`;
      const errorMessage = data?.error?.message || rawText || response.statusText;

      if (response.status === 401 || errorCode === "bad_key") {
        throw new Error(`Invalid Hemmingway API key (bad_key). Please verify your key at https://hemmingway.io/platform/#keys.`);
      }
      if (response.status === 402 || errorCode === "out_of_credit" || errorCode === "no_plan") {
        throw new Error(`Hemmingway account has no remaining credit or active plan (${errorCode}). Add credit at https://hemmingway.io/platform/#billing.`);
      }
      if (response.status === 429 || errorCode === "allowance") {
        const resetTime = data?.error?.resets_at ? ` Resets at ${data.error.resets_at}` : "";
        throw new Error(`Hemmingway rate limit/plan allowance reached.${resetTime}`);
      }
      if (response.status === 503 || errorCode === "busy" || errorCode === "model_unreachable") {
        throw new Error(`Hemmingway servers are currently busy or unreachable. Please try again shortly.`);
      }

      throw new Error(`Hemmingway API Error [${errorCode}]: ${errorMessage}`);
    }

    if (!data?.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error("Hemmingway API returned an empty choices list.");
    }

    const choice = data.choices[0];
    const content = choice.message?.content || "";
    // Hemmingway returns thinking inside reasoning_content
    const reasoningContent = choice.message?.reasoning_content || "";
    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    return {
      content,
      reasoningContent,
      usage,
      model: data.model || this.model
    };
  }
}
