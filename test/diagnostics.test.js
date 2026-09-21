/**
 * @file diagnostics.test.js
 * @description Tests for testHemmingwayConnection API diagnostic health check.
 */

import { jest } from "@jest/globals";
import { testHemmingwayConnection } from "../lib/api/diagnostics.js";

describe("Diagnostics — Connection Check", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("returns ok: true with zero tokens used when listModels succeeds", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        object: "list",
        data: [{ id: "hemmingway-27b", object: "model", owned_by: "hemmingway" }]
      })
    });

    const res = await testHemmingwayConnection({ apiKey: "hemmingway_live_valid123" });

    expect(res.ok).toBe(true);
    expect(res.model).toBe("hemmingway-27b");
    expect(res.sample).toContain("0 tokens used");
    expect(typeof res.latencyMs).toBe("number");
  });

  test("falls back to minimal chat completion if listModels is unavailable", async () => {
    // 1st call: listModels fails
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => JSON.stringify({ error: { code: "not_found", message: "Not Found" } })
    });

    // 2nd call: chat completion succeeds
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        model: "hemmingway-27b",
        choices: [{ message: { content: "OK" } }]
      })
    });

    const res = await testHemmingwayConnection({ apiKey: "hemmingway_live_valid123" });

    expect(res.ok).toBe(true);
    expect(res.sample).toBe("OK");
  });

  test("returns error when API key is empty", async () => {
    const res = await testHemmingwayConnection({ apiKey: "" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("No API key provided");
  });

  test("returns error when both listModels and completion fail", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({ error: { code: "bad_key", message: "Invalid key" } })
    });

    const res = await testHemmingwayConnection({ apiKey: "invalid_key" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Invalid Hemmingway API key");
  });
});
