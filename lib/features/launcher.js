/**
 * @file launcher.js
 * @description Handles note selection, session initialization, and opening the Hemmingway Studio embed.
 */

import { ReviewSession } from "../engine/reviewSession.js";
import { setActiveSession } from "../data/store.js";
import { GRANULARITY_MODES } from "../constants.js";

/**
 * Launches the Hemmingway review interface for a note.
 * @param {Object} app - Amplenote app object
 * @param {string} [targetNoteUUID] - UUID of the target note (optional, prompts if omitted)
 */
export async function launchHemmingway(app, targetNoteUUID = null) {
  let noteUUID = targetNoteUUID;
  let noteTitle = "Untitled Note";

  // If no noteUUID provided, prompt the user with Amplenote's native note search picker
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

  // Create new session
  const session = new ReviewSession({
    noteUUID: note.uuid,
    noteTitle: note.name || "Untitled Note",
    noteContent: content,
    noteTags: note.tags || [],
    updatedAt: note.updated || Date.now(),
    granularity: GRANULARITY_MODES.PARAGRAPH
  });

  setActiveSession(session);

  // Open the dashboard embed
  if (typeof app.openEmbed === "function") {
    await app.openEmbed();
  }

  // Navigate to full-screen plugin page
  const pluginUUID = app.context?.pluginUUID || app.pluginUUID;
  if (pluginUUID && typeof app.navigate === "function") {
    await app.navigate(`https://www.amplenote.com/notes/plugins/${pluginUUID}`);
  }
}
