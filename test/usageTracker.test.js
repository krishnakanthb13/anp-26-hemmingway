/**
 * @file usageTracker.test.js
 * @description Unit, edge case, and regression tests for Hemmingway usage and token cost tracking.
 */

import { jest } from "@jest/globals";
import { getUsageStats, recordUsage, resetUsage } from "../lib/data/usageTracker.js";
import { SETTING_USAGE_STATS } from "../lib/constants.js";

describe("Usage Tracker — Happy Path", () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      settings: {},
      setSetting: jest.fn(async (key, val) => {
        mockApp.settings[key] = val;
      })
    };
  });

  test("returns default stats when no settings exist", () => {
    const stats = getUsageStats(mockApp);
    expect(stats.todayRequests).toBe(0);
    expect(stats.lifetimeRequests).toBe(0);
    expect(stats.todayCostUSD).toBe(0);
    expect(typeof stats.date).toBe("string");
  });

  test("records usage and calculates costs accurately with cached inputs", async () => {
    // 10,000 prompt tokens (2,000 cached) and 1,000 completion tokens
    const usage = {
      prompt_tokens: 10000,
      completion_tokens: 1000,
      prompt_tokens_details: {
        cached_tokens: 2000
      }
    };

    await recordUsage(mockApp, usage, true);

    expect(mockApp.setSetting).toHaveBeenCalledWith(
      SETTING_USAGE_STATS,
      expect.any(String)
    );

    const savedStats = JSON.parse(mockApp.settings[SETTING_USAGE_STATS]);
    expect(savedStats.todayRequests).toBe(1);
    expect(savedStats.lifetimeRequests).toBe(1);
    expect(savedStats.todayPromptTokens).toBe(10000);
    expect(savedStats.todayCompletionTokens).toBe(1000);
    expect(savedStats.todayCachedTokens).toBe(2000);

    // Uncached prompt: 8,000 * $0.24 / 1M = $0.00192
    // Cached prompt: 2,000 * $0.024 / 1M = $0.000048
    // Completion: 1,000 * $0.90 / 1M = $0.0009
    // Expected total: 0.00192 + 0.000048 + 0.0009 = 0.002868
    expect(savedStats.todayCostUSD).toBeCloseTo(0.002868, 5);
    expect(savedStats.lifetimeCostUSD).toBeCloseTo(0.002868, 5);
  });

  test("resets today stats while preserving lifetime stats", async () => {
    await recordUsage(mockApp, { prompt_tokens: 5000, completion_tokens: 500 }, true);

    await resetUsage(mockApp, false);

    const savedStats = JSON.parse(mockApp.settings[SETTING_USAGE_STATS]);
    expect(savedStats.todayRequests).toBe(0);
    expect(savedStats.todayPromptTokens).toBe(0);
    expect(savedStats.todayCostUSD).toBe(0);
    expect(savedStats.lifetimeRequests).toBe(1);
    expect(savedStats.lifetimePromptTokens).toBe(5000);
  });

  test("resets all stats when all=true", async () => {
    await recordUsage(mockApp, { prompt_tokens: 5000, completion_tokens: 500 }, true);

    await resetUsage(mockApp, true);

    const savedStats = JSON.parse(mockApp.settings[SETTING_USAGE_STATS]);
    expect(savedStats.todayRequests).toBe(0);
    expect(savedStats.lifetimeRequests).toBe(0);
    expect(savedStats.lifetimeCostUSD).toBe(0);
  });
});

describe("Usage Tracker — Edge Cases & Rollover", () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      settings: {},
      setSetting: jest.fn(async (key, val) => {
        mockApp.settings[key] = val;
      })
    };
  });

  test("automatically rolls over today counters on a new date while keeping lifetime totals", () => {
    const yesterdayStats = {
      date: "2020-01-01",
      todayRequests: 15,
      todayPromptTokens: 50000,
      todayCompletionTokens: 5000,
      todayCachedTokens: 10000,
      todayCostUSD: 0.05,
      lifetimeRequests: 100,
      lifetimePromptTokens: 300000,
      lifetimeCompletionTokens: 30000,
      lifetimeCachedTokens: 50000,
      lifetimeCostUSD: 0.35
    };

    mockApp.settings[SETTING_USAGE_STATS] = JSON.stringify(yesterdayStats);

    const stats = getUsageStats(mockApp);
    const today = new Date().toISOString().split("T")[0];

    expect(stats.date).toBe(today);
    expect(stats.todayRequests).toBe(0);
    expect(stats.todayPromptTokens).toBe(0);
    expect(stats.todayCostUSD).toBe(0);
    expect(stats.lifetimeRequests).toBe(100);
    expect(stats.lifetimeCostUSD).toBe(0.35);
  });

  test("handles zero or missing usage tokens safely", async () => {
    await recordUsage(mockApp, {});
    const stats = JSON.parse(mockApp.settings[SETTING_USAGE_STATS]);

    expect(stats.todayRequests).toBe(1);
    expect(stats.todayPromptTokens).toBe(0);
    expect(stats.todayCompletionTokens).toBe(0);
    expect(stats.todayCostUSD).toBe(0);
  });
});

describe("Usage Tracker — Error Handling", () => {
  test("recovers gracefully from corrupted JSON in settings", () => {
    const mockApp = {
      settings: {
        [SETTING_USAGE_STATS]: "CORRUPTED{NOT_JSON"
      }
    };

    const stats = getUsageStats(mockApp);
    expect(stats.todayRequests).toBe(0);
    expect(stats.lifetimeRequests).toBe(0);
  });

  test("safely handles null app or missing setSetting method", async () => {
    await expect(recordUsage(null, { prompt_tokens: 10 })).resolves.not.toThrow();
    await expect(resetUsage({}, false)).resolves.not.toThrow();
  });
});
