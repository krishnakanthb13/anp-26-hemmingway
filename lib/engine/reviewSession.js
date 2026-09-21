/**
 * @file reviewSession.js
 * @description State machine for an active Hemmingway review session.
 * Manages item statuses, undo stack, navigation, and document reconstruction.
 */

import { tokenizeContent } from "./tokenizer.js";
import { GRANULARITY_MODES } from "../constants.js";

export class ReviewSession {
  /**
   * @param {Object} params
   * @param {string} params.noteUUID
   * @param {string} params.noteTitle
   * @param {string} params.noteContent
   * @param {string[]} [params.noteTags]
   * @param {number} [params.updatedAt]
   * @param {string} [params.granularity] - "full" | "paragraph" | "sentence"
   * @param {string} [params.presetId]
   */
  constructor({
    noteUUID,
    noteTitle = "Untitled Note",
    noteContent = "",
    noteTags = [],
    updatedAt = Date.now(),
    granularity = GRANULARITY_MODES.PARAGRAPH,
    presetId = "human_polish"
  }) {
    this.noteUUID = noteUUID;
    this.noteTitle = noteTitle;
    this.initialContent = noteContent;
    this.noteTags = Array.isArray(noteTags) ? noteTags : [];
    this.updatedAt = updatedAt;
    this.granularity = granularity;
    this.presetId = presetId;
    this.customPrompt = "";
    this.diffViewMode = "clean"; // "clean" | "inline" | "side" | "changes"
    this.currentIndex = 0;
    this.undoStack = [];

    // Tokenize items
    const rawItems = tokenizeContent(noteContent, granularity);
    this.items = rawItems.map(item => ({
      id: item.id,
      original: item.original,
      suggestion: null,
      reasoning: null,
      type: item.type, // "full" | "paragraph" | "sentence" | "separator"
      isInspectable: item.isInspectable,
      parentParagraphId: item.parentParagraphId,
      isLastInParagraph: item.isLastInParagraph,
      status: item.isInspectable ? "pending" : "no_change", // "pending" | "ready" | "accepted" | "rejected" | "edited" | "no_change"
      editedContent: null
    }));

    // Find first inspectable item
    const firstIdx = this.items.findIndex(it => it.isInspectable);
    this.currentIndex = firstIdx >= 0 ? firstIdx : 0;
  }

  /**
   * Gets current active item.
   */
  getCurrentItem() {
    return this.items[this.currentIndex] || null;
  }

  /**
   * Updates an item with suggested revision and reasoning from Hemmingway.
   * @param {number} id
   * @param {string} suggestion
   * @param {string} [reasoning]
   */
  setItemSuggestion(id, suggestion, reasoning = "") {
    const item = this.items.find(it => it.id === id);
    if (!item) return;

    this.pushUndo("suggestion", id, {
      suggestion: item.suggestion,
      reasoning: item.reasoning,
      status: item.status
    });

    item.suggestion = suggestion;
    item.reasoning = reasoning;

    if (suggestion.trim() === item.original.trim()) {
      item.status = "no_change";
    } else {
      item.status = "ready";
    }
  }

  /**
   * Accepts the suggested edit for an item.
   * @param {number} id
   */
  accept(id) {
    const item = this.items.find(it => it.id === id);
    if (!item || (item.status !== "ready" && item.status !== "edited")) return;

    this.pushUndo("status", id, { status: item.status });
    item.status = "accepted";
  }

  /**
   * Rejects the suggestion and keeps the original text.
   * @param {number} id
   */
  reject(id) {
    const item = this.items.find(it => it.id === id);
    if (!item) return;

    this.pushUndo("status", id, { status: item.status });
    item.status = "rejected";
  }

  /**
   * Manually edits the suggestion text.
   * @param {number} id
   * @param {string} newText
   */
  edit(id, newText) {
    const item = this.items.find(it => it.id === id);
    if (!item) return;

    this.pushUndo("edit", id, {
      status: item.status,
      suggestion: item.suggestion,
      editedContent: item.editedContent
    });

    item.editedContent = newText;
    item.suggestion = newText;
    item.status = "edited";
  }

  /**
   * Alias for edit().
   */
  manualEdit(id, newText) {
    this.edit(id, newText);
  }

  /**
   * Checks if undo is possible.
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Pushes state snapshot to undo stack.
   */
  pushUndo(action, itemId, prevState) {
    this.undoStack.push({
      action,
      itemId,
      prevState,
      currentIndex: this.currentIndex
    });
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
  }

  /**
   * Reverts last user action.
   * @returns {boolean} true if an action was undone
   */
  undo() {
    if (this.undoStack.length === 0) return false;
    const entry = this.undoStack.pop();
    const item = this.items.find(it => it.id === entry.itemId);
    if (!item) return false;

    Object.assign(item, entry.prevState);
    if (typeof entry.currentIndex === "number") {
      this.currentIndex = entry.currentIndex;
    }
    return true;
  }

  /**
   * Navigation helpers
   */
  nextItem() {
    for (let i = this.currentIndex + 1; i < this.items.length; i++) {
      if (this.items[i].isInspectable) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }

  prevItem() {
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      if (this.items[i].isInspectable) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }

  nextPending() {
    for (let i = this.currentIndex + 1; i < this.items.length; i++) {
      if (this.items[i].isInspectable && (this.items[i].status === "pending" || this.items[i].status === "ready")) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }

  prevPending() {
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      if (this.items[i].isInspectable && (this.items[i].status === "pending" || this.items[i].status === "ready")) {
        this.currentIndex = i;
        return true;
      }
    }
    return false;
  }

  jumpTo(id) {
    const idx = this.items.findIndex(it => it.id === id);
    if (idx >= 0) {
      this.currentIndex = idx;
      return true;
    }
    return false;
  }

  /**
   * Summary metrics
   */
  getStats() {
    let pending = 0;
    let ready = 0;
    let accepted = 0;
    let rejected = 0;
    let edited = 0;
    let noChange = 0;
    let totalInspectable = 0;

    for (const item of this.items) {
      if (!item.isInspectable) continue;
      totalInspectable++;
      if (item.status === "pending") pending++;
      else if (item.status === "ready") ready++;
      else if (item.status === "accepted") accepted++;
      else if (item.status === "rejected") rejected++;
      else if (item.status === "edited") edited++;
      else if (item.status === "no_change") noChange++;
    }

    const reviewed = accepted + rejected + edited + noChange;
    const progressPercent = totalInspectable > 0 ? Math.round((reviewed / totalInspectable) * 100) : 100;

    return {
      totalInspectable,
      pending,
      ready,
      accepted,
      rejected,
      edited,
      noChange,
      reviewed,
      progressPercent
    };
  }

  /**
   * Reconstructs full markdown document from session items.
   * Accurately preserves double-newline paragraph spacing and separator blocks.
   * @returns {string}
   */
  getReconstructedContent() {
    if (this.granularity === GRANULARITY_MODES.FULL) {
      const item = this.items[0];
      if (!item) return this.initialContent;
      if (item.status === "accepted" || item.status === "edited") {
        return item.editedContent || item.suggestion || item.original;
      }
      return item.original;
    }

    if (this.granularity === GRANULARITY_MODES.PARAGRAPH) {
      const outputParts = [];
      for (const item of this.items) {
        if (item.type === "separator") {
          outputParts.push("");
        } else if (item.status === "accepted" || item.status === "edited") {
          outputParts.push(item.editedContent || item.suggestion || item.original);
        } else {
          outputParts.push(item.original);
        }
      }
      return outputParts.join("\n");
    }

    // Sentence granularity: group sentences by parent paragraph
    const paraMap = new Map();
    for (const item of this.items) {
      const pId = item.parentParagraphId;
      if (!paraMap.has(pId)) {
        paraMap.set(pId, []);
      }
      let text = item.original;
      if (item.status === "accepted" || item.status === "edited") {
        text = item.editedContent || item.suggestion || item.original;
      }
      paraMap.get(pId).push({ text, type: item.type });
    }

    const paraOutputs = [];
    for (const [, sList] of paraMap) {
      if (sList.length === 1 && sList[0].type === "separator") {
        paraOutputs.push("");
      } else {
        const joined = sList.map(s => s.text).join(" ");
        paraOutputs.push(joined);
      }
    }

    return paraOutputs.join("\n");
  }

  /**
   * Serializes session to JSON for persistence.
   */
  toJSON() {
    return {
      noteUUID: this.noteUUID,
      noteTitle: this.noteTitle,
      initialContent: this.initialContent,
      noteTags: this.noteTags,
      updatedAt: this.updatedAt,
      granularity: this.granularity,
      presetId: this.presetId,
      customPrompt: this.customPrompt,
      diffViewMode: this.diffViewMode,
      currentIndex: this.currentIndex,
      items: this.items
    };
  }

  /**
   * Restores session from JSON.
   */
  static fromJSON(data) {
    if (!data || !data.noteUUID) return null;
    const session = new ReviewSession({
      noteUUID: data.noteUUID,
      noteTitle: data.noteTitle,
      noteContent: data.initialContent,
      noteTags: data.noteTags,
      updatedAt: data.updatedAt,
      granularity: data.granularity,
      presetId: data.presetId
    });

    session.customPrompt = data.customPrompt || "";
    session.diffViewMode = data.diffViewMode || "clean";
    session.currentIndex = typeof data.currentIndex === "number" ? data.currentIndex : 0;
    if (Array.isArray(data.items)) {
      session.items = data.items;
    }
    return session;
  }
}
