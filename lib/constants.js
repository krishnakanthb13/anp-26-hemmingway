/**
 * @file constants.js
 * @description Constants, presets, and configuration for the Amplenote Hemmingway Writing Assistant plugin.
 */

export const PLUGIN_NAME = "Hemmingway Writing Assistant";
export const PLUGIN_VERSION = "1.0.0";

// Amplenote Settings Keys
export const SETTING_API_KEY = "Hemmingway API Key";
export const SETTING_THINKING_EFFORT = "Thinking Effort";
export const SETTING_BASE_URL = "Custom Base URL";
export const SETTING_USAGE_STATS = "Hemmingway Usage Stats";

// Amplenote Tag Constants for Reports & Audit Logs
export const TAG_HEMMINGWAY_HISTORY = "-reports/-hemmingway/-history";
export const TAG_HEMMINGWAY_CHANGES = "-reports/-hemmingway/-changes";

// Default API Config
export const DEFAULT_BASE_URL = "https://hemmingway.io/v1";
export const DEFAULT_MODEL = "hemmingway-27b";

// Thinking Configuration
export const THINKING_EFFORT_MODES = {
  XHIGH: "xhigh",
  MEDIUM: "medium",
  LOW: "low",
  OFF: "off"
};
export const DEFAULT_THINKING_EFFORT = THINKING_EFFORT_MODES.MEDIUM;

// Review Granularity Modes
export const GRANULARITY_MODES = {
  FULL: "full",
  PARAGRAPH: "paragraph",
  SENTENCE: "sentence"
};

// Supported Themes (12 diverse Light & Dark palettes)
export const THEMES = [
  { id: "espresso", name: "Espresso Obsidian", icon: "☕", type: "dark" },
  { id: "midnight", name: "Midnight Slate", icon: "🌌", type: "dark" },
  { id: "nord", name: "Nord Arctic", icon: "❄️", type: "dark" },
  { id: "glass", name: "Glassmorphism", icon: "✨", type: "dark" },
  { id: "emerald", name: "Emerald Forest", icon: "🌲", type: "dark" },
  { id: "purple", name: "Cyber Violet", icon: "💜", type: "dark" },
  { id: "dracula", name: "Dracula Neo", icon: "🧛", type: "dark" },
  { id: "sepia", name: "Sepia Parchment", icon: "📜", type: "light" },
  { id: "light", name: "Clean Daylight", icon: "☀️", type: "light" },
  { id: "sakura", name: "Sakura Blossom", icon: "🌸", type: "light" },
  { id: "matcha", name: "Matcha Latte", icon: "🍵", type: "light" },
  { id: "nord-light", name: "Nord Frost", icon: "🧊", type: "light" }
];

// Hemmingway Specialized Pre-built Editorial Presets
export const EDITORIAL_PRESETS = [
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
    name: "Rough Notes ➔ Polished Prose",
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

// Quick Re-Review Options
export const RE_REVIEW_REASONS = [
  { id: "more_human", label: "Make it sound even more human", prompt: "The suggestion still feels slightly artificial. Rewrite to sound more conversational, direct, and naturally human." },
  { id: "shorter_punchier", label: "Cut more fluff (Make punchier)", prompt: "Make this even more concise and punchy. Cut 20-30% of unnecessary words without losing meaning." },
  { id: "preserve_voice", label: "Keep closer to my original phrasing", prompt: "This strayed too far from my style. Keep closer to my original phrasing and tone while polishing only awkward parts." },
  { id: "grammar_only", label: "Fix grammar only (No rewrites)", prompt: "Make minimal changes: correct grammar, punctuation, and spelling only. Do not rewrite sentences." },
  { id: "custom", label: "Custom instruction...", prompt: "" }
];
