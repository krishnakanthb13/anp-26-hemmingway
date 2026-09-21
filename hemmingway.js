/**
 * @file hemmingway.js
 * @description Main entry point for the Amplenote Hemmingway Writing Assistant Plugin.
 * Integrates hemmingway-27b for natural, human prose editing, zero-flicker review workbench,
 * and OpenAI-compatible completions.
 */

import { getActiveSession, setActiveSession, clearActiveSession } from "./lib/data/store.js";
import { launchHemmingway } from "./lib/features/launcher.js";
import { handleRunReview, handleReviewAll, cancelReviewAll, handleSetGranularity } from "./lib/features/workflow.js";
import { handleSaveAndCommit } from "./lib/features/saveHandler.js";
import { buildDashboardTemplate, renderCanvasHtml, renderJumpOptions } from "./lib/ui/dashboardTemplate.js";
import { testHemmingwayConnection } from "./lib/api/diagnostics.js";
import { getUsageStats, resetUsage } from "./lib/data/usageTracker.js";
import {
  SETTING_API_KEY,
  SETTING_BASE_URL,
  DEFAULT_BASE_URL
} from "./lib/constants.js";

let activeTabState = "review";
let activeThemeState = "espresso";

/**
 * Builds standard response payload returning updated UI state to the client.
 */
function buildStateResponse(extra = {}) {
  const session = getActiveSession();
  if (session) {
    return {
      ok: true,
      session: session.toJSON(),
      canvasHtml: renderCanvasHtml(session),
      stats: session.getStats(),
      jumpOptionsHtml: renderJumpOptions(session),
      noteTitle: session.noteTitle,
      granularity: session.granularity,
      ...extra
    };
  }
  return {
    ok: true,
    canvasHtml: renderCanvasHtml(null),
    ...extra
  };
}

const plugin = {
  // App-level action launcher: Opens Studio in full-screen view
  appOption: {
    "Open Studio": async function(app) {
      await launchHemmingway(app);
    }
  },

  // Note-level action launcher: Opens Studio targeting active note
  noteOption: {
    "Polish with Hemmingway": async function(app, noteUUID) {
      await launchHemmingway(app, noteUUID);
    }
  },

  // Renders the full-screen interactive studio embed
  async renderEmbed(app, ...args) {
    const session = getActiveSession();
    const settings = app.settings || {};
    const usageStats = getUsageStats(app);

    return buildDashboardTemplate({
      session,
      settings,
      usageStats,
      activeTab: activeTabState,
      activeTheme: activeThemeState
    });
  },

  // Dispatches actions from client embed to host
  async onEmbedCall(app, ...args) {
    const action = args[0];
    const session = getActiveSession();

    try {
      switch (action) {
        case "selectNote": {
          await launchHemmingway(app);
          return buildStateResponse();
        }

        case "testConnection": {
          const payload = args[1] || {};
          const apiKey = payload.apiKey || app.settings?.[SETTING_API_KEY] || "";
          const baseUrl = payload.baseUrl || app.settings?.[SETTING_BASE_URL] || DEFAULT_BASE_URL;
          return await testHemmingwayConnection({ apiKey, baseUrl });
        }

        case "saveSettings": {
          const payload = args[1] || {};
          if (typeof app.setSetting === "function") {
            if (payload.apiKey !== undefined) {
              await app.setSetting(SETTING_API_KEY, payload.apiKey.trim());
            }
            if (payload.baseUrl !== undefined) {
              await app.setSetting(SETTING_BASE_URL, payload.baseUrl.trim());
            }
          }
          await app.alert("Settings saved successfully!");
          return buildStateResponse();
        }

        case "setTheme": {
          activeThemeState = args[1] || "espresso";
          return { ok: true };
        }

        case "setPreset": {
          if (session) {
            session.presetId = args[1] || "human_polish";
          }
          return buildStateResponse();
        }

        case "setGranularity": {
          handleSetGranularity(app, args[1]);
          return buildStateResponse();
        }

        case "reviewCurrent": {
          const res = await handleRunReview(app);
          if (!res.ok) {
            await app.alert(`Review Error: ${res.error}`);
          }
          return buildStateResponse({ reviewResult: res });
        }

        case "reviewAll": {
          const res = await handleReviewAll(app);
          if (!res.ok) {
            await app.alert(`Batch Review Error: ${res.error}`);
          } else {
            await app.alert(`Completed batch polish for ${res.completedCount} items!`);
          }
          return buildStateResponse({ reviewAllResult: res });
        }

        case "cancelReviewAll": {
          cancelReviewAll();
          return buildStateResponse();
        }

        case "acceptCurrent": {
          if (session) {
            const item = session.getCurrentItem();
            if (item && (item.status === "ready" || item.status === "edited")) {
              session.accept(item.id);
              session.nextPending();
            }
          }
          return buildStateResponse();
        }

        case "rejectCurrent": {
          if (session) {
            const item = session.getCurrentItem();
            if (item) {
              session.reject(item.id);
              session.nextPending();
            }
          }
          return buildStateResponse();
        }

        case "undo": {
          if (session) {
            session.undo();
          }
          return buildStateResponse();
        }

        case "navigateNext": {
          if (session) {
            session.nextItem();
          }
          return buildStateResponse();
        }

        case "navigatePrev": {
          if (session) {
            session.prevItem();
          }
          return buildStateResponse();
        }

        case "jumpTo": {
          if (session) {
            session.jumpTo(Number(args[1]));
          }
          return buildStateResponse();
        }

        case "setViewMode": {
          if (session) {
            session.diffViewMode = args[1] || "clean";
          }
          return buildStateResponse();
        }

        case "applyToNote": {
          const res = await handleSaveAndCommit(app);
          return buildStateResponse({ saveResult: res });
        }

        case "resetUsage": {
          const payload = args[1] || {};
          await resetUsage(app, Boolean(payload.all));
          return { ok: true };
        }

        default:
          return { ok: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      console.error("[Hemmingway] onEmbedCall error:", err);
      const errMsg = err?.message || String(err);
      await app.alert(`Hemmingway Error: ${errMsg}`);
      return { ok: false, error: errMsg };
    }
  }
};

export default plugin;
