import { jest } from "@jest/globals";
import { HemmingwayClient } from "../lib/api/client.js";
import { THINKING_EFFORT_MODES } from "../lib/constants.js";

describe("HemmingwayClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("throws error when API key is missing", async () => {
    const client = new HemmingwayClient({ apiKey: "" });
    await expect(client.complete({ prompt: "Hello" })).rejects.toThrow("No Hemmingway API Key configured");
  });

  test("sends valid request payload and parses reasoning_content", async () => {
    const fakeResponse = {
      model: "hemmingway-27b",
      choices: [
        {
          message: {
            content: "Polished prose from Hemmingway.",
            reasoning_content: "Cut three unnecessary adverbs and restructured clause."
          }
        }
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 20,
        total_tokens: 35
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(fakeResponse)
    });

    const client = new HemmingwayClient({ apiKey: "hemmingway_live_testkey123" });
    const result = await client.complete({
      prompt: "Rough draft text",
      systemPrompt: "Make it human.",
      thinkingEffort: THINKING_EFFORT_MODES.MEDIUM
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe("https://hemmingway.io/v1/chat/completions");
    expect(options.headers["Authorization"]).toBe("Bearer hemmingway_live_testkey123");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("hemmingway-27b");
    expect(body.reasoning_effort).toBe("medium");

    expect(result.content).toBe("Polished prose from Hemmingway.");
    expect(result.reasoningContent).toContain("Cut three unnecessary adverbs");
    expect(result.usage.total_tokens).toBe(35);
  });

  test("sends enable_thinking: false when thinking is turned off", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        id: "chatcmpl-test456",
        model: "hemmingway-27b",
        choices: [{
          message: { role: "assistant", content: "Fast output." }
        }],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 }
      })
    });

    const client = new HemmingwayClient({ apiKey: "hemmingway_live_testkey123" });
    await client.complete({
      prompt: "Fast draft",
      thinkingEffort: THINKING_EFFORT_MODES.OFF
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.enable_thinking).toBe(false);
    expect(body.reasoning_effort).toBeUndefined();
  });

  test("handles bad_key and out_of_credit errors with helpful messages", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({ error: { code: "bad_key", message: "Key invalid" } })
    });

    const client = new HemmingwayClient({ apiKey: "invalid_key" });
    await expect(client.complete({ prompt: "Test" })).rejects.toThrow("Invalid Hemmingway API key (bad_key)");
  });
});
