/**
 * @file workflow.test.js
 * @description Unit, edge case, and regression tests for workflow coordination and AI reviews.
 */

import { jest } from "@jest/globals";
import { handleRunReview, getEffectiveSystemPrompt } from "../lib/features/workflow.js";
import { ReviewSession } from "../lib/engine/reviewSession.js";
import { setActiveSession, clearActiveSession } from "../lib/data/store.js";
import { SETTING_API_KEY, GRANULARITY_MODES } from "../lib/constants.js";

describe("Workflow — System Prompts", () => {
  test("returns preset system prompt by default", () => {
    const prompt = getEffectiveSystemPrompt("hemingway_classic");
    expect(prompt).toContain("Ernest Hemingway");
  });

  test("prefers custom prompt override if present", () => {
    const prompt = getEffectiveSystemPrompt("hemingway_classic", "Write like Shakespeare");
    expect(prompt).toBe("Write like Shakespeare");
  });
});

describe("Workflow — Review Execution", () => {
  let mockApp;
  let session;

  beforeEach(() => {
    global.fetch = jest.fn();

    session = new ReviewSession({
      noteUUID: "uuid-workflow-1",
      noteTitle: "Draft Note",
      noteContent: "This was a very difficult day for the team.",
      granularity: GRANULARITY_MODES.PARAGRAPH
    });
    setActiveSession(session);

    mockApp = {
      settings: {
        [SETTING_API_KEY]: "hemmingway_live_valid123"
      },
      setSetting: jest.fn(async () => true)
    };
  });

  afterEach(() => {
    clearActiveSession();
    jest.resetAllMocks();
  });

  test("runs review on active item, updates suggestion, and records usage", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        model: "hemmingway-27b",
        choices: [{
          message: {
            content: "The team had a hard day.",
            reasoning_content: "Replaced difficult with hard, trimmed adverbs."
          }
        }],
        usage: { prompt_tokens: 15, completion_tokens: 8, total_tokens: 23 }
      })
    });

    const res = await handleRunReview(mockApp);

    expect(res.ok).toBe(true);
    const currentItem = session.getCurrentItem();
    expect(currentItem.suggestion).toBe("The team had a hard day.");
    expect(currentItem.reasoning).toContain("trimmed adverbs");
    expect(currentItem.status).toBe("ready");
    expect(mockApp.setSetting).toHaveBeenCalled();
  });

  test("re-reviews item with specific instructions included in system prompt", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        model: "hemmingway-27b",
        choices: [{
          message: {
            content: "It was tough.",
            reasoning_content: "Made much shorter as requested."
          }
        }],
        usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 }
      })
    });

    const res = await handleRunReview(mockApp, 0, "Make it punchier");

    expect(res.ok).toBe(true);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const systemMsg = body.messages.find(m => m.role === "system");
    expect(systemMsg.content).toContain("Specific Editorial Instruction");
    expect(systemMsg.content).toContain("Make it punchier");
  });

  test("returns error if API key is missing", async () => {
    mockApp.settings[SETTING_API_KEY] = "";
    const res = await handleRunReview(mockApp);

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Hemmingway API key");
  });

  test("returns error if no active session is loaded", async () => {
    clearActiveSession();
    const res = await handleRunReview(mockApp);

    expect(res.ok).toBe(false);
    expect(res.error).toContain("No active review session");
  });
});
