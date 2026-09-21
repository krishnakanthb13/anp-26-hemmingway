/**
 * @file tokenizer.test.js
 * @description Unit tests for Hemmingway markdown tokenizer.
 */

import {
  tokenizeContent,
  tokenizeParagraphs,
  tokenizeSentences,
  splitIntoSentences,
  isInspectableText
} from "../lib/engine/tokenizer.js";
import { GRANULARITY_MODES } from "../lib/constants.js";

describe("Tokenizer", () => {
  test("splits paragraphs while preserving empty line separators", () => {
    const markdown = "First paragraph text.\n\nSecond paragraph text.\n\nThird paragraph text.";
    const paras = tokenizeParagraphs(markdown);

    expect(paras.length).toBe(5); // 3 paragraphs + 2 separators
    expect(paras[0].original).toBe("First paragraph text.");
    expect(paras[0].type).toBe("paragraph");
    expect(paras[0].isInspectable).toBe(true);

    expect(paras[1].type).toBe("separator");
    expect(paras[1].isInspectable).toBe(false);

    expect(paras[2].original).toBe("Second paragraph text.");
  });

  test("protects fenced code blocks from paragraph splitting", () => {
    const markdown = "Before code.\n\n```javascript\nconst a = 1;\n\nconst b = 2;\n```\n\nAfter code.";
    const paras = tokenizeParagraphs(markdown);

    const codeChunk = paras.find(p => p.original.includes("```javascript"));
    expect(codeChunk).toBeDefined();
    expect(codeChunk.original).toContain("const b = 2;");
  });

  test("protects abbreviations and initials in sentence splitting", () => {
    const text = "Dr. Smith and John F. Kennedy went to Washington, D.C. at 3.14 PM. They loved it!";
    const sentences = splitIntoSentences(text);

    expect(sentences.length).toBe(2);
    expect(sentences[0]).toContain("Dr. Smith");
    expect(sentences[0]).toContain("D.C.");
    expect(sentences[1]).toBe("They loved it!");
  });

  test("handles full note granularity mode", () => {
    const content = "# Title\n\nSome body text.";
    const tokens = tokenizeContent(content, GRANULARITY_MODES.FULL);

    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe("full");
    expect(tokens[0].original).toBe(content);
  });
});
