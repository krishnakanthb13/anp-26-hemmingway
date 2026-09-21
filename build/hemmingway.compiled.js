(() => {
// anp-26-hemmingway/lib/data/store.js
var activeSession = null;
function getActiveSession() {
  return activeSession;
}
function setActiveSession(session) {
  activeSession = session;
}
function clearActiveSession() {
  activeSession = null;
}

// anp-26-hemmingway/lib/constants.js
var SETTING_API_KEY = "Hemmingway API Key";
var SETTING_THINKING_EFFORT = "Thinking Effort";
var SETTING_BASE_URL = "Custom Base URL";
var SETTING_USAGE_STATS = "Hemmingway Usage Stats";
var DEFAULT_BASE_URL = "https://hemmingway.io/v1";
var DEFAULT_MODEL = "hemmingway-27b";
var THINKING_EFFORT_MODES = {
  XHIGH: "xhigh",
  MEDIUM: "medium",
  LOW: "low",
  OFF: "off"
};
var DEFAULT_THINKING_EFFORT = THINKING_EFFORT_MODES.MEDIUM;
var GRANULARITY_MODES = {
  FULL: "full",
  PARAGRAPH: "paragraph",
  SENTENCE: "sentence"
};
var THEMES = [
  { id: "espresso", name: "Espresso Obsidian", icon: "\u2615", type: "dark" },
  { id: "midnight", name: "Midnight Slate", icon: "\u{1F30C}", type: "dark" },
  { id: "nord", name: "Nord Arctic", icon: "\u2744\uFE0F", type: "dark" },
  { id: "glass", name: "Glassmorphism", icon: "\u2728", type: "dark" },
  { id: "emerald", name: "Emerald Forest", icon: "\u{1F332}", type: "dark" },
  { id: "purple", name: "Cyber Violet", icon: "\u{1F49C}", type: "dark" },
  { id: "dracula", name: "Dracula Neo", icon: "\u{1F9DB}", type: "dark" },
  { id: "sepia", name: "Sepia Parchment", icon: "\u{1F4DC}", type: "light" },
  { id: "light", name: "Clean Daylight", icon: "\u2600\uFE0F", type: "light" },
  { id: "sakura", name: "Sakura Blossom", icon: "\u{1F338}", type: "light" },
  { id: "matcha", name: "Matcha Latte", icon: "\u{1F375}", type: "light" },
  { id: "nord-light", name: "Nord Frost", icon: "\u{1F9CA}", type: "light" }
];
var EDITORIAL_PRESETS = [
  {
    id: "human_polish",
    name: "Make It Sound Human (De-AIify)",
    category: "Voice & Tone",
    description: "Removes robotic cadence, synthetic buzzwords, and AI cliches. Makes it sound like a person put it down.",
    systemPrompt: `You are Hemmingway, a master human editor and writer. Your goal is to make text sound unmistakably human, natural, and grounded. Eliminate synthetic transitions ("delve", "testament", "tapestry", "crucial", "moreover"), repetitive sentence cadences, and robotic filler. Write with warmth, rhythm, and authentic human cadence. Preserve markdown formatting, links, and original facts exactly.`
  },
  {
    id: "hemingway_classic",
    name: "The Hemingway Edit (Bold & Direct)",
    category: "Conciseness & Style",
    description: "Strips adverbs, eliminates passive voice, shortens bloated clauses, and uses strong Anglo-Saxon verbs.",
    systemPrompt: `You are an editor trained in the style of Ernest Hemingway. Cut all weak adverbs, convert passive voice to active voice, prune bloated clauses, and use strong, simple, vivid verbs and nouns. Make every sentence clear, direct, and vigorous. Preserve markdown structure and core facts.`
  },
  {
    id: "rough_notes_to_prose",
    name: "Rough Notes \u2794 Polished Prose",
    category: "Transformation",
    description: "Transforms bullet lists, jots, and fragmented meeting notes into cohesive, fluid narrative prose.",
    systemPrompt: `You are Hemmingway, an expert ghostwriter and editor. Take the rough notes, outlines, or bullet points provided and seamlessly weave them into clean, engaging, natural prose. Fill logical gaps smoothly while retaining all names, facts, dates, and instructions. Output clean markdown.`
  },
  {
    id: "executive_brief",
    name: "Executive Brief (Sharp & Decision-Ready)",
    category: "Professional & Business",
    description: "High-signal, concise business communication tailored for busy leaders and stakeholders.",
    systemPrompt: `You are an executive communication advisor. Refine the text to be punchy, authoritative, high-signal, and decision-ready. Put key outcomes first, remove hedging language, and ensure maximum clarity per word.`
  },
  {
    id: "storytelling_narrative",
    name: "Storytelling & Vivid Narrative",
    category: "Voice & Tone",
    description: "Infuses evocative sensory imagery, varied sentence lengths, and natural dramatic rhythm.",
    systemPrompt: `You are a literary editor. Refine the text with engaging pacing, sensory details, dynamic sentence variation, and compelling storytelling flow without becoming melodramatic.`
  },
  {
    id: "simplify_clarify",
    name: "Simplify & Clarify (Plain English)",
    category: "Conciseness & Style",
    description: "Replaces convoluted clauses and dense academic jargon with crystal-clear plain English.",
    systemPrompt: `You are a plain-language editor. Simplify complex grammar, replace jargon with accessible words, and clarify convoluted sentences so any reader grasps the point instantly.`
  },
  {
    id: "grammar_clean",
    name: "Clean Grammar & Typos Only",
    category: "Correction",
    description: "Fixes strictly spelling, punctuation, and grammatical mistakes with minimal stylistic modification.",
    systemPrompt: `You are a strict copyeditor. Fix only spelling errors, punctuation mistakes, typos, and grammatical errors. Strictly preserve the author's original vocabulary, phrasing, and markdown formatting.`
  }
];

// anp-26-hemmingway/lib/engine/tokenizer.js
function tokenizeContent(text, mode = GRANULARITY_MODES.PARAGRAPH) {
  if (!text || typeof text !== "string") {
    return [];
  }
  const normalized = text.replace(/\r\n/g, "\n");
  if (mode === GRANULARITY_MODES.FULL) {
    return [
      {
        id: 1,
        original: normalized,
        type: "full",
        isInspectable: isInspectableText(normalized),
        parentParagraphId: 1,
        isLastInParagraph: true
      }
    ];
  }
  if (mode === GRANULARITY_MODES.SENTENCE) {
    return tokenizeSentences(normalized);
  }
  return tokenizeParagraphs(normalized);
}
function tokenizeParagraphs(text) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const paragraphs = [];
  let currentBuffer = [];
  let inCodeFence = false;
  let codeFenceLen = 0;
  let idCounter = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const fenceMatch = trimmedLine.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inCodeFence) {
        inCodeFence = true;
        codeFenceLen = fenceMatch[1].length;
        currentBuffer.push(line);
        continue;
      } else if (fenceMatch[1].length >= codeFenceLen) {
        inCodeFence = false;
        codeFenceLen = 0;
        currentBuffer.push(line);
        continue;
      }
    }
    if (inCodeFence) {
      currentBuffer.push(line);
      continue;
    }
    if (trimmedLine === "") {
      if (currentBuffer.length > 0) {
        const chunkText = currentBuffer.join("\n");
        const paraId = idCounter++;
        paragraphs.push({
          id: paraId,
          original: chunkText,
          type: "paragraph",
          isInspectable: isInspectableText(chunkText),
          parentParagraphId: paraId,
          isLastInParagraph: true
        });
        currentBuffer = [];
      }
      const sepId = idCounter++;
      paragraphs.push({
        id: sepId,
        original: "",
        type: "separator",
        isInspectable: false,
        parentParagraphId: sepId,
        isLastInParagraph: true
      });
    } else {
      currentBuffer.push(line);
    }
  }
  if (currentBuffer.length > 0) {
    const chunkText = currentBuffer.join("\n");
    const paraId = idCounter++;
    paragraphs.push({
      id: paraId,
      original: chunkText,
      type: "paragraph",
      isInspectable: isInspectableText(chunkText),
      parentParagraphId: paraId,
      isLastInParagraph: true
    });
  }
  return paragraphs;
}
function tokenizeSentences(text) {
  const paragraphs = tokenizeParagraphs(text);
  const items = [];
  let idCounter = 1;
  for (const para of paragraphs) {
    if (!para.isInspectable || para.original.trim().startsWith("```") || para.original.trim().startsWith("#")) {
      items.push({
        ...para,
        id: idCounter++
      });
      continue;
    }
    const sentences = splitIntoSentences(para.original);
    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const s = sentences[sIdx];
      const isLast = sIdx === sentences.length - 1;
      items.push({
        id: idCounter++,
        original: s,
        type: "sentence",
        isInspectable: isInspectableText(s),
        parentParagraphId: para.id,
        isLastInParagraph: isLast
      });
    }
  }
  return items;
}
var ABBREVIATIONS_PATTERN = /\b(e\.g\.|i\.e\.|etc\.|mr\.|mrs\.|ms\.|dr\.|prof\.|sr\.|jr\.|inc\.|ltd\.|co\.|corp\.|u\.s\.|u\.k\.|u\.n\.|e\.u\.|ph\.d\.|m\.d\.|b\.a\.|m\.a\.|b\.s\.|m\.s\.|vs\.|fig\.|no\.|dept\.|est\.|approx\.|jan\.|feb\.|mar\.|apr\.|jun\.|jul\.|aug\.|sep\.|sept\.|oct\.|nov\.|dec\.|al\.|st\.|ave\.|rd\.|blvd\.)/gi;
function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];
  const protectedText = text.replace(ABBREVIATIONS_PATTERN, (match) => match.replace(/\./g, "\xA7DOT\xA7")).replace(/\.{3,}/g, (match) => match.replace(/\./g, "\xA7DOT\xA7")).replace(/\b([A-Z])\./g, "$1\xA7DOT\xA7").replace(/(\d+)\.(\d+)/g, "$1\xA7DOT\xA7$2").replace(/(https?:\/\/[^\s]+)/g, (match) => match.replace(/\./g, "\xA7DOT\xA7"));
  const parts = protectedText.split(/([.!?]+["')\]}]*(?:\s+|$))/g);
  const result = [];
  let current = "";
  for (let i = 0; i < parts.length; i++) {
    current += parts[i];
    if (i % 2 === 1 || i === parts.length - 1) {
      if (current.trim().length > 0) {
        result.push(current.replace(/§DOT§/g, ".").trim());
        current = "";
      }
    }
  }
  if (current.trim().length > 0) {
    result.push(current.replace(/§DOT§/g, ".").trim());
  }
  return result.length > 0 ? result : [text.trim()];
}
function isInspectableText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) return false;
  if (/^[-*_]{3,}$/.test(trimmed)) return false;
  return trimmed.length > 2;
}

// anp-26-hemmingway/lib/engine/reviewSession.js
var ReviewSession = class _ReviewSession {
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
    this.diffViewMode = "clean";
    this.currentIndex = 0;
    this.undoStack = [];
    const rawItems = tokenizeContent(noteContent, granularity);
    this.items = rawItems.map((item) => ({
      id: item.id,
      original: item.original,
      suggestion: null,
      reasoning: null,
      type: item.type,
      // "full" | "paragraph" | "sentence" | "separator"
      isInspectable: item.isInspectable,
      parentParagraphId: item.parentParagraphId,
      isLastInParagraph: item.isLastInParagraph,
      status: item.isInspectable ? "pending" : "no_change",
      // "pending" | "ready" | "accepted" | "rejected" | "edited" | "no_change"
      editedContent: null
    }));
    const firstIdx = this.items.findIndex((it) => it.isInspectable);
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
    const item = this.items.find((it) => it.id === id);
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
    const item = this.items.find((it) => it.id === id);
    if (!item || item.status !== "ready" && item.status !== "edited") return;
    this.pushUndo("status", id, { status: item.status });
    item.status = "accepted";
  }
  /**
   * Rejects the suggestion and keeps the original text.
   * @param {number} id
   */
  reject(id) {
    const item = this.items.find((it) => it.id === id);
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
    const item = this.items.find((it) => it.id === id);
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
    const item = this.items.find((it) => it.id === entry.itemId);
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
    const idx = this.items.findIndex((it) => it.id === id);
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
    const progressPercent = totalInspectable > 0 ? Math.round(reviewed / totalInspectable * 100) : 100;
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
    const paraMap = /* @__PURE__ */ new Map();
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
        const joined = sList.map((s) => s.text).join(" ");
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
    const session = new _ReviewSession({
      noteUUID: data.noteUUID,
      noteTitle: data.noteTitle,
      noteContent: data.initialContent,
      noteTags: data.noteTags,
      updatedAt: data.updatedAt,
      granularity: data.granularity,
      presetId: data.presetId
    });
    session.diffViewMode = data.diffViewMode || "clean";
    session.currentIndex = typeof data.currentIndex === "number" ? data.currentIndex : 0;
    if (Array.isArray(data.items)) {
      session.items = data.items;
    }
    return session;
  }
};

// anp-26-hemmingway/lib/features/launcher.js
async function launchHemmingway(app, targetNoteUUID = null) {
  let noteUUID = targetNoteUUID;
  let noteTitle = "Untitled Note";
  if (!noteUUID) {
    const selected = await app.prompt("Select a note to polish with Hemmingway:", {
      inputs: [
        {
          label: "Search Note",
          type: "note"
        }
      ]
    });
    if (selected) {
      if (Array.isArray(selected)) {
        const item = selected[0];
        if (item && typeof item === "object") {
          noteUUID = item.uuid || item.value || item.id || null;
          if (item.name || item.label) noteTitle = item.name || item.label;
        } else if (typeof item === "string") {
          noteUUID = item;
        }
      } else if (typeof selected === "object" && selected !== null) {
        noteUUID = selected.uuid || selected.value || selected.id || null;
        if (selected.name || selected.label) {
          noteTitle = selected.name || selected.label;
        }
      } else if (typeof selected === "string") {
        noteUUID = selected.trim();
      }
    } else {
      noteUUID = null;
    }
    if (!noteUUID) return;
  }
  const note = await app.findNote({ uuid: noteUUID });
  if (!note) {
    await app.alert("Could not load the specified note.");
    return;
  }
  const content = await app.getNoteContent({ uuid: noteUUID });
  if (!content || !content.trim()) {
    await app.alert(`"${note.name || "This note"}" is empty. Add some text first before polishing.`);
    return;
  }
  const session = new ReviewSession({
    noteUUID: note.uuid,
    noteTitle: note.name || "Untitled Note",
    noteContent: content,
    noteTags: note.tags || [],
    updatedAt: note.updated || Date.now(),
    granularity: GRANULARITY_MODES.PARAGRAPH
  });
  setActiveSession(session);
  if (typeof app.openEmbed === "function") {
    await app.openEmbed();
  }
  const pluginUUID = app.context?.pluginUUID || app.pluginUUID;
  if (pluginUUID && typeof app.navigate === "function") {
    await app.navigate(`https://www.amplenote.com/notes/plugins/${pluginUUID}`);
  }
}

// anp-26-hemmingway/lib/api/client.js
var HemmingwayClient = class {
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
    if (thinkingEffort === THINKING_EFFORT_MODES.OFF) {
      payload.enable_thinking = false;
    } else {
      payload.enable_thinking = true;
      payload.reasoning_effort = thinkingEffort;
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
};

// anp-26-hemmingway/lib/data/usageTracker.js
var COST_INPUT_PER_M = 0.24;
var COST_CACHED_INPUT_PER_M = 0.024;
var COST_OUTPUT_PER_M = 0.9;
function createDefaultStats() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return {
    date: today,
    todayRequests: 0,
    todayPromptTokens: 0,
    todayCompletionTokens: 0,
    todayCachedTokens: 0,
    todayCostUSD: 0,
    lifetimeRequests: 0,
    lifetimePromptTokens: 0,
    lifetimeCompletionTokens: 0,
    lifetimeCachedTokens: 0,
    lifetimeCostUSD: 0
  };
}
function getUsageStats(app) {
  const raw = app?.settings?.[SETTING_USAGE_STATS];
  if (!raw || typeof raw !== "string") {
    return createDefaultStats();
  }
  try {
    const stats = JSON.parse(raw);
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (stats.date !== today) {
      stats.date = today;
      stats.todayRequests = 0;
      stats.todayPromptTokens = 0;
      stats.todayCompletionTokens = 0;
      stats.todayCachedTokens = 0;
      stats.todayCostUSD = 0;
    }
    return stats;
  } catch {
    return createDefaultStats();
  }
}
async function recordUsage(app, usage = {}, success = true) {
  if (!app || typeof app.setSetting !== "function") return;
  const stats = getUsageStats(app);
  const promptTokens = Number(usage.prompt_tokens) || 0;
  const completionTokens = Number(usage.completion_tokens) || 0;
  const cachedTokens = Number(usage.prompt_tokens_details?.cached_tokens) || 0;
  const uncachedPromptTokens = Math.max(0, promptTokens - cachedTokens);
  const cost = uncachedPromptTokens / 1e6 * COST_INPUT_PER_M + cachedTokens / 1e6 * COST_CACHED_INPUT_PER_M + completionTokens / 1e6 * COST_OUTPUT_PER_M;
  stats.todayRequests += 1;
  stats.todayPromptTokens += promptTokens;
  stats.todayCompletionTokens += completionTokens;
  stats.todayCachedTokens += cachedTokens;
  stats.todayCostUSD = Number((stats.todayCostUSD + cost).toFixed(6));
  stats.lifetimeRequests += 1;
  stats.lifetimePromptTokens += promptTokens;
  stats.lifetimeCompletionTokens += completionTokens;
  stats.lifetimeCachedTokens += cachedTokens;
  stats.lifetimeCostUSD = Number((stats.lifetimeCostUSD + cost).toFixed(6));
  try {
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(stats));
  } catch (err) {
    console.warn("[Hemmingway] Failed to persist usage stats:", err);
  }
}
async function resetUsage(app, all = false) {
  if (!app || typeof app.setSetting !== "function") return;
  const stats = getUsageStats(app);
  if (all) {
    const fresh = createDefaultStats();
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(fresh));
  } else {
    stats.todayRequests = 0;
    stats.todayPromptTokens = 0;
    stats.todayCompletionTokens = 0;
    stats.todayCachedTokens = 0;
    stats.todayCostUSD = 0;
    await app.setSetting(SETTING_USAGE_STATS, JSON.stringify(stats));
  }
}

// anp-26-hemmingway/lib/features/workflow.js
var isReviewAllActive = false;
var isReviewAllCancelled = false;
function getEffectiveSystemPrompt(presetId, customPrompt = "") {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt.trim();
  }
  const preset = EDITORIAL_PRESETS.find((p) => p.id === presetId);
  return preset ? preset.systemPrompt : EDITORIAL_PRESETS[0].systemPrompt;
}
async function handleRunReview(app, { customPrompt = "", thinkingEffort = null } = {}) {
  const session = getActiveSession();
  if (!session) return { ok: false, error: "No active review session found." };
  const item = session.getCurrentItem();
  if (!item || !item.isInspectable) {
    return { ok: false, error: "Active item is not inspectable." };
  }
  const apiKey = app.settings?.[SETTING_API_KEY];
  const baseUrl = app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
  const effort = thinkingEffort || app.settings?.[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT;
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, error: "Please enter your Hemmingway API key in Plugin Settings." };
  }
  const client = new HemmingwayClient({ apiKey, baseUrl, model: DEFAULT_MODEL });
  const systemPrompt = getEffectiveSystemPrompt(session.presetId, customPrompt);
  try {
    const res = await client.complete({
      prompt: item.original,
      systemPrompt,
      thinkingEffort: effort
    });
    session.setItemSuggestion(item.id, res.content, res.reasoningContent);
    await recordUsage(app, res.usage, true);
    return { ok: true };
  } catch (err) {
    await recordUsage(app, {}, false);
    return { ok: false, error: err.message || String(err) };
  }
}
async function handleReviewAll(app, onProgress = null) {
  const session = getActiveSession();
  if (!session) return { ok: false, completedCount: 0, error: "No active review session." };
  if (isReviewAllActive) {
    return { ok: false, completedCount: 0, error: "Batch review is already in progress." };
  }
  const apiKey = app.settings?.[SETTING_API_KEY];
  const baseUrl = app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
  const effort = app.settings?.[SETTING_THINKING_EFFORT] || DEFAULT_THINKING_EFFORT;
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, completedCount: 0, error: "Missing Hemmingway API Key." };
  }
  const client = new HemmingwayClient({ apiKey, baseUrl, model: DEFAULT_MODEL });
  const systemPrompt = getEffectiveSystemPrompt(session.presetId);
  const pendingItems = session.items.filter((it) => it.isInspectable && it.status === "pending");
  if (pendingItems.length === 0) {
    return { ok: true, completedCount: 0, error: "No pending items to review." };
  }
  isReviewAllActive = true;
  isReviewAllCancelled = false;
  let count = 0;
  try {
    for (let i = 0; i < pendingItems.length; i++) {
      if (isReviewAllCancelled) {
        break;
      }
      const item = pendingItems[i];
      try {
        const res = await client.complete({
          prompt: item.original,
          systemPrompt,
          thinkingEffort: effort
        });
        session.setItemSuggestion(item.id, res.content, res.reasoningContent);
        await recordUsage(app, res.usage, true);
        count++;
        if (typeof onProgress === "function") {
          onProgress(count, pendingItems.length);
        }
      } catch (itemErr) {
        console.warn(`[Hemmingway] Review chunk #${item.id} failed:`, itemErr);
      }
    }
    return { ok: true, completedCount: count };
  } finally {
    isReviewAllActive = false;
    isReviewAllCancelled = false;
  }
}
function cancelReviewAll() {
  if (isReviewAllActive) {
    isReviewAllCancelled = true;
  }
}
function handleSetGranularity(app, newGranularity) {
  const session = getActiveSession();
  if (!session) return;
  const fresh = new ReviewSession({
    noteUUID: session.noteUUID,
    noteTitle: session.noteTitle,
    noteContent: session.initialContent,
    noteTags: session.noteTags,
    updatedAt: session.updatedAt,
    granularity: newGranularity,
    presetId: session.presetId
  });
  fresh.diffViewMode = session.diffViewMode;
  setActiveSession(fresh);
}

// anp-26-hemmingway/lib/features/saveHandler.js
async function handleSaveAndCommit(app, { force = false } = {}) {
  const session = getActiveSession();
  if (!session) {
    return { success: false, error: "No active review session." };
  }
  if (!force) {
    try {
      const liveNote = await app.findNote({ uuid: session.noteUUID });
      if (liveNote && liveNote.updated && session.updatedAt) {
        if (liveNote.updated > session.updatedAt + 2e3) {
          return {
            success: false,
            stale: true,
            error: "This note was modified in Amplenote while the review session was open. Overwriting may lose recent external changes. Proceed anyway?"
          };
        }
      }
    } catch (checkErr) {
      console.warn("[Hemmingway] Stale note check warning:", checkErr);
    }
  }
  const finalContent = session.getReconstructedContent();
  try {
    await app.replaceNoteContent({ uuid: session.noteUUID }, finalContent);
    clearActiveSession();
    await app.alert("Changes successfully applied to your note!");
    return { success: true };
  } catch (err) {
    const msg = `Failed to save changes: ${err.message || String(err)}`;
    await app.alert(msg);
    return { success: false, error: msg };
  }
}

// anp-26-hemmingway/lib/ui/styles.css.js
var EMBED_STYLES = `
/* CSS Reset & Variables */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Default Theme: Espresso Obsidian (Warm Dark Roasted Editorial) */
  --hm-bg-main: #141210;
  --hm-bg-sidebar: #1a1715;
  --hm-bg-card: #24201c;
  --hm-bg-card-hover: #2d2824;
  --hm-bg-input: #1a1715;
  --hm-text-main: #ede8e3;
  --hm-text-muted: #9c938a;
  --hm-border: #38322c;
  --hm-border-subtle: #292420;
  --hm-accent: #d97736;
  --hm-accent-hover: #ea8848;
  --hm-accent-rgb: 217, 119, 54;
  --hm-success: #10b981;
  --hm-success-bg: rgba(16, 185, 129, 0.15);
  --hm-danger: #ef4444;
  --hm-danger-bg: rgba(239, 68, 68, 0.15);
  --hm-info: #3b82f6;
  --hm-info-bg: rgba(59, 130, 246, 0.15);
  --hm-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --hm-radius-sm: 6px;
  --hm-radius-md: 10px;
  --hm-radius-lg: 14px;
}

/* 12 Themes */
[data-theme="midnight"] {
  --hm-bg-main: #0b0f19;
  --hm-bg-sidebar: #111827;
  --hm-bg-card: #1f2937;
  --hm-bg-card-hover: #374151;
  --hm-bg-input: #111827;
  --hm-text-main: #f3f4f6;
  --hm-text-muted: #9ca3af;
  --hm-border: #374151;
  --hm-border-subtle: #1f2937;
  --hm-accent: #3b82f6;
  --hm-accent-hover: #60a5fa;
  --hm-accent-rgb: 59, 130, 246;
}

[data-theme="nord"] {
  --hm-bg-main: #242933;
  --hm-bg-sidebar: #2e3440;
  --hm-bg-card: #3b4252;
  --hm-bg-card-hover: #434c5e;
  --hm-bg-input: #2e3440;
  --hm-text-main: #eceff4;
  --hm-text-muted: #d8dee9;
  --hm-border: #4c566a;
  --hm-border-subtle: #3b4252;
  --hm-accent: #88c0d0;
  --hm-accent-hover: #8fbcbb;
  --hm-accent-rgb: 136, 192, 208;
}

[data-theme="glass"] {
  --hm-bg-main: #0d1117;
  --hm-bg-sidebar: rgba(22, 27, 34, 0.85);
  --hm-bg-card: rgba(33, 38, 45, 0.7);
  --hm-bg-card-hover: rgba(48, 54, 61, 0.8);
  --hm-bg-input: rgba(13, 17, 23, 0.8);
  --hm-text-main: #f0f6fc;
  --hm-text-muted: #8b949e;
  --hm-border: rgba(240, 246, 252, 0.1);
  --hm-border-subtle: rgba(240, 246, 252, 0.05);
  --hm-accent: #58a6ff;
  --hm-accent-hover: #79c0ff;
  --hm-accent-rgb: 88, 166, 255;
}

[data-theme="emerald"] {
  --hm-bg-main: #061e16;
  --hm-bg-sidebar: #092c20;
  --hm-bg-card: #0e3d2d;
  --hm-bg-card-hover: #144e3a;
  --hm-bg-input: #092c20;
  --hm-text-main: #ecfdf5;
  --hm-text-muted: #a7f3d0;
  --hm-border: #144e3a;
  --hm-border-subtle: #0e3d2d;
  --hm-accent: #10b981;
  --hm-accent-hover: #34d399;
  --hm-accent-rgb: 16, 185, 129;
}

[data-theme="purple"] {
  --hm-bg-main: #130d24;
  --hm-bg-sidebar: #1d1436;
  --hm-bg-card: #2a1e4d;
  --hm-bg-card-hover: #382866;
  --hm-bg-input: #1d1436;
  --hm-text-main: #f5f3ff;
  --hm-text-muted: #c4b5fd;
  --hm-border: #44327a;
  --hm-border-subtle: #2a1e4d;
  --hm-accent: #8b5cf6;
  --hm-accent-hover: #a78bfa;
  --hm-accent-rgb: 139, 92, 246;
}

[data-theme="dracula"] {
  --hm-bg-main: #1e1f29;
  --hm-bg-sidebar: #282a36;
  --hm-bg-card: #343746;
  --hm-bg-card-hover: #44475a;
  --hm-bg-input: #282a36;
  --hm-text-main: #f8f8f2;
  --hm-text-muted: #6272a4;
  --hm-border: #44475a;
  --hm-border-subtle: #343746;
  --hm-accent: #ff79c6;
  --hm-accent-hover: #ff92d0;
  --hm-accent-rgb: 255, 121, 198;
}

/* Light Themes */
[data-theme="sepia"] {
  --hm-bg-main: #fbf7f0;
  --hm-bg-sidebar: #f4ecdf;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #fcf9f5;
  --hm-bg-input: #ffffff;
  --hm-text-main: #433422;
  --hm-text-muted: #8b7355;
  --hm-border: #e6d7c3;
  --hm-border-subtle: #f0e6d6;
  --hm-accent: #c05621;
  --hm-accent-hover: #dd6b20;
  --hm-accent-rgb: 192, 86, 33;
}

[data-theme="light"] {
  --hm-bg-main: #f8fafc;
  --hm-bg-sidebar: #f1f5f9;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f8fafc;
  --hm-bg-input: #ffffff;
  --hm-text-main: #0f172a;
  --hm-text-muted: #64748b;
  --hm-border: #cbd5e1;
  --hm-border-subtle: #e2e8f0;
  --hm-accent: #2563eb;
  --hm-accent-hover: #3b82f6;
  --hm-accent-rgb: 37, 99, 235;
}

[data-theme="sakura"] {
  --hm-bg-main: #fff5f7;
  --hm-bg-sidebar: #ffe4e9;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #fff0f3;
  --hm-bg-input: #ffffff;
  --hm-text-main: #4c1d28;
  --hm-text-muted: #9f4960;
  --hm-border: #fbcfe8;
  --hm-border-subtle: #fce7f3;
  --hm-accent: #e11d48;
  --hm-accent-hover: #f43f5e;
  --hm-accent-rgb: 225, 29, 72;
}

[data-theme="matcha"] {
  --hm-bg-main: #f4f7f4;
  --hm-bg-sidebar: #e5ece5;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f9fbf9;
  --hm-bg-input: #ffffff;
  --hm-text-main: #1f3323;
  --hm-text-muted: #526f58;
  --hm-border: #c8d8c8;
  --hm-border-subtle: #dae5da;
  --hm-accent: #2e7d32;
  --hm-accent-hover: #388e3c;
  --hm-accent-rgb: 46, 125, 50;
}

[data-theme="nord-light"] {
  --hm-bg-main: #eceff4;
  --hm-bg-sidebar: #e5e9f0;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f8f9fb;
  --hm-bg-input: #ffffff;
  --hm-text-main: #2e3440;
  --hm-text-muted: #4c566a;
  --hm-border: #d8dee9;
  --hm-border-subtle: #e5e9f0;
  --hm-accent: #5e81ac;
  --hm-accent-hover: #81a1c1;
  --hm-accent-rgb: 94, 129, 172;
}

/* Base Layout */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  background: var(--hm-bg-main);
  color: var(--hm-text-main);
  line-height: 1.5;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.hm-header {
  height: 56px;
  background: var(--hm-bg-sidebar);
  border-bottom: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.hm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hm-brand-logo {
  font-size: 20px;
  line-height: 1;
}

.hm-brand-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--hm-text-main);
  letter-spacing: -0.2px;
}

.hm-note-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: var(--hm-radius-sm);
  background: var(--hm-bg-card);
  color: var(--hm-text-muted);
  border: 1px solid var(--hm-border);
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hm-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hm-nav-tabs {
  display: flex;
  background: var(--hm-bg-card);
  padding: 3px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-nav-tab {
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hm-nav-tab.active {
  background: var(--hm-accent);
  color: #ffffff;
}

.hm-theme-select {
  background: var(--hm-bg-card);
  color: var(--hm-text-main);
  border: 1px solid var(--hm-border);
  font-size: 13px;
  padding: 5px 8px;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
  outline: none;
}

/* 2-Column Workbench Body */
.hm-workbench {
  display: flex;
  flex: 1;
  height: calc(100vh - 56px);
  overflow: hidden;
}

/* Sidebar */
.hm-sidebar {
  width: 320px;
  background: var(--hm-bg-sidebar);
  border-right: 1px solid var(--hm-border);
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.hm-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--hm-text-muted);
  margin-bottom: 6px;
}

.hm-control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hm-select, .hm-input {
  width: 100%;
  background: var(--hm-bg-input);
  color: var(--hm-text-main);
  border: 1px solid var(--hm-border);
  padding: 8px 10px;
  border-radius: var(--hm-radius-sm);
  font-size: 13px;
  outline: none;
}

.hm-select:focus, .hm-input:focus {
  border-color: var(--hm-accent);
}

.hm-preset-desc {
  font-size: 12px;
  color: var(--hm-text-muted);
  line-height: 1.4;
  background: var(--hm-bg-card);
  padding: 8px;
  border-radius: var(--hm-radius-sm);
  border-left: 3px solid var(--hm-accent);
}

/* Segmented Control */
.hm-segmented {
  display: flex;
  background: var(--hm-bg-card);
  padding: 3px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-segment-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.hm-segment-btn.active {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-main);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Action Buttons */
.hm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.hm-btn-primary {
  background: var(--hm-accent);
  color: #ffffff;
}

.hm-btn-primary:hover {
  background: var(--hm-accent-hover);
}

.hm-btn-secondary {
  background: var(--hm-bg-card);
  color: var(--hm-text-main);
  border-color: var(--hm-border);
}

.hm-btn-secondary:hover {
  background: var(--hm-bg-card-hover);
}

.hm-btn-success {
  background: var(--hm-success);
  color: #ffffff;
}

.hm-btn-danger {
  background: var(--hm-danger);
  color: #ffffff;
}

.hm-btn-full {
  width: 100%;
}

/* Progress Tracker */
.hm-progress-card {
  background: var(--hm-bg-card);
  padding: 12px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--hm-text-muted);
  margin-bottom: 6px;
}

.hm-progress-bar-bg {
  height: 6px;
  background: var(--hm-bg-sidebar);
  border-radius: 3px;
  overflow: hidden;
}

.hm-progress-bar-fill {
  height: 100%;
  background: var(--hm-accent);
  width: 0%;
  transition: width 0.3s ease;
}

/* Main Canvas */
.hm-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--hm-bg-main);
}

.hm-canvas-toolbar {
  height: 48px;
  background: var(--hm-bg-card);
  border-bottom: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.hm-view-modes {
  display: flex;
  gap: 4px;
}

.hm-view-mode-btn {
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
}

.hm-view-mode-btn.active {
  background: var(--hm-bg-sidebar);
  color: var(--hm-accent);
  font-weight: 600;
}

.hm-canvas-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Diff Panes */
.hm-diff-container {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  padding: 20px;
  min-height: 200px;
  font-size: 15px;
  line-height: 1.7;
}

.hm-clean-prose-add {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.hm-diff-del {
  background: var(--hm-danger-bg);
  color: var(--hm-danger);
  text-decoration: line-through;
  padding: 2px 4px;
  border-radius: 3px;
}

.hm-diff-ins {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 3px;
}

.hm-diff-side-by-side {
  display: flex;
  gap: 16px;
}

.hm-diff-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hm-pane-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--hm-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hm-pane-body {
  background: var(--hm-bg-sidebar);
  padding: 14px;
  border-radius: var(--hm-radius-sm);
  min-height: 150px;
  border: 1px solid var(--hm-border-subtle);
}

/* Thinking Card */
.hm-thinking-card {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  overflow: hidden;
}

.hm-thinking-details summary {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  background: var(--hm-bg-sidebar);
}

.hm-thinking-icon {
  font-size: 16px;
}

.hm-thinking-badge {
  margin-left: auto;
  font-size: 11px;
  background: var(--hm-info-bg);
  color: var(--hm-info);
  padding: 2px 6px;
  border-radius: 4px;
}

.hm-thinking-body {
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--hm-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Bottom Action Bar */
.hm-action-bar {
  height: 64px;
  background: var(--hm-bg-sidebar);
  border-top: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.hm-action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Top Operation Banner */
.hm-op-banner {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-accent);
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: var(--hm-shadow);
  display: none;
  align-items: center;
  gap: 14px;
  z-index: 1000;
  font-size: 13px;
}

.hm-op-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--hm-text-muted);
  border-top-color: var(--hm-accent);
  border-radius: 50%;
  animation: hm-spin 0.8s linear infinite;
}

@keyframes hm-spin {
  to { transform: rotate(360deg); }
}

/* Settings View */
.hm-settings-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hm-settings-card {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hm-settings-title {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hm-table th, .hm-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--hm-border);
  text-align: left;
}

/* Status Tag Badges */
.hm-status-tag {
  padding: 3px 8px;
  border-radius: var(--hm-radius-sm);
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
}
.hm-status-pending {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-muted);
  border: 1px solid var(--hm-border);
}
.hm-status-ready {
  background: var(--hm-info-bg);
  color: var(--hm-info);
  border: 1px solid var(--hm-info);
}
.hm-status-accepted {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  border: 1px solid var(--hm-success);
}
.hm-status-rejected {
  background: var(--hm-danger-bg);
  color: var(--hm-danger);
  border: 1px solid var(--hm-danger);
}
.hm-status-no_change {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-muted);
}
`;

// anp-26-hemmingway/lib/engine/diffEngine.js
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function tokenizeWords(text) {
  if (!text) return [];
  return text.match(/[\w'-]+|[^\w\s]+|\s+/g) || [];
}
function diffTokens(oldTokens, newTokens) {
  const n = oldTokens.length;
  const m = newTokens.length;
  if (n * m > 25e5) {
    return [
      { type: "del", value: oldTokens.join("") },
      { type: "add", value: newTokens.join("") }
    ];
  }
  let start = 0;
  while (start < n && start < m && oldTokens[start] === newTokens[start]) {
    start++;
  }
  let endOld = n - 1;
  let endNew = m - 1;
  while (endOld >= start && endNew >= start && oldTokens[endOld] === newTokens[endNew]) {
    endOld--;
    endNew--;
  }
  const prefix = oldTokens.slice(0, start).map((v) => ({ type: "equal", value: v }));
  const suffix = oldTokens.slice(endOld + 1).map((v) => ({ type: "equal", value: v }));
  const midOld = oldTokens.slice(start, endOld + 1);
  const midNew = newTokens.slice(start, endNew + 1);
  const midN = midOld.length;
  const midM = midNew.length;
  const dp = Array.from({ length: midN + 1 }, () => new Int32Array(midM + 1));
  for (let i2 = 1; i2 <= midN; i2++) {
    for (let j2 = 1; j2 <= midM; j2++) {
      if (midOld[i2 - 1] === midNew[j2 - 1]) {
        dp[i2][j2] = dp[i2 - 1][j2 - 1] + 1;
      } else {
        dp[i2][j2] = Math.max(dp[i2 - 1][j2], dp[i2][j2 - 1]);
      }
    }
  }
  const middle = [];
  let i = midN;
  let j = midM;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && midOld[i - 1] === midNew[j - 1]) {
      middle.push({ type: "equal", value: midOld[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      middle.push({ type: "add", value: midNew[j - 1] });
      j--;
    } else {
      middle.push({ type: "del", value: midOld[i - 1] });
      i--;
    }
  }
  middle.reverse();
  return [...prefix, ...middle, ...suffix];
}
function computeTokenDiff(oldText, newText) {
  if (oldText === newText) {
    return [{ type: "equal", value: oldText }];
  }
  const oldTokens = tokenizeWords(oldText);
  const newTokens = tokenizeWords(newText);
  return diffTokens(oldTokens, newTokens);
}
function renderCleanProse(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let html = "";
  for (const part of diffs) {
    if (part.type === "equal") {
      html += escapeHtml(part.value);
    } else if (part.type === "add") {
      html += `<span class="hm-clean-prose-add">${escapeHtml(part.value)}</span>`;
    }
  }
  return `<div class="hm-diff-clean-prose">${html.replace(/\n/g, "<br>")}</div>`;
}
function renderInlineDiff(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let html = "";
  for (const part of diffs) {
    if (part.type === "equal") {
      html += escapeHtml(part.value);
    } else if (part.type === "del") {
      html += `<del class="hm-diff-del">${escapeHtml(part.value)}</del>`;
    } else if (part.type === "add") {
      html += `<ins class="hm-diff-ins">${escapeHtml(part.value)}</ins>`;
    }
  }
  return `<div class="hm-diff-inline">${html.replace(/\n/g, "<br>")}</div>`;
}
function renderSideBySide(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let leftHtml = "";
  let rightHtml = "";
  for (const part of diffs) {
    if (part.type === "equal") {
      leftHtml += escapeHtml(part.value);
      rightHtml += escapeHtml(part.value);
    } else if (part.type === "del") {
      leftHtml += `<span class="hm-diff-del">${escapeHtml(part.value)}</span>`;
    } else if (part.type === "add") {
      rightHtml += `<span class="hm-diff-ins">${escapeHtml(part.value)}</span>`;
    }
  }
  return `
    <div class="hm-diff-side-by-side">
      <div class="hm-diff-pane hm-diff-pane-left">
        <div class="hm-pane-header">Original</div>
        <div class="hm-pane-body">${leftHtml.replace(/\n/g, "<br>")}</div>
      </div>
      <div class="hm-diff-pane hm-diff-pane-right">
        <div class="hm-pane-header">Hemmingway Polish</div>
        <div class="hm-pane-body">${rightHtml.replace(/\n/g, "<br>")}</div>
      </div>
    </div>
  `;
}
function renderChangesOnly(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  const changes = [];
  let currDel = [];
  let currAdd = [];
  function flush() {
    if (currDel.length > 0 || currAdd.length > 0) {
      changes.push({
        del: currDel.join("").trim(),
        add: currAdd.join("").trim()
      });
      currDel = [];
      currAdd = [];
    }
  }
  for (const part of diffs) {
    if (part.type === "equal") {
      flush();
    } else if (part.type === "del") {
      currDel.push(part.value);
    } else if (part.type === "add") {
      currAdd.push(part.value);
    }
  }
  flush();
  if (changes.length === 0) {
    return `<div class="hm-changes-empty">No modifications made. Text is identical.</div>`;
  }
  let html = `<div class="hm-changes-list">`;
  changes.forEach((change, idx) => {
    html += `
      <div class="hm-change-row">
        <span class="hm-change-num">#${idx + 1}</span>
        <div class="hm-change-content">
          ${change.del ? `<span class="hm-change-old"><del>${escapeHtml(change.del)}</del></span>` : ""}
          ${change.del && change.add ? `<span class="hm-change-arrow">\u2794</span>` : ""}
          ${change.add ? `<span class="hm-change-new"><ins>${escapeHtml(change.add)}</ins></span>` : ""}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

// anp-26-hemmingway/lib/ui/diffViews.js
function renderActiveDiff(item, mode = "clean") {
  if (!item) {
    return `<div class="hm-diff-empty">No items available in this review session.</div>`;
  }
  if (item.status === "pending" || !item.suggestion) {
    return `
      <div class="hm-diff-pending-state">
        <div class="hm-pending-header">Original Text (Awaiting Hemmingway Polish)</div>
        <div class="hm-pending-body">${escapeHtml(item.original).replace(/\n/g, "<br>")}</div>
        <div class="hm-pending-hint">Click <strong>Polish Current Chunk</strong> or press <strong>Enter</strong> to review.</div>
      </div>
    `;
  }
  if (item.status === "no_change") {
    return `
      <div class="hm-diff-nochange-state">
        <div class="hm-nochange-badge">\u2713 Clean & Clear \u2014 No Changes Needed</div>
        <div class="hm-nochange-body">${escapeHtml(item.original).replace(/\n/g, "<br>")}</div>
      </div>
    `;
  }
  const suggestionText = item.editedContent || item.suggestion;
  switch (mode) {
    case "clean":
      return renderCleanProse(item.original, suggestionText);
    case "inline":
      return renderInlineDiff(item.original, suggestionText);
    case "side":
      return renderSideBySide(item.original, suggestionText);
    case "changes":
      return renderChangesOnly(item.original, suggestionText);
    default:
      return renderCleanProse(item.original, suggestionText);
  }
}

// anp-26-hemmingway/lib/ui/thinkingCard.js
function renderThinkingCard(reasoning) {
  if (!reasoning || !reasoning.trim()) {
    return "";
  }
  const safeReasoning = escapeHtml(reasoning.trim()).replace(/\n/g, "<br>");
  return `
    <div class="hm-thinking-card">
      <details class="hm-thinking-details" open>
        <summary class="hm-thinking-summary">
          <span class="hm-thinking-icon">\u{1F9E0}</span>
          <span class="hm-thinking-title">Editor's Thinking & Rationale</span>
          <span class="hm-thinking-badge">Hemmingway-1</span>
        </summary>
        <div class="hm-thinking-body">
          ${safeReasoning}
        </div>
      </details>
    </div>
  `;
}

// anp-26-hemmingway/lib/ui/dashboardTemplate.js
function safeJsonEmbed(obj) {
  if (obj === null || obj === void 0) return "null";
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function renderJumpOptions(session) {
  if (!session || !session.items) {
    return `<option value="0">No inspectable items</option>`;
  }
  const inspectables = session.items.filter((it) => it.isInspectable);
  if (inspectables.length === 0) {
    return `<option value="0">No inspectable items</option>`;
  }
  const currentItem = session.getCurrentItem();
  return inspectables.map((it, idx) => {
    const isCur = it.id === currentItem?.id;
    const icon = it.status === "accepted" ? "\u2713" : it.status === "rejected" ? "\u2715" : it.status === "ready" ? "\u25CF" : "\u25CB";
    const snippet = (it.original || "").trim().substring(0, 32);
    return `<option value="${it.id}" ${isCur ? "selected" : ""}>${icon} #${idx + 1}: ${escapeHtml(snippet)}...</option>`;
  }).join("");
}
function renderCanvasHtml(session) {
  if (!session) {
    return `
      <div class="hm-canvas-scroll" style="align-items: center; justify-content: center; display: flex;">
        <div style="text-align: center; max-width: 440px; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">\u{1F58B}\uFE0F</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">No Note Selected</h2>
          <p style="font-size: 14px; color: var(--hm-text-muted); margin-bottom: 24px; line-height: 1.5;">
            Select a note from your notebook to begin polishing prose, trimming fluff, and transforming rough drafts into clean prose with Hemmingway.
          </p>
          <button class="hm-btn hm-btn-primary" style="padding: 10px 20px; font-size: 14px;" onclick="changeActiveNote()">
            \u{1F4C2} Select Note to Review
          </button>
        </div>
      </div>
    `;
  }
  const currentItem = session.getCurrentItem();
  const inspectables = session.items.filter((it) => it.isInspectable);
  const total = inspectables.length;
  const inspectableIdx = inspectables.indexOf(currentItem);
  const itemNum = inspectableIdx >= 0 ? inspectableIdx + 1 : 1;
  const mode = session.diffViewMode || "clean";
  const isReady = currentItem?.status === "ready" || currentItem?.status === "edited";
  return `
    <!-- View Modes Toolbar -->
    <div class="hm-canvas-toolbar">
      <div class="hm-view-modes">
        <button class="hm-view-mode-btn ${mode === "clean" ? "active" : ""}" onclick="setViewMode('clean')">\u2728 Clean Prose</button>
        <button class="hm-view-mode-btn ${mode === "inline" ? "active" : ""}" onclick="setViewMode('inline')">\u{1F500} Inline Diff</button>
        <button class="hm-view-mode-btn ${mode === "side" ? "active" : ""}" onclick="setViewMode('side')">\u{1F465} Side-by-Side</button>
        <button class="hm-view-mode-btn ${mode === "changes" ? "active" : ""}" onclick="setViewMode('changes')">\u{1F4CB} Changes Only</button>
      </div>
      <div style="font-size: 12px; color: var(--hm-text-muted); display: flex; align-items: center; gap: 8px;">
        <span>Item <strong>#${itemNum}</strong> of <strong>${total}</strong></span>
        <span style="font-size: 14px;">&bull;</span>
        <span>Status: <strong class="hm-status-tag hm-status-${currentItem?.status || "pending"}">${currentItem?.status || "Pending"}</strong></span>
      </div>
    </div>

    <!-- Diff Scroll Body -->
    <div class="hm-canvas-scroll">
      <div id="diff-mount-point" class="hm-diff-container">
        ${renderActiveDiff(currentItem, mode)}
      </div>

      <div id="thinking-mount-point">
        ${currentItem?.reasoning ? renderThinkingCard(currentItem.reasoning) : ""}
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <footer class="hm-action-bar">
      <div class="hm-action-group">
        <button id="btn-accept" class="hm-btn hm-btn-success" onclick="acceptCurrent()" ${isReady ? "" : "disabled style='opacity: 0.5; cursor: not-allowed;'"}>\u2713 Accept (A)</button>
        <button id="btn-reject" class="hm-btn hm-btn-secondary" onclick="rejectCurrent()">\u2715 Reject (R)</button>
        <button id="btn-undo" class="hm-btn hm-btn-secondary" onclick="undoAction()">\u21A9 Undo (U)</button>
      </div>
      <div class="hm-action-group">
        <button class="hm-btn hm-btn-secondary" onclick="navigatePrev()">\u23EE Prev (P)</button>
        <button class="hm-btn hm-btn-secondary" onclick="navigateNext()">Next (N) \u23ED</button>
        <button id="btn-apply-note" class="hm-btn hm-btn-primary" onclick="applyToNote()">\u{1F4BE} Save to Note</button>
      </div>
    </footer>
  `;
}
function buildDashboardTemplate({
  session,
  settings = {},
  usageStats = {},
  activeTab = "review",
  activeTheme = "espresso"
}) {
  const stats = session ? session.getStats() : {
    totalInspectable: 0,
    reviewed: 0,
    pending: 0,
    ready: 0,
    accepted: 0,
    rejected: 0,
    progressPercent: 0
  };
  const hasApiKey = Boolean(settings[SETTING_API_KEY] && settings[SETTING_API_KEY].trim());
  const serializedSession = safeJsonEmbed(session ? session.toJSON() : null);
  const serializedStats = safeJsonEmbed(usageStats);
  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(activeTheme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hemmingway Writing Studio</title>
  <style>
    ${EMBED_STYLES}
  </style>
</head>
<body>

  <!-- Top Operation Toast Banner -->
  <div id="hm-op-banner" class="hm-op-banner">
    <div class="hm-op-spinner"></div>
    <span id="hm-op-banner-text">Hemmingway is writing...</span>
    <button class="hm-btn hm-btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="cancelActiveOperation()">\u2715 Stop</button>
  </div>

  <!-- Header -->
  <header class="hm-header">
    <div class="hm-header-left">
      <span class="hm-brand-logo">\u{1F58B}\uFE0F</span>
      <span class="hm-brand-title">Hemmingway Studio</span>
      <span id="note-title-badge" class="hm-note-badge" title="${escapeHtml(session?.noteTitle || "No note selected")}">
        ${session?.noteTitle ? `\u{1F4C4} ${escapeHtml(session.noteTitle)}` : "\u{1F4C4} No note selected"}
      </span>
      <button class="hm-btn hm-btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="changeActiveNote()" title="Open note search picker">
        \u{1F4C2} Switch Note
      </button>
    </div>
    <div class="hm-header-right">
      <div class="hm-nav-tabs">
        <button id="tab-btn-review" class="hm-nav-tab ${activeTab === "review" ? "active" : ""}" onclick="switchTab('review')">Review</button>
        <button id="tab-btn-settings" class="hm-nav-tab ${activeTab === "settings" ? "active" : ""}" onclick="switchTab('settings')">Settings</button>
      </div>
      <select id="theme-selector" class="hm-theme-select" onchange="changeTheme(this.value)">
        ${THEMES.map((t) => `<option value="${t.id}" ${t.id === activeTheme ? "selected" : ""}>${t.icon} ${t.name}</option>`).join("")}
      </select>
    </div>
  </header>

  <!-- Main View Area -->
  <div id="view-review" class="hm-workbench" style="${activeTab === "review" ? "" : "display: none;"}">
    
    <!-- Left Sidebar Inspector -->
    <aside class="hm-sidebar">
      
      <!-- Preset Selection -->
      <div class="hm-control-group">
        <label class="hm-section-title">Editorial Preset</label>
        <select id="preset-selector" class="hm-select" onchange="onPresetChange(this.value)">
          ${EDITORIAL_PRESETS.map((p) => `
            <option value="${p.id}" ${session && session.presetId === p.id ? "selected" : ""}>
              ${p.name}
            </option>
          `).join("")}
        </select>
        <div id="preset-desc-box" class="hm-preset-desc">
          ${EDITORIAL_PRESETS.find((p) => p.id === (session?.presetId || "human_polish"))?.description || ""}
        </div>
      </div>

      <!-- Granularity Segmented Control -->
      <div class="hm-control-group">
        <label class="hm-section-title">Granularity</label>
        <div class="hm-segmented">
          <button id="seg-btn-full" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.FULL ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.FULL}')">Full Note</button>
          <button id="seg-btn-paragraph" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.PARAGRAPH ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.PARAGRAPH}')">Paragraph</button>
          <button id="seg-btn-sentence" class="hm-segment-btn ${session?.granularity === GRANULARITY_MODES.SENTENCE ? "active" : ""}" onclick="setGranularity('${GRANULARITY_MODES.SENTENCE}')">Sentence</button>
        </div>
      </div>

      <!-- Primary Action Buttons -->
      <div class="hm-control-group" style="gap: 8px;">
        <button id="btn-review-chunk" class="hm-btn hm-btn-primary hm-btn-full" onclick="reviewCurrentChunk()">
          \u2728 Polish Current Chunk
        </button>
        <button id="btn-review-all" class="hm-btn hm-btn-secondary hm-btn-full" onclick="reviewAllPending()">
          \u26A1 Transform All Pending
        </button>
      </div>

      <!-- Progress Tracking -->
      <div class="hm-progress-card">
        <div class="hm-progress-header">
          <span id="progress-label">Progress (${stats.reviewed}/${stats.totalInspectable})</span>
          <span id="progress-pct">${stats.progressPercent}%</span>
        </div>
        <div class="hm-progress-bar-bg">
          <div id="progress-bar-fill" class="hm-progress-bar-fill" style="width: ${stats.progressPercent}%;"></div>
        </div>
      </div>

      <!-- Jump to Chunk Selector -->
      <div class="hm-control-group">
        <label class="hm-section-title">Jump to Item</label>
        <select id="jump-selector" class="hm-select" onchange="jumpToItem(Number(this.value))">
          ${renderJumpOptions(session)}
        </select>
      </div>

      <!-- Power Shortcuts -->
      <div class="hm-control-group" style="margin-top: auto; font-size: 11px; color: var(--hm-text-muted);">
        <div class="hm-section-title">Shortcuts</div>
        <div><kbd>A</kbd> Accept &bull; <kbd>R</kbd> Reject &bull; <kbd>U</kbd> Undo</div>
        <div><kbd>N</kbd> / <kbd>\u2192</kbd> Next &bull; <kbd>P</kbd> / <kbd>\u2190</kbd> Prev</div>
        <div><kbd>Enter</kbd> Polish Chunk</div>
      </div>

    </aside>

    <!-- Main Canvas Mount -->
    <main id="main-canvas-mount" class="hm-canvas">
      ${renderCanvasHtml(session)}
    </main>

  </div>

  <!-- Settings View Area -->
  <div id="view-settings" class="hm-workbench" style="${activeTab === "settings" ? "" : "display: none;"}">
    <div class="hm-settings-container">
      
      <div class="hm-settings-card">
        <div class="hm-settings-title">
          <span>\u{1F511} Hemmingway API Credentials</span>
          <span id="api-status-badge" style="font-size: 12px; margin-left: auto; color: ${hasApiKey ? "var(--hm-success)" : "var(--hm-danger)"};">
            ${hasApiKey ? "\u{1F7E2} Connected" : "\u{1F534} Missing Key"}
          </span>
        </div>
        <p style="font-size: 13px; color: var(--hm-text-muted);">
          Enter your Hemmingway API key (starts with <code>hemmingway_live_</code>) to connect to <code>hemmingway-27b</code>. 
          Manage your keys at <a href="https://hemmingway.io/platform/#keys" target="_blank" style="color: var(--hm-accent);">hemmingway.io/platform/#keys</a>.
        </p>
        <div class="hm-control-group">
          <label class="hm-section-title">Hemmingway API Key</label>
          <input type="password" id="input-api-key" class="hm-input" placeholder="hemmingway_live_..." value="${escapeHtml(settings[SETTING_API_KEY] || "")}">
        </div>
        <div class="hm-control-group">
          <label class="hm-section-title">Custom Base URL (Optional)</label>
          <input type="text" id="input-base-url" class="hm-input" placeholder="https://hemmingway.io/v1" value="${escapeHtml(settings[SETTING_BASE_URL] || DEFAULT_BASE_URL)}">
        </div>
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button class="hm-btn hm-btn-primary" onclick="saveSettings()">Save Settings</button>
          <button id="btn-test-api" class="hm-btn hm-btn-secondary" onclick="testConnection()">\u26A1 Test Connection</button>
        </div>
        <div id="test-api-result" style="font-size: 13px; display: none;"></div>
      </div>

      <!-- Usage Statistics -->
      <div class="hm-settings-card">
        <div class="hm-settings-title">
          <span>\u{1F4CA} Token Usage & Cost Analytics</span>
        </div>
        <table class="hm-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Requests</th>
              <th>Prompt Tokens</th>
              <th>Completion Tokens</th>
              <th>Est. Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Today</strong></td>
              <td>${usageStats.todayRequests || 0}</td>
              <td>${usageStats.todayPromptTokens || 0}</td>
              <td>${usageStats.todayCompletionTokens || 0}</td>
              <td>$${(usageStats.todayCostUSD || 0).toFixed(4)}</td>
            </tr>
            <tr>
              <td><strong>Lifetime</strong></td>
              <td>${usageStats.lifetimeRequests || 0}</td>
              <td>${usageStats.lifetimePromptTokens || 0}</td>
              <td>${usageStats.lifetimeCompletionTokens || 0}</td>
              <td>$${(usageStats.lifetimeCostUSD || 0).toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button class="hm-btn hm-btn-secondary" style="font-size: 12px;" onclick="resetUsageStats(false)">Reset Today's Stats</button>
          <button class="hm-btn hm-btn-secondary" style="font-size: 12px;" onclick="resetUsageStats(true)">Reset All Stats</button>
        </div>
      </div>

    </div>
  </div>

  <!-- Injected Client State & Script -->
  <script>
    let currentSession = ${serializedSession};
    let currentUsage = ${serializedStats};

    function callHost(action, payload = null) {
      if (typeof window.callAmplenotePlugin === "function") {
        return window.callAmplenotePlugin(action, payload);
      }
      console.warn("callAmplenotePlugin not available in this environment.");
      return Promise.resolve(null);
    }

    function showBanner(text) {
      const b = document.getElementById("hm-op-banner");
      const t = document.getElementById("hm-op-banner-text");
      if (b && t) {
        t.textContent = text;
        b.style.display = "flex";
      }
    }

    function hideBanner() {
      const b = document.getElementById("hm-op-banner");
      if (b) b.style.display = "none";
    }

    function switchTab(tab) {
      document.getElementById("view-review").style.display = tab === "review" ? "flex" : "none";
      document.getElementById("view-settings").style.display = tab === "settings" ? "flex" : "none";
      document.getElementById("tab-btn-review").classList.toggle("active", tab === "review");
      document.getElementById("tab-btn-settings").classList.toggle("active", tab === "settings");
    }

    function changeTheme(themeId) {
      document.documentElement.setAttribute("data-theme", themeId);
      callHost("setTheme", themeId);
    }

    async function sendAction(action, payload = null) {
      const res = await callHost(action, payload);
      if (res) {
        if (res.session) {
          currentSession = res.session;
        }
        if (res.canvasHtml) {
          const mount = document.getElementById("main-canvas-mount");
          if (mount) mount.innerHTML = res.canvasHtml;
        }
        if (res.stats) {
          const pl = document.getElementById("progress-label");
          const pp = document.getElementById("progress-pct");
          const pb = document.getElementById("progress-bar-fill");
          if (pl) pl.textContent = "Progress (" + res.stats.reviewed + "/" + res.stats.totalInspectable + ")";
          if (pp) pp.textContent = res.stats.progressPercent + "%";
          if (pb) pb.style.width = res.stats.progressPercent + "%";
        }
        if (res.jumpOptionsHtml) {
          const js = document.getElementById("jump-selector");
          if (js) js.innerHTML = res.jumpOptionsHtml;
        }
        if (res.noteTitle) {
          const nb = document.getElementById("note-title-badge");
          if (nb) nb.textContent = "\u{1F4C4} " + res.noteTitle;
        }
        if (res.granularity) {
          const btns = ["full", "paragraph", "sentence"];
          btns.forEach(b => {
            const el = document.getElementById("seg-btn-" + b);
            if (el) el.classList.toggle("active", b === res.granularity);
          });
        }
      }
      return res;
    }

    async function changeActiveNote() {
      showBanner("Selecting note...");
      await sendAction("selectNote");
      hideBanner();
    }

    function onPresetChange(presetId) {
      if (currentSession) {
        currentSession.presetId = presetId;
      }
      sendAction("setPreset", presetId);
    }

    async function setGranularity(granularity) {
      showBanner("Re-tokenizing document...");
      await sendAction("setGranularity", granularity);
      hideBanner();
    }

    async function reviewCurrentChunk() {
      showBanner("Hemmingway is polishing current chunk...");
      await sendAction("reviewCurrent");
      hideBanner();
    }

    async function reviewAllPending() {
      showBanner("Hemmingway is transforming all pending chunks...");
      await sendAction("reviewAll");
      hideBanner();
    }

    function cancelActiveOperation() {
      callHost("cancelReviewAll");
      hideBanner();
    }

    async function acceptCurrent() {
      await sendAction("acceptCurrent");
    }

    async function rejectCurrent() {
      await sendAction("rejectCurrent");
    }

    async function undoAction() {
      await sendAction("undo");
    }

    async function navigateNext() {
      await sendAction("navigateNext");
    }

    async function navigatePrev() {
      await sendAction("navigatePrev");
    }

    async function jumpToItem(id) {
      await sendAction("jumpTo", id);
    }

    async function setViewMode(mode) {
      await sendAction("setViewMode", mode);
    }

    async function applyToNote() {
      showBanner("Applying changes to note...");
      await sendAction("applyToNote");
      hideBanner();
    }

    async function saveSettings() {
      const apiKey = document.getElementById("input-api-key").value;
      const baseUrl = document.getElementById("input-base-url").value;
      await callHost("saveSettings", { apiKey, baseUrl });
      const badge = document.getElementById("api-status-badge");
      if (badge) {
        const has = Boolean(apiKey && apiKey.trim());
        badge.style.color = has ? "var(--hm-success)" : "var(--hm-danger)";
        badge.textContent = has ? "\u{1F7E2} Connected" : "\u{1F534} Missing Key";
      }
    }

    async function testConnection() {
      const apiKey = document.getElementById("input-api-key").value;
      const baseUrl = document.getElementById("input-base-url").value;
      const resDiv = document.getElementById("test-api-result");
      resDiv.style.display = "block";
      resDiv.style.color = "var(--hm-text-muted)";
      resDiv.textContent = "Testing connection to Hemmingway API...";

      const res = await callHost("testConnection", { apiKey, baseUrl });
      if (res?.ok) {
        resDiv.style.color = "var(--hm-success)";
        resDiv.textContent = "\u2713 Connected successfully! Latency: " + (res.latencyMs || 0) + "ms. Model: " + (res.model || "hemmingway-27b");
      } else {
        resDiv.style.color = "var(--hm-danger)";
        resDiv.textContent = "\u2715 Error: " + (res?.error || "Connection failed.");
      }
    }

    async function resetUsageStats(all) {
      if (confirm(all ? "Reset all usage metrics?" : "Reset today's usage metrics?")) {
        await callHost("resetUsage", { all });
        location.reload();
      }
    }

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }
      const key = e.key.toUpperCase();
      if (key === "A") {
        e.preventDefault();
        acceptCurrent();
      } else if (key === "R") {
        e.preventDefault();
        rejectCurrent();
      } else if (key === "U" || (e.ctrlKey && key === "Z")) {
        e.preventDefault();
        undoAction();
      } else if (key === "N" || e.key === "ArrowRight") {
        e.preventDefault();
        navigateNext();
      } else if (key === "P" || e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        reviewCurrentChunk();
      }
    });
  </script>
</body>
</html>`;
}

// anp-26-hemmingway/lib/api/diagnostics.js
async function testHemmingwayConnection({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  model = DEFAULT_MODEL
}) {
  if (!apiKey || !apiKey.trim()) {
    return {
      ok: false,
      error: "No API key provided. Please enter a valid Hemmingway API key."
    };
  }
  const client = new HemmingwayClient({ apiKey, baseUrl, model });
  const t0 = Date.now();
  try {
    const res = await client.complete({
      prompt: "Respond with only the single word: OK",
      systemPrompt: "You are a health check diagnostic. Answer only with OK.",
      thinkingEffort: THINKING_EFFORT_MODES.OFF,
      maxTokens: 10
    });
    const latencyMs = Date.now() - t0;
    return {
      ok: true,
      latencyMs,
      model: res.model,
      sample: res.content.trim()
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err.message || String(err)
    };
  }
}

// anp-26-hemmingway/hemmingway.js
var activeTabState = "review";
var activeThemeState = "espresso";
function buildStateResponse(extra = {}) {
  const session = getActiveSession();
  if (session) {
    return {
      ok: true,
      session: session.toJSON(),
      canvasHtml: renderCanvasHtml(session),
      stats: session.getStats(),
      jumpOptionsHtml: renderJumpOptions(session),
      noteTitle: session.noteTitle,
      granularity: session.granularity,
      ...extra
    };
  }
  return {
    ok: true,
    canvasHtml: renderCanvasHtml(null),
    ...extra
  };
}
var plugin = {
  // App-level action launcher: Opens Studio in full-screen view
  appOption: {
    "Open Studio": async function(app) {
      await launchHemmingway(app);
    }
  },
  // Note-level action launcher: Opens Studio targeting active note
  noteOption: {
    "Polish with Hemmingway": async function(app, noteUUID) {
      await launchHemmingway(app, noteUUID);
    }
  },
  // Renders the full-screen interactive studio embed
  async renderEmbed(app, ...args) {
    const session = getActiveSession();
    const settings = app.settings || {};
    const usageStats = getUsageStats(app);
    return buildDashboardTemplate({
      session,
      settings,
      usageStats,
      activeTab: activeTabState,
      activeTheme: activeThemeState
    });
  },
  // Dispatches actions from client embed to host
  async onEmbedCall(app, ...args) {
    const action = args[0];
    const session = getActiveSession();
    try {
      switch (action) {
        case "selectNote": {
          await launchHemmingway(app);
          return buildStateResponse();
        }
        case "testConnection": {
          const payload = args[1] || {};
          const apiKey = payload.apiKey || app.settings?.[SETTING_API_KEY] || "";
          const baseUrl = payload.baseUrl || app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
          return await testHemmingwayConnection({ apiKey, baseUrl });
        }
        case "saveSettings": {
          const payload = args[1] || {};
          if (typeof app.setSetting === "function") {
            if (payload.apiKey !== void 0) {
              await app.setSetting(SETTING_API_KEY, payload.apiKey.trim());
            }
            if (payload.baseUrl !== void 0) {
              await app.setSetting(SETTING_BASE_URL, payload.baseUrl.trim());
            }
          }
          await app.alert("Settings saved successfully!");
          return buildStateResponse();
        }
        case "setTheme": {
          activeThemeState = args[1] || "espresso";
          return { ok: true };
        }
        case "setPreset": {
          if (session) {
            session.presetId = args[1] || "human_polish";
          }
          return buildStateResponse();
        }
        case "setGranularity": {
          handleSetGranularity(app, args[1]);
          return buildStateResponse();
        }
        case "reviewCurrent": {
          const res = await handleRunReview(app);
          if (!res.ok) {
            await app.alert(`Review Error: ${res.error}`);
          }
          return buildStateResponse({ reviewResult: res });
        }
        case "reviewAll": {
          const res = await handleReviewAll(app);
          if (!res.ok) {
            await app.alert(`Batch Review Error: ${res.error}`);
          } else {
            await app.alert(`Completed batch polish for ${res.completedCount} items!`);
          }
          return buildStateResponse({ reviewAllResult: res });
        }
        case "cancelReviewAll": {
          cancelReviewAll();
          return buildStateResponse();
        }
        case "acceptCurrent": {
          if (session) {
            const item = session.getCurrentItem();
            if (item && (item.status === "ready" || item.status === "edited")) {
              session.accept(item.id);
              session.nextPending();
            }
          }
          return buildStateResponse();
        }
        case "rejectCurrent": {
          if (session) {
            const item = session.getCurrentItem();
            if (item) {
              session.reject(item.id);
              session.nextPending();
            }
          }
          return buildStateResponse();
        }
        case "undo": {
          if (session) {
            session.undo();
          }
          return buildStateResponse();
        }
        case "navigateNext": {
          if (session) {
            session.nextItem();
          }
          return buildStateResponse();
        }
        case "navigatePrev": {
          if (session) {
            session.prevItem();
          }
          return buildStateResponse();
        }
        case "jumpTo": {
          if (session) {
            session.jumpTo(Number(args[1]));
          }
          return buildStateResponse();
        }
        case "setViewMode": {
          if (session) {
            session.diffViewMode = args[1] || "clean";
          }
          return buildStateResponse();
        }
        case "applyToNote": {
          const res = await handleSaveAndCommit(app);
          return buildStateResponse({ saveResult: res });
        }
        case "resetUsage": {
          const payload = args[1] || {};
          await resetUsage(app, Boolean(payload.all));
          return { ok: true };
        }
        default:
          return { ok: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      console.error("[Hemmingway] onEmbedCall error:", err);
      const errMsg = err?.message || String(err);
      await app.alert(`Hemmingway Error: ${errMsg}`);
      return { ok: false, error: errMsg };
    }
  }
};
var hemmingway_default = plugin;


return hemmingway_default;
})()