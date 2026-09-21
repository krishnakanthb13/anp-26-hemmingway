/**
 * @file saveHandler.js
 * @description Writes accepted and edited content back to the Amplenote source note,
 * protected by a Stale Note Overwrite Guard, with optional companion report and history generation.
 */

import { getActiveSession } from "../data/store.js";
import { generateChangesReport } from "../data/reportGenerator.js";
import { generateHistoryRecord } from "../data/historyManager.js";

/**
 * Commits approved changes to the active note.
 * @param {Object} app
 * @param {boolean} [createAuditNotes=false] - Whether to generate companion report & history notes
 * @returns {Promise<{ success: boolean, cancelled?: boolean, changesNoteUUID?: string, historyNoteUUID?: string, error?: string }>}
 */
export async function handleSaveAndCommit(app, createAuditNotes = false) {
  const session = getActiveSession();
  if (!session) {
    return { success: false, error: "No active review session." };
  }

  const noteUUID = session.noteUUID;
  if (!noteUUID || typeof noteUUID !== "string") {
    return { success: false, error: "Target note UUID is missing or invalid." };
  }

  const finalContent = session.getReconstructedContent();

  // 1. Guard against stale note overwriting
  if (typeof app.getNoteContent === "function") {
    try {
      const currentContent = await app.getNoteContent({ uuid: noteUUID });
      if (currentContent && session.initialContent) {
        const normCurrent = currentContent.replace(/\r\n/g, "\n").trim();
        const normOriginal = session.initialContent.replace(/\r\n/g, "\n").trim();
        if (normCurrent !== normOriginal && typeof app.prompt === "function") {
          try {
            const proceed = await app.prompt("Warning: Note Modified Externally", {
              inputs: [
                {
                  label: "The source note was modified outside Hemmingway. Overwrite with reviewed version?",
                  type: "checkbox",
                  value: true
                }
              ]
            });
            if (proceed !== null && proceed !== undefined) {
              const isConfirmed = typeof proceed === "object"
                ? Boolean(proceed["The source note was modified outside Hemmingway. Overwrite with reviewed version?"] ?? proceed[0])
                : Boolean(proceed);
              if (!isConfirmed) {
                return { success: false, cancelled: true };
              }
            }
          } catch {
            // Prompt unavailable in sandboxed embed -> proceed with direct user save
          }
        }
      }
    } catch (checkErr) {
      console.warn("[Hemmingway] Stale note check warning:", checkErr);
    }
  }

  // 2. Primary Save: Rewrite source note
  try {
    await app.replaceNoteContent({ uuid: noteUUID }, finalContent);
  } catch (err) {
    const msg = `Failed to save changes: ${err?.message || String(err)}`;
    return { success: false, error: msg };
  }

  let changesNoteUUID = null;
  let historyNoteUUID = null;

  // 3. Only generate companion audit notes if explicitly enabled
  if (createAuditNotes) {
    try {
      const changesReport = generateChangesReport({
        session,
        sourceNoteTitle: session.noteTitle,
        sourceNoteUUID: session.noteUUID,
        finalContent
      });

      changesNoteUUID = await app.createNote(changesReport.name, changesReport.tags);
      if (changesNoteUUID) {
        await app.insertNoteContent({ uuid: changesNoteUUID }, changesReport.content);
      }
    } catch (e) {
      console.warn("[Hemmingway] Could not create changes report note:", e);
    }

    try {
      const historyRecord = generateHistoryRecord({
        session,
        sourceNoteTitle: session.noteTitle,
        sourceNoteUUID: session.noteUUID,
        finalContent
      });

      historyNoteUUID = await app.createNote(historyRecord.name, historyRecord.tags);
      if (historyNoteUUID) {
        await app.insertNoteContent({ uuid: historyNoteUUID }, historyRecord.content);
      }
    } catch (e) {
      console.warn("[Hemmingway] Could not create history record note:", e);
    }
  }

  return {
    success: true,
    noteUUID: session.noteUUID,
    noteTitle: session.noteTitle,
    changesNoteUUID,
    historyNoteUUID
  };
}
