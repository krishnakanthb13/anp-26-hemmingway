/**
 * @file historyViewer.test.js
 * @description Unit and regression tests for loadHistoryRecords and Amplenote query compatibility.
 */

import { jest } from "@jest/globals";
import { loadHistoryRecords } from "../lib/features/historyViewer.js";
import { TAG_HEMMINGWAY_HISTORY } from "../lib/constants.js";

describe("History Viewer — Happy Path", () => {
  test("loads and parses history records across tag queries without limit key", async () => {
    const mockApp = {
      filterNotes: jest.fn(async (query) => {
        // Regression assertion: Amplenote filterNotes throws if 'limit' is present
        expect(query.limit).toBeUndefined();

        if (query.tag === TAG_HEMMINGWAY_HISTORY) {
          return [
            { uuid: "hist-1", name: "Hemmingway Review History Record - Test Note" }
          ];
        }
        return [];
      }),
      getNoteContent: jest.fn(async () => {
        const payload = JSON.stringify({
          sourceNote: { uuid: "source-1", title: "Test Note" },
          date: "2026-09-21T10:00:00Z",
          metrics: { accepted: 2, rejected: 1, edited: 0 },
          model: "hemmingway-27b",
          decisions: []
        });
        return `# 📜 Hemmingway Review History: Test Note\n\n\`\`\`json\n${payload}\n\`\`\``;
      })
    };

    const records = await loadHistoryRecords(mockApp);
    expect(records.length).toBe(1);
    expect(records[0].sourceNote.title).toBe("Test Note");
    expect(records[0].metrics.accepted).toBe(2);
  });
});

describe("History Viewer — Fallback & Edge Cases", () => {
  test("falls back to companion changes notes if primary history tag is empty", async () => {
    const mockApp = {
      filterNotes: jest.fn(async (query) => {
        expect(query.limit).toBeUndefined();
        if (query.tag === "-reports/-hemmingway/-changes") {
          return [
            { uuid: "change-1", name: "Hemmingway Polish Changes - Fallback Note" }
          ];
        }
        return [];
      }),
      getNoteContent: jest.fn(async () => {
        return `# Hemmingway Changes\n\n| Item | Type | Summary |\n|---|---|---|\n| #1 | accepted | Replaced adverbs |`;
      })
    };

    const records = await loadHistoryRecords(mockApp);
    expect(records.length).toBe(1);
    expect(records[0].noteUUID).toBe("change-1");
  });

  test("returns empty array when no notes are found", async () => {
    const mockApp = {
      filterNotes: jest.fn(async () => [])
    };

    const records = await loadHistoryRecords(mockApp);
    expect(records).toEqual([]);
  });

  test("handles filterNotes exceptions safely", async () => {
    const mockApp = {
      filterNotes: jest.fn(async () => {
        throw new Error("Amplenote network error");
      })
    };

    const records = await loadHistoryRecords(mockApp);
    expect(records).toEqual([]);
  });
});
