/**
 * @file historyViewer.js
 * @description Loads and parses past Hemmingway history logs and reports from Amplenote.
 */

import { TAG_HEMMINGWAY_HISTORY, TAG_HEMMINGWAY_CHANGES } from "../constants.js";
import { parseHistoryNotes } from "../data/historyManager.js";

/**
 * Loads and returns all past Hemmingway review history logs.
 * @param {object} app
 * @returns {Promise<Array<object>>}
 */
export async function loadHistoryRecords(app) {
  try {
    const noteMap = new Map();

    const historyQueries = [
      { tag: TAG_HEMMINGWAY_HISTORY },
      { tag: "reports/hemmingway/history" },
      { query: "tag:-reports/-hemmingway/-history" },
      { query: "Hemmingway Review History Record" }
    ];

    for (const q of historyQueries) {
      try {
        const found = await app.filterNotes(q);
        if (Array.isArray(found)) {
          for (const n of found) {
            if (n && n.uuid && !noteMap.has(n.uuid)) {
              noteMap.set(n.uuid, n);
            }
          }
        }
      } catch {
        // Continue with next filter query
      }
    }

    // If zero history notes were found, fallback to changes companion notes
    if (noteMap.size === 0) {
      const fallbackQueries = [
        { tag: TAG_HEMMINGWAY_CHANGES },
        { tag: "reports/hemmingway/changes" },
        { query: "tag:-reports/-hemmingway/-changes" },
        { query: "Hemmingway Polish Changes" }
      ];

      for (const q of fallbackQueries) {
        try {
          const found = await app.filterNotes(q);
          if (Array.isArray(found)) {
            for (const n of found) {
              if (n && n.uuid && !noteMap.has(n.uuid)) {
                noteMap.set(n.uuid, n);
              }
            }
          }
        } catch {
          // Continue
        }
      }
    }

    if (noteMap.size === 0) {
      return [];
    }

    // Fetch content of each note (up to 40 most recent)
    const populatedNotes = [];
    const notesArray = Array.from(noteMap.values()).slice(0, 40);

    for (const n of notesArray) {
      try {
        const body = await app.getNoteContent({ uuid: n.uuid });
        populatedNotes.push({
          uuid: n.uuid,
          name: n.name,
          body
        });
      } catch {
        populatedNotes.push({
          uuid: n.uuid,
          name: n.name,
          body: ""
        });
      }
    }

    return parseHistoryNotes(populatedNotes);
  } catch (err) {
    console.error("[Hemmingway] Error loading history records:", err);
    return [];
  }
}
