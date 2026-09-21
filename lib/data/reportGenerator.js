/**
 * @file reportGenerator.js
 * @description Generates human-readable Markdown changes reports for Hemmingway sessions.
 */

import { TAG_HEMMINGWAY_CHANGES } from "../constants.js";
import { getSafeMarkdownFence } from "./historyManager.js";

/**
 * Generates human-readable Markdown for the Changes companion report note.
 * 
 * @param {object} params
 * @param {import("../engine/reviewSession.js").ReviewSession} params.session
 * @param {string} params.sourceNoteTitle
 * @param {string} params.sourceNoteUUID
 * @param {string} params.finalContent
 * @returns {{ name: string, tags: string[], content: string }}
 */
export function generateChangesReport({ session, sourceNoteTitle, sourceNoteUUID, finalContent }) {
  const now = new Date();
  const dateStr = now.toISOString().replace("T", " ").substring(0, 16);
  const fullDateStr = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  const stats = session.getStats();
  const titleName = sourceNoteTitle || "Untitled Note";

  const sourceLink = sourceNoteUUID
    ? `[${titleName}](https://www.amplenote.com/notes/${sourceNoteUUID})`
    : titleName;

  const promptName = session.customPrompt
    ? `Custom: "${session.customPrompt}"`
    : `Preset: ${session.presetId.replace(/_/g, " ")}`;

  const fence = getSafeMarkdownFence(session.initialContent || "");

  const md = `# 📝 Hemmingway Polish Changes: ${titleName}

> **Source Note:** ${sourceLink}  
> **Review Date:** ${fullDateStr}  
> **Model:** \`hemmingway-27b\` · **Granularity:** \`${session.granularity.toUpperCase()}\`  
> **Style:** *${promptName}*  
> **Results:** **${stats.accepted}** accepted, **${stats.edited}** edited, **${stats.rejected}** kept original (out of ${stats.totalInspectable} items)

---

## 📊 Itemized Changes

${generateItemChangesTable(session.items)}

---

## 📄 Complete Revised Document

${finalContent}

---

## 📜 Original Document Snapshot

<details>
<summary>Click to view original text before Hemmingway review</summary>

${fence}markdown
${session.initialContent}
${fence}

</details>

---
*Generated automatically by Amplenote Hemmingway Writing Assistant*
`;

  return {
    name: `Hemmingway Changes: ${titleName} (${dateStr})`,
    tags: [TAG_HEMMINGWAY_CHANGES],
    content: md
  };
}

/**
 * Generates an itemized markdown list of changes made.
 * @param {Array} items
 * @returns {string}
 */
function generateItemChangesTable(items) {
  const inspectableItems = items.filter(i => i.isInspectable);
  if (inspectableItems.length === 0) {
    return "*No inspectable items in this review pass.*";
  }

  const changeBlocks = inspectableItems.map((item, idx) => {
    let statusBadge = "❌ Kept Original";
    let appliedText = item.original;

    if (item.status === "accepted") {
      statusBadge = "✅ Accepted";
      appliedText = item.suggestion || item.original;
    } else if (item.status === "edited") {
      statusBadge = "✏️ Manually Edited";
      appliedText = item.editedContent || item.suggestion || item.original;
    } else if (item.status === "no_change") {
      statusBadge = "✓ Clean / No Changes";
    }

    return `### Item #${idx + 1} (${statusBadge} · *${item.type}*)
- **Original Draft:**  
  ${item.original}
- **Hemmingway Suggestion:**  
  ${appliedText}
${item.reasoning ? `- **Hemmingway-1 Reasoning:**  \n  > ${item.reasoning.replace(/\n/g, "\n  > ")}` : ""}
`;
  });

  return changeBlocks.join("\n---\n\n");
}
