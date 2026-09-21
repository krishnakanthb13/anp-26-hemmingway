/**
 * @file store.js
 * @description In-memory store for active Hemmingway review session.
 */

let activeSession = null;

/**
 * Gets the current active ReviewSession instance.
 * @returns {import("../engine/reviewSession.js").ReviewSession|null}
 */
export function getActiveSession() {
  return activeSession;
}

/**
 * Sets the current active ReviewSession instance.
 * @param {import("../engine/reviewSession.js").ReviewSession} session
 */
export function setActiveSession(session) {
  activeSession = session;
}

/**
 * Clears the active review session.
 */
export function clearActiveSession() {
  activeSession = null;
}
