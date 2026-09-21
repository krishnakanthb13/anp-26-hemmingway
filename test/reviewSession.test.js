/**
 * @file reviewSession.test.js
 * @description Unit tests for ReviewSession state, undo stack, and document reconstruction.
 */

import { ReviewSession } from "../lib/engine/reviewSession.js";
import { GRANULARITY_MODES } from "../lib/constants.js";

describe("ReviewSession", () => {
  test("initializes items and computes stats", () => {
    const doc = "Paragraph one.\n\nParagraph two.";
    const session = new ReviewSession({
      noteUUID: "test-note-uuid",
      noteTitle: "Test Note",
      noteContent: doc,
      granularity: GRANULARITY_MODES.PARAGRAPH
    });

    const stats = session.getStats();
    expect(stats.totalInspectable).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.progressPercent).toBe(0);
  });

  test("accepts, rejects, and undoes actions", () => {
    const doc = "First sentence.\n\nSecond sentence.";
    const session = new ReviewSession({
      noteUUID: "test-note-uuid",
      noteTitle: "Test Note",
      noteContent: doc,
      granularity: GRANULARITY_MODES.PARAGRAPH
    });

    const item = session.getCurrentItem();
    session.setItemSuggestion(item.id, "Polished sentence.", "Reasoning explanation.");

    expect(item.status).toBe("ready");
    expect(item.suggestion).toBe("Polished sentence.");

    session.accept(item.id);
    expect(item.status).toBe("accepted");

    // Test Undo
    const undone = session.undo();
    expect(undone).toBe(true);
    expect(item.status).toBe("ready");
  });

  test("accurately reconstructs content with accepted revisions", () => {
    const doc = "Paragraph one.\n\nParagraph two.";
    const session = new ReviewSession({
      noteUUID: "test-note-uuid",
      noteTitle: "Test Note",
      noteContent: doc,
      granularity: GRANULARITY_MODES.PARAGRAPH
    });

    const item1 = session.items[0];
    session.setItemSuggestion(item1.id, "Polished paragraph one.");
    session.accept(item1.id);

    const reconstructed = session.getReconstructedContent();
    expect(reconstructed).toBe("Polished paragraph one.\n\nParagraph two.");
  });
});
