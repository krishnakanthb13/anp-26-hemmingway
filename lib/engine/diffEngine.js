/**
 * @file diffEngine.js
 * @description Computes word-level diffs and renders 4 distinct view modes:
 * Clean Prose, Inline Diff, Side-by-Side, and Changes Only.
 */

/**
 * Escapes HTML characters for safe rendering in embeds.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Splits text into words and punctuation tokens for granular diffing.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeWords(text) {
  if (!text) return [];
  return text.match(/[\w'-]+|[^\w\s]+|\s+/g) || [];
}

/**
 * Computes Myers-style or LCS diff between two token arrays.
 * Memory-bounded to prevent OOM on massive documents.
 * @param {string[]} oldTokens
 * @param {string[]} newTokens
 * @returns {Array<{ type: 'equal'|'add'|'del', value: string }>}
 */
export function diffTokens(oldTokens, newTokens) {
  const n = oldTokens.length;
  const m = newTokens.length;

  // Safeguard: if either side is too large for simple LCS matrix (> 2500 tokens), fallback to simple block diff
  if (n * m > 2500000) {
    return [
      { type: "del", value: oldTokens.join("") },
      { type: "add", value: newTokens.join("") }
    ];
  }

  // Fast prefix match
  let start = 0;
  while (start < n && start < m && oldTokens[start] === newTokens[start]) {
    start++;
  }

  // Fast suffix match
  let endOld = n - 1;
  let endNew = m - 1;
  while (endOld >= start && endNew >= start && oldTokens[endOld] === newTokens[endNew]) {
    endOld--;
    endNew--;
  }

  const prefix = oldTokens.slice(0, start).map(v => ({ type: "equal", value: v }));
  const suffix = oldTokens.slice(endOld + 1).map(v => ({ type: "equal", value: v }));

  const midOld = oldTokens.slice(start, endOld + 1);
  const midNew = newTokens.slice(start, endNew + 1);

  const midN = midOld.length;
  const midM = midNew.length;

  // Standard LCS on the differing middle section
  const dp = Array.from({ length: midN + 1 }, () => new Int32Array(midM + 1));

  for (let i = 1; i <= midN; i++) {
    for (let j = 1; j <= midM; j++) {
      if (midOld[i - 1] === midNew[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const middle = [];
  let i = midN;
  let j = midM;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && midOld[i - 1] === midNew[j - 1]) {
      middle.push({ type: "equal", value: midOld[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      middle.push({ type: "add", value: midNew[j - 1] });
      j--;
    } else {
      middle.push({ type: "del", value: midOld[i - 1] });
      i--;
    }
  }

  middle.reverse();
  return [...prefix, ...middle, ...suffix];
}

/**
 * Computes word-level diff between original and suggested text.
 * @param {string} oldText
 * @param {string} newText
 * @returns {Array<{ type: 'equal'|'add'|'del', value: string }>}
 */
export function computeTokenDiff(oldText, newText) {
  if (oldText === newText) {
    return [{ type: "equal", value: oldText }];
  }
  const oldTokens = tokenizeWords(oldText);
  const newTokens = tokenizeWords(newText);
  return diffTokens(oldTokens, newTokens);
}

/**
 * Mode 1: Clean Prose
 * Displays the rewritten text smoothly, with improved words highlighted in subtle emerald green.
 * @param {string} oldText
 * @param {string} newText
 * @returns {string} HTML
 */
export function renderCleanProse(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let html = "";

  for (const part of diffs) {
    if (part.type === "equal") {
      html += escapeHtml(part.value);
    } else if (part.type === "add") {
      html += `<span class="hm-clean-prose-add">${escapeHtml(part.value)}</span>`;
    }
    // "del" is omitted in clean prose to show clean readable result
  }

  return `<div class="hm-diff-clean-prose">${html.replace(/\n/g, "<br>")}</div>`;
}

/**
 * Mode 2: Inline Diff
 * Displays unified text with deleted words struck through (<del>) and new words highlighted (<ins>).
 * @param {string} oldText
 * @param {string} newText
 * @returns {string} HTML
 */
export function renderInlineDiff(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let html = "";

  for (const part of diffs) {
    if (part.type === "equal") {
      html += escapeHtml(part.value);
    } else if (part.type === "del") {
      html += `<del class="hm-diff-del">${escapeHtml(part.value)}</del>`;
    } else if (part.type === "add") {
      html += `<ins class="hm-diff-ins">${escapeHtml(part.value)}</ins>`;
    }
  }

  return `<div class="hm-diff-inline">${html.replace(/\n/g, "<br>")}</div>`;
}

/**
 * Mode 3: Side-by-Side Diff
 * Displays original text on the left and suggested text on the right.
 * @param {string} oldText
 * @param {string} newText
 * @returns {string} HTML
 */
export function renderSideBySide(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  let leftHtml = "";
  let rightHtml = "";

  for (const part of diffs) {
    if (part.type === "equal") {
      leftHtml += escapeHtml(part.value);
      rightHtml += escapeHtml(part.value);
    } else if (part.type === "del") {
      leftHtml += `<span class="hm-diff-del">${escapeHtml(part.value)}</span>`;
    } else if (part.type === "add") {
      rightHtml += `<span class="hm-diff-ins">${escapeHtml(part.value)}</span>`;
    }
  }

  return `
    <div class="hm-diff-side-by-side">
      <div class="hm-diff-pane hm-diff-pane-left">
        <div class="hm-pane-header">Original</div>
        <div class="hm-pane-body">${leftHtml.replace(/\n/g, "<br>")}</div>
      </div>
      <div class="hm-diff-pane hm-diff-pane-right">
        <div class="hm-pane-header">Hemmingway Polish</div>
        <div class="hm-pane-body">${rightHtml.replace(/\n/g, "<br>")}</div>
      </div>
    </div>
  `;
}

/**
 * Mode 4: Changes Only
 * Filters out identical text and presents only distinct changes.
 * @param {string} oldText
 * @param {string} newText
 * @returns {string} HTML
 */
export function renderChangesOnly(oldText, newText) {
  const diffs = computeTokenDiff(oldText, newText);
  const changes = [];
  let currDel = [];
  let currAdd = [];

  function flush() {
    if (currDel.length > 0 || currAdd.length > 0) {
      changes.push({
        del: currDel.join("").trim(),
        add: currAdd.join("").trim()
      });
      currDel = [];
      currAdd = [];
    }
  }

  for (const part of diffs) {
    if (part.type === "equal") {
      flush();
    } else if (part.type === "del") {
      currDel.push(part.value);
    } else if (part.type === "add") {
      currAdd.push(part.value);
    }
  }
  flush();

  if (changes.length === 0) {
    return `<div class="hm-changes-empty">No modifications made. Text is identical.</div>`;
  }

  let html = `<div class="hm-changes-list">`;
  changes.forEach((change, idx) => {
    html += `
      <div class="hm-change-row">
        <span class="hm-change-num">#${idx + 1}</span>
        <div class="hm-change-content">
          ${change.del ? `<span class="hm-change-old"><del>${escapeHtml(change.del)}</del></span>` : ""}
          ${change.del && change.add ? `<span class="hm-change-arrow">➔</span>` : ""}
          ${change.add ? `<span class="hm-change-new"><ins>${escapeHtml(change.add)}</ins></span>` : ""}
        </div>
      </div>
    `;
  });
  html += `</div>`;

  return html;
}
