/**
 * @file tokenizer.js
 * @description Markdown-aware text tokenizer for Hemmingway writing assistant.
 * Supports Full Note, Section/Paragraph, and Sentence granularities while strictly
 * preserving paragraph spacing, code fences, blockquotes, and lists.
 */

import { GRANULARITY_MODES } from "../constants.js";

/**
 * Tokenizes markdown text based on selected granularity while respecting formatting boundaries.
 * @param {string} text - Raw note markdown content.
 * @param {string} [mode="paragraph"] - "full" | "paragraph" | "sentence"
 * @returns {Array<{ id: number, original: string, type: string, isInspectable: boolean, parentParagraphId?: number, isLastInParagraph?: boolean }>}
 */
export function tokenizeContent(text, mode = GRANULARITY_MODES.PARAGRAPH) {
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

/**
 * Splits text into paragraphs, preserving code blocks, blockquotes, and tables intact.
 * @param {string} text
 * @returns {Array<{ id: number, original: string, type: string, isInspectable: boolean, parentParagraphId: number, isLastInParagraph: boolean }>}
 */
export function tokenizeParagraphs(text) {
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

    // Blank line indicates paragraph separator
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
      // Blank separator preserved as non-inspectable separator chunk
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

/**
 * Splits text into sentences, preserving Markdown headers, lists, code fences, and abbreviations.
 * @param {string} text
 * @returns {Array<{ id: number, original: string, type: string, isInspectable: boolean, parentParagraphId: number, isLastInParagraph: boolean }>}
 */
export function tokenizeSentences(text) {
  const paragraphs = tokenizeParagraphs(text);
  const items = [];
  let idCounter = 1;

  for (const para of paragraphs) {
    // Preserve separators, headings, and code blocks intact without sentence splitting
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

const ABBREVIATIONS_PATTERN = /\b(e\.g\.|i\.e\.|etc\.|mr\.|mrs\.|ms\.|dr\.|prof\.|sr\.|jr\.|inc\.|ltd\.|co\.|corp\.|u\.s\.|u\.k\.|u\.n\.|e\.u\.|ph\.d\.|m\.d\.|b\.a\.|m\.a\.|b\.s\.|m\.s\.|vs\.|fig\.|no\.|dept\.|est\.|approx\.|jan\.|feb\.|mar\.|apr\.|jun\.|jul\.|aug\.|sep\.|sept\.|oct\.|nov\.|dec\.|al\.|st\.|ave\.|rd\.|blvd\.)/gi;

/**
 * Sentence splitter that protects abbreviations, decimals, URLs, and ellipses.
 * @param {string} text
 * @returns {string[]}
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return [];

  const protectedText = text
    .replace(ABBREVIATIONS_PATTERN, (match) => match.replace(/\./g, "§DOT§"))
    .replace(/\.{3,}/g, (match) => match.replace(/\./g, "§DOT§"))
    .replace(/\b([A-Z])\./g, "$1§DOT§")
    .replace(/(\d+)\.(\d+)/g, "$1§DOT§$2")
    .replace(/(https?:\/\/[^\s]+)/g, (match) => match.replace(/\./g, "§DOT§"));

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

/**
 * Determines if text contains substantive prose for review.
 * @param {string} text
 * @returns {boolean}
 */
export function isInspectableText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) return false;
  if (/^[-*_]{3,}$/.test(trimmed)) return false;
  return trimmed.length > 2;
}
