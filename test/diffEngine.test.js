/**
 * @file diffEngine.test.js
 * @description Unit tests for Hemmingway diff computation and rendering formats.
 */

import {
  computeTokenDiff,
  renderCleanProse,
  renderInlineDiff,
  renderSideBySide,
  renderChangesOnly,
  escapeHtml
} from "../lib/engine/diffEngine.js";

describe("Diff Engine", () => {
  test("computes word-level diff correctly", () => {
    const oldText = "The quick brown fox jumps.";
    const newText = "The fast brown fox leaped.";
    const diff = computeTokenDiff(oldText, newText);

    const dels = diff.filter(d => d.type === "del").map(d => d.value);
    const adds = diff.filter(d => d.type === "add").map(d => d.value);

    expect(dels).toContain("quick");
    expect(adds).toContain("fast");
    expect(dels).toContain("jumps");
    expect(adds).toContain("leaped");
  });

  test("renderCleanProse highlights only additions and keeps equal text", () => {
    const oldText = "I very quickly ran.";
    const newText = "I sprinted.";
    const html = renderCleanProse(oldText, newText);

    expect(html).toContain("hm-clean-prose-add");
    expect(html).toContain("sprinted");
    expect(html).not.toContain("quickly"); // Deleted text is hidden in clean prose
  });

  test("renderInlineDiff includes <del> and <ins>", () => {
    const oldText = "Old phrase.";
    const newText = "New phrase.";
    const html = renderInlineDiff(oldText, newText);

    expect(html).toContain("<del class=\"hm-diff-del\">Old</del>");
    expect(html).toContain("<ins class=\"hm-diff-ins\">New</ins>");
  });

  test("renderChangesOnly outputs structured changes list", () => {
    const oldText = "He was walking slowly.";
    const newText = "He strolled.";
    const html = renderChangesOnly(oldText, newText);

    expect(html).toContain("hm-change-row");
    expect(html).toContain("walking slowly");
    expect(html).toContain("strolled");
  });

  test("renderSideBySide outputs dual panes with synchronized scroll ids", () => {
    const oldText = "The initial draft.";
    const newText = "The final polish.";
    const html = renderSideBySide(oldText, newText);

    expect(html).toContain('id="original-pane"');
    expect(html).toContain('id="suggestion-pane"');
    expect(html).toContain("hm-diff-side-by-side");
  });

  test("escapeHtml sanitizes script tags and quotes", () => {
    const unsafe = `<script>alert("XSS & 'bad'")</script>`;
    const safe = escapeHtml(unsafe);

    expect(safe).not.toContain("<script>");
    expect(safe).toContain("&lt;script&gt;");
    expect(safe).toContain("&amp;");
  });
});
