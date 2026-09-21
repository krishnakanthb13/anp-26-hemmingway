/**
 * @file saveHandler.js
 * @description Writes accepted and edited content back to the Amplenote source note,
 * protected by a Stale Note Overwrite Guard.
 */

import { getActiveSession, clearActiveSession } from "../data/store.js";

/**
 * Commits approved changes to the active note.
 * @param {Object} app
 * @param {Object} [options]
 * @param {boolean} [options.force=false]
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function handleSaveAndCommit(app, { force = false } = {}) {
  const session = getActiveSession();
  if (!session) {
    return { success: false, error: "No active review session." };
  }

  // Stale note check: check if the note was edited outside this session
  if (!force) {
    try {
      const liveNote = await app.findNote({ uuid: session.noteUUID });
      if (liveNote && liveNote.updated && session.updatedAt) {
        // If note was updated more than 2 seconds after our session started
        if (liveNote.updated > session.updatedAt + 2000) {
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
