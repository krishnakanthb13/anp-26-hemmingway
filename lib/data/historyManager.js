/**
 * @file historyManager.js
 * @description Generates and parses machine-readable JSON history logs and companion audit notes
 * for Hemmingway writing assistant sessions.
 */

import { TAG_HEMMINGWAY_HISTORY } from "../constants.js";

/**
 * Generates a markdown code fence delimiter longer than any backtick run inside content.
 * @param {string} content
 * @returns {string}
 */
export function getSafeMarkdownFence(content = "") {
  if (typeof content !== "string") return "```";
  const matches = content.match(/`{3,}/g) || [];
  let maxLen = 2;
  for (const m of matches) {
    if (m.length > maxLen) maxLen = m.length;
  }
  return "`".repeat(maxLen + 1);
}

/**
 * Generates machine-readable JSON history note data for Hemmingway review sessions.
 * 
 * @param {object} params
 * @param {import("../engine/reviewSession.js").ReviewSession} params.session
 * @param {string} params.sourceNoteTitle
 * @param {string} params.sourceNoteUUID
 * @param {string} params.finalContent
 * @returns {{ name: string, tags: string[], content: string }}
 */
export function generateHistoryRecord({ session, sourceNoteTitle, sourceNoteUUID, finalContent }) {
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  const dateStr = now.toISOString().replace("T", " ").substring(0, 16);
  const fullDateStr = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  const stats = session.getStats();
  const titleName = sourceNoteTitle || "Untitled Note";

  const sourceLink = sourceNoteUUID
    ? `[${titleName}](https://www.amplenote.com/notes/${sourceNoteUUID})`
    : titleName;

  const record = {
    schemaVersion: 1,
    timestamp,
    isoDate: now.toISOString(),
    sourceNote: {
      uuid: sourceNoteUUID,
      title: titleName
    },
    session: {
      presetId: session.presetId,
      customPrompt: session.customPrompt || "",
      granularity: session.granularity,
      stats
    },
    items: session.items.map(item => ({
      id: item.id,
      original: item.original,
      type: item.type,
      status: item.status,
      suggestion: item.suggestion,
      reasoning: item.reasoning,
      editedContent: item.editedContent
    })),
    originalContent: session.initialContent,
    finalContent
  };

  const jsonPayload = JSON.stringify(record, null, 2);
  const fence = getSafeMarkdownFence(jsonPayload);

  const markdownContent = `# 📜 Hemmingway Review History: ${titleName}

> **Source Note:** ${sourceLink}  
> **Timestamp:** ${fullDateStr}  
> **Model:** \`hemmingway-27b\` · Preset: \`${session.presetId}\`  
> **Changes:** **${stats.accepted}** accepted, **${stats.edited}** edited, **${stats.rejected}** rejected (out of ${stats.totalInspectable} items)

---

## 💾 Audit Log Payload

${fence}json
${jsonPayload}
${fence}
`;

  return {
    name: `Hemmingway History: ${titleName} (${dateStr})`,
    tags: [TAG_HEMMINGWAY_HISTORY],
    content: markdownContent
  };
}

/**
 * Parses history records from Amplenote notes tagged with -reports/-hemmingway/-history.
 * @param {Array<{ uuid: string, name: string, body?: string, content?: string }>} notes
 * @returns {Array<object>}
 */
export function parseHistoryNotes(notes = []) {
  if (!Array.isArray(notes)) return [];

  const jsonRecords = [];
  const fallbackRecords = [];
  const knownTimestamps = new Set();
  const knownSourceNoteTimestamps = new Set();

  for (const note of notes) {
    if (!note || typeof note !== "object") continue;
    const raw = note.body || note.content || "";
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        const ts = parsed.timestamp || parseInt(note.name, 10) || 0;
        const key = `${parsed.sourceNote?.uuid || ""}_${Math.floor(ts / 60)}`;
        knownTimestamps.add(ts);
        knownSourceNoteTimestamps.add(key);

        jsonRecords.push({
          noteUUID: note.uuid,
          noteName: note.name,
          ...parsed,
          timestamp: ts
        });
      } catch (err) {
        console.warn("[Hemmingway] Could not parse history record for note:", note.uuid, err);
      }
    } else if (raw && (raw.includes("Hemmingway Review") || raw.includes("Hemmingway Changes") || raw.includes("Hemmingway History"))) {
      // Fallback parser for human-readable markdown notes
      const titleMatch = raw.match(/# (?:(?:📝|📜) )?(?:Hemmingway (?:Polish|Review) )?(?:Changes|Report)?(?:\s*:\s*|\s+)(.*)/i) ||
                         raw.match(/Source Note:\s*\[([^\]]+)\]/i);
      const uuidMatch = raw.match(/amplenote\.com\/notes\/([a-zA-Z0-9_-]+)/i);
      const dateMatch = raw.match(/\*\*Date:\*\*\s*(.*)/i) || raw.match(/\*\*Review Date:\*\*\s*(.*)/i) || raw.match(/Timestamp:\s*(.*)/i);
      const changesMatch = raw.match(/(\d+)\s*(?:accepted|changes?|items?)/i);
      const ts = parseInt(note.name, 10) || (dateMatch ? Math.floor(new Date(dateMatch[1]).getTime() / 1000) : 0);

      fallbackRecords.push({
        noteUUID: note.uuid,
        noteName: note.name,
        timestamp: ts || Math.floor(Date.now() / 1000),
        isoDate: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
        sourceNote: {
          uuid: uuidMatch ? uuidMatch[1] : note.uuid,
          title: titleMatch ? titleMatch[1].trim() : (note.name || "Hemmingway Review")
        },
        session: {
          presetId: "human_polish",
          granularity: "paragraph",
          stats: { accepted: changesMatch ? parseInt(changesMatch[1], 10) : 1 }
        }
      });
    }
  }

  const finalRecords = [...jsonRecords];
  for (const fb of fallbackRecords) {
    const key = `${fb.sourceNote?.uuid || ""}_${Math.floor(fb.timestamp / 60)}`;
    if (!knownTimestamps.has(fb.timestamp) && !knownSourceNoteTimestamps.has(key)) {
      finalRecords.push(fb);
    }
  }

  return finalRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
