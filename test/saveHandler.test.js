/**
 * @file saveHandler.test.js
 * @description Unit, edge case, and regression tests for handleSaveAndCommit and stale note overwrite guard.
 */

import { jest } from "@jest/globals";
import { handleSaveAndCommit } from "../lib/features/saveHandler.js";
import { ReviewSession } from "../lib/engine/reviewSession.js";
import { setActiveSession, clearActiveSession } from "../lib/data/store.js";
import { GRANULARITY_MODES } from "../lib/constants.js";

describe("Save Handler — Happy Path", () => {
  let mockApp;
  let session;

  beforeEach(() => {
    session = new ReviewSession({
      noteUUID: "note-uuid-123",
      noteTitle: "My Essay",
      noteContent: "Initial draft text.",
      granularity: GRANULARITY_MODES.PARAGRAPH
    });
    const item = session.getCurrentItem();
    session.setItemSuggestion(item.id, "Polished essay text.");
    session.accept(item.id);
    setActiveSession(session);

    mockApp = {
      getNoteContent: jest.fn(async () => "Initial draft text."),
      replaceNoteContent: jest.fn(async () => true),
      createNote: jest.fn(async (title, tags) => "created-note-uuid-456"),
      insertNoteContent: jest.fn(async () => true),
      prompt: jest.fn()
    };
  });

  afterEach(() => {
    clearActiveSession();
    jest.resetAllMocks();
  });

  test("saves revised note directly when audit notes are disabled", async () => {
    const res = await handleSaveAndCommit(mockApp, false);

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalledWith(
      { uuid: "note-uuid-123" },
      expect.stringContaining("Polished essay text.")
    );
    expect(mockApp.createNote).not.toHaveBeenCalled();
    expect(res.changesNoteUUID).toBeNull();
  });

  test("creates companion report and history note when createAuditNotes is true", async () => {
    const res = await handleSaveAndCommit(mockApp, true);

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalledTimes(1);
    expect(mockApp.createNote).toHaveBeenCalledTimes(2);
    expect(mockApp.insertNoteContent).toHaveBeenCalledTimes(2);
    expect(res.changesNoteUUID).toBe("created-note-uuid-456");
    expect(res.historyNoteUUID).toBe("created-note-uuid-456");
  });
});

describe("Save Handler — Stale Note Guard & Edge Cases", () => {
  let mockApp;
  let session;

  beforeEach(() => {
    session = new ReviewSession({
      noteUUID: "note-uuid-123",
      noteTitle: "Stale Note",
      noteContent: "Original content before external edit.",
      granularity: GRANULARITY_MODES.PARAGRAPH
    });
    const item = session.getCurrentItem();
    session.setItemSuggestion(item.id, "Polished content.");
    session.accept(item.id);
    setActiveSession(session);

    mockApp = {
      getNoteContent: jest.fn(async () => "External modification made in another tab."),
      replaceNoteContent: jest.fn(async () => true),
      prompt: jest.fn()
    };
  });

  afterEach(() => {
    clearActiveSession();
    jest.resetAllMocks();
  });

  test("cancels save if external change detected and user rejects overwrite", async () => {
    mockApp.prompt.mockResolvedValueOnce({
      "The source note was modified outside Hemmingway. Overwrite with reviewed version?": false
    });

    const res = await handleSaveAndCommit(mockApp, false);

    expect(res.success).toBe(false);
    expect(res.cancelled).toBe(true);
    expect(mockApp.replaceNoteContent).not.toHaveBeenCalled();
  });

  test("proceeds with save if external change detected and user confirms overwrite", async () => {
    mockApp.prompt.mockResolvedValueOnce({
      "The source note was modified outside Hemmingway. Overwrite with reviewed version?": true
    });

    const res = await handleSaveAndCommit(mockApp, false);

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalledTimes(1);
  });
});

describe("Save Handler — Error Handling", () => {
  test("returns error when active session is missing", async () => {
    clearActiveSession();
    const res = await handleSaveAndCommit({}, false);
    expect(res.success).toBe(false);
    expect(res.error).toContain("No active review session");
  });

  test("handles replaceNoteContent API failures safely", async () => {
    const session = new ReviewSession({
      noteUUID: "uuid-err",
      noteTitle: "Error Note",
      noteContent: "Draft",
      granularity: GRANULARITY_MODES.PARAGRAPH
    });
    setActiveSession(session);

    const mockApp = {
      getNoteContent: jest.fn(async () => "Draft"),
      replaceNoteContent: jest.fn(async () => {
        throw new Error("Amplenote permission denied");
      })
    };

    const res = await handleSaveAndCommit(mockApp, false);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Amplenote permission denied");

    clearActiveSession();
  });
});
