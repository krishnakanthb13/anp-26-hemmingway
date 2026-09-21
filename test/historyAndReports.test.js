import { describe, it, expect } from "@jest/globals";
import { ReviewSession } from "../lib/engine/reviewSession.js";
import { generateHistoryRecord, parseHistoryNotes, getSafeMarkdownFence } from "../lib/data/historyManager.js";
import { generateChangesReport } from "../lib/data/reportGenerator.js";
import { TAG_HEMMINGWAY_HISTORY, TAG_HEMMINGWAY_CHANGES } from "../lib/constants.js";

describe("History Manager & Report Generator", () => {
  const sampleNote = `First paragraph to be reviewed.

Second paragraph with awkward phrasing.`;

  it("getSafeMarkdownFence expands backticks safely", () => {
    expect(getSafeMarkdownFence("normal text")).toBe("```");
    expect(getSafeMarkdownFence("text with ``` inside")).toBe("````");
  });

  it("generateHistoryRecord produces valid JSON payload and metadata", () => {
    const session = new ReviewSession({
      noteUUID: "test-uuid-123",
      noteTitle: "My Draft Note",
      noteContent: sampleNote
    });

    const firstId = session.items[0].id;
    session.setItemSuggestion(firstId, "First paragraph smoothly polished.");
    session.accept(firstId);

    const record = generateHistoryRecord({
      session,
      sourceNoteTitle: session.noteTitle,
      sourceNoteUUID: session.noteUUID,
      finalContent: session.getReconstructedContent()
    });

    expect(record.name).toContain("Hemmingway History: My Draft Note");
    expect(record.tags).toEqual([TAG_HEMMINGWAY_HISTORY]);
    expect(record.content).toContain("```json");
    expect(record.content).toContain('"schemaVersion": 1');
    expect(record.content).toContain('"test-uuid-123"');
  });

  it("parseHistoryNotes extracts JSON records and sorts by timestamp", () => {
    const rawNotes = [
      {
        uuid: "note-h1",
        name: "Hemmingway History: Draft (2026-09-21 12:00)",
        body: `# Title\n\`\`\`json\n{"timestamp": 1000, "sourceNote": {"uuid": "u1", "title": "Draft 1"}, "session": {"stats": {"accepted": 2}}}\n\`\`\``
      },
      {
        uuid: "note-h2",
        name: "Hemmingway History: Draft (2026-09-21 14:00)",
        body: `# Title\n\`\`\`json\n{"timestamp": 2000, "sourceNote": {"uuid": "u1", "title": "Draft 1"}, "session": {"stats": {"accepted": 3}}}\n\`\`\``
      }
    ];

    const parsed = parseHistoryNotes(rawNotes);
    expect(parsed.length).toBe(2);
    expect(parsed[0].timestamp).toBe(2000); // Newest first
    expect(parsed[1].timestamp).toBe(1000);
  });

  it("generateChangesReport formats a detailed markdown document with original snapshot", () => {
    const session = new ReviewSession({
      noteUUID: "test-uuid-123",
      noteTitle: "Report Note",
      noteContent: sampleNote
    });

    const firstId = session.items[0].id;
    session.setItemSuggestion(firstId, "First paragraph smoothly polished.");
    session.edit(firstId, "First paragraph with human warmth.");
    session.accept(firstId);

    const report = generateChangesReport({
      session,
      sourceNoteTitle: session.noteTitle,
      sourceNoteUUID: session.noteUUID,
      finalContent: session.getReconstructedContent()
    });

    expect(report.name).toContain("Hemmingway Changes: Report Note");
    expect(report.tags).toEqual([TAG_HEMMINGWAY_CHANGES]);
    expect(report.content).toContain("# 📝 Hemmingway Polish Changes: Report Note");
    expect(report.content).toContain("## 📊 Itemized Changes");
    expect(report.content).toContain("First paragraph with human warmth.");
    expect(report.content).toContain("<details>");
    expect(report.content).toContain("Click to view original text before Hemmingway review");
  });
});
