/**
 * @file styles.css.js
 * @description Modern, premium CSS styles and themes for Hemmingway Writing Assistant embed.
 */

export const EMBED_STYLES = `
/* CSS Reset & Variables */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Default Theme: Espresso Obsidian (Warm Dark Roasted Editorial) */
  --hm-bg-main: #141210;
  --hm-bg-sidebar: #1a1715;
  --hm-bg-card: #24201c;
  --hm-bg-card-hover: #2d2824;
  --hm-bg-input: #1a1715;
  --hm-text-main: #ede8e3;
  --hm-text-muted: #9c938a;
  --hm-border: #38322c;
  --hm-border-subtle: #292420;
  --hm-accent: #d97736;
  --hm-accent-hover: #ea8848;
  --hm-accent-rgb: 217, 119, 54;
  --hm-success: #10b981;
  --hm-success-bg: rgba(16, 185, 129, 0.15);
  --hm-danger: #ef4444;
  --hm-danger-bg: rgba(239, 68, 68, 0.15);
  --hm-info: #3b82f6;
  --hm-info-bg: rgba(59, 130, 246, 0.15);
  --hm-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --hm-radius-sm: 6px;
  --hm-radius-md: 10px;
  --hm-radius-lg: 14px;
}

/* 12 Themes */
[data-theme="midnight"] {
  --hm-bg-main: #0b0f19;
  --hm-bg-sidebar: #111827;
  --hm-bg-card: #1f2937;
  --hm-bg-card-hover: #374151;
  --hm-bg-input: #111827;
  --hm-text-main: #f3f4f6;
  --hm-text-muted: #9ca3af;
  --hm-border: #374151;
  --hm-border-subtle: #1f2937;
  --hm-accent: #3b82f6;
  --hm-accent-hover: #60a5fa;
  --hm-accent-rgb: 59, 130, 246;
}

[data-theme="nord"] {
  --hm-bg-main: #242933;
  --hm-bg-sidebar: #2e3440;
  --hm-bg-card: #3b4252;
  --hm-bg-card-hover: #434c5e;
  --hm-bg-input: #2e3440;
  --hm-text-main: #eceff4;
  --hm-text-muted: #d8dee9;
  --hm-border: #4c566a;
  --hm-border-subtle: #3b4252;
  --hm-accent: #88c0d0;
  --hm-accent-hover: #8fbcbb;
  --hm-accent-rgb: 136, 192, 208;
}

[data-theme="glass"] {
  --hm-bg-main: #0d1117;
  --hm-bg-sidebar: rgba(22, 27, 34, 0.85);
  --hm-bg-card: rgba(33, 38, 45, 0.7);
  --hm-bg-card-hover: rgba(48, 54, 61, 0.8);
  --hm-bg-input: rgba(13, 17, 23, 0.8);
  --hm-text-main: #f0f6fc;
  --hm-text-muted: #8b949e;
  --hm-border: rgba(240, 246, 252, 0.1);
  --hm-border-subtle: rgba(240, 246, 252, 0.05);
  --hm-accent: #58a6ff;
  --hm-accent-hover: #79c0ff;
  --hm-accent-rgb: 88, 166, 255;
}

[data-theme="emerald"] {
  --hm-bg-main: #061e16;
  --hm-bg-sidebar: #092c20;
  --hm-bg-card: #0e3d2d;
  --hm-bg-card-hover: #144e3a;
  --hm-bg-input: #092c20;
  --hm-text-main: #ecfdf5;
  --hm-text-muted: #a7f3d0;
  --hm-border: #144e3a;
  --hm-border-subtle: #0e3d2d;
  --hm-accent: #10b981;
  --hm-accent-hover: #34d399;
  --hm-accent-rgb: 16, 185, 129;
}

[data-theme="purple"] {
  --hm-bg-main: #130d24;
  --hm-bg-sidebar: #1d1436;
  --hm-bg-card: #2a1e4d;
  --hm-bg-card-hover: #382866;
  --hm-bg-input: #1d1436;
  --hm-text-main: #f5f3ff;
  --hm-text-muted: #c4b5fd;
  --hm-border: #44327a;
  --hm-border-subtle: #2a1e4d;
  --hm-accent: #8b5cf6;
  --hm-accent-hover: #a78bfa;
  --hm-accent-rgb: 139, 92, 246;
}

[data-theme="dracula"] {
  --hm-bg-main: #1e1f29;
  --hm-bg-sidebar: #282a36;
  --hm-bg-card: #343746;
  --hm-bg-card-hover: #44475a;
  --hm-bg-input: #282a36;
  --hm-text-main: #f8f8f2;
  --hm-text-muted: #6272a4;
  --hm-border: #44475a;
  --hm-border-subtle: #343746;
  --hm-accent: #ff79c6;
  --hm-accent-hover: #ff92d0;
  --hm-accent-rgb: 255, 121, 198;
}

/* Light Themes */
[data-theme="sepia"] {
  --hm-bg-main: #fbf7f0;
  --hm-bg-sidebar: #f4ecdf;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #fcf9f5;
  --hm-bg-input: #ffffff;
  --hm-text-main: #433422;
  --hm-text-muted: #8b7355;
  --hm-border: #e6d7c3;
  --hm-border-subtle: #f0e6d6;
  --hm-accent: #c05621;
  --hm-accent-hover: #dd6b20;
  --hm-accent-rgb: 192, 86, 33;
}

[data-theme="light"] {
  --hm-bg-main: #f8fafc;
  --hm-bg-sidebar: #f1f5f9;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f8fafc;
  --hm-bg-input: #ffffff;
  --hm-text-main: #0f172a;
  --hm-text-muted: #64748b;
  --hm-border: #cbd5e1;
  --hm-border-subtle: #e2e8f0;
  --hm-accent: #2563eb;
  --hm-accent-hover: #3b82f6;
  --hm-accent-rgb: 37, 99, 235;
}

[data-theme="sakura"] {
  --hm-bg-main: #fff5f7;
  --hm-bg-sidebar: #ffe4e9;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #fff0f3;
  --hm-bg-input: #ffffff;
  --hm-text-main: #4c1d28;
  --hm-text-muted: #9f4960;
  --hm-border: #fbcfe8;
  --hm-border-subtle: #fce7f3;
  --hm-accent: #e11d48;
  --hm-accent-hover: #f43f5e;
  --hm-accent-rgb: 225, 29, 72;
}

[data-theme="matcha"] {
  --hm-bg-main: #f4f7f4;
  --hm-bg-sidebar: #e5ece5;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f9fbf9;
  --hm-bg-input: #ffffff;
  --hm-text-main: #1f3323;
  --hm-text-muted: #526f58;
  --hm-border: #c8d8c8;
  --hm-border-subtle: #dae5da;
  --hm-accent: #2e7d32;
  --hm-accent-hover: #388e3c;
  --hm-accent-rgb: 46, 125, 50;
}

[data-theme="nord-light"] {
  --hm-bg-main: #eceff4;
  --hm-bg-sidebar: #e5e9f0;
  --hm-bg-card: #ffffff;
  --hm-bg-card-hover: #f8f9fb;
  --hm-bg-input: #ffffff;
  --hm-text-main: #2e3440;
  --hm-text-muted: #4c566a;
  --hm-border: #d8dee9;
  --hm-border-subtle: #e5e9f0;
  --hm-accent: #5e81ac;
  --hm-accent-hover: #81a1c1;
  --hm-accent-rgb: 94, 129, 172;
}

/* Base Layout */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  background: var(--hm-bg-main);
  color: var(--hm-text-main);
  line-height: 1.5;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.hm-header {
  height: 56px;
  background: var(--hm-bg-sidebar);
  border-bottom: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.hm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hm-brand-logo {
  font-size: 20px;
  line-height: 1;
}

.hm-brand-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--hm-text-main);
  letter-spacing: -0.2px;
}

.hm-note-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: var(--hm-radius-sm);
  background: var(--hm-bg-card);
  color: var(--hm-text-muted);
  border: 1px solid var(--hm-border);
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hm-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hm-nav-tabs {
  display: flex;
  background: var(--hm-bg-card);
  padding: 3px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-nav-tab {
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hm-nav-tab.active {
  background: var(--hm-accent);
  color: #ffffff;
}

.hm-theme-select {
  background: var(--hm-bg-card);
  color: var(--hm-text-main);
  border: 1px solid var(--hm-border);
  font-size: 13px;
  padding: 5px 8px;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
  outline: none;
}

/* 2-Column Workbench Body */
.hm-workbench {
  display: flex;
  flex: 1;
  height: calc(100vh - 56px);
  overflow: hidden;
}

/* Sidebar */
.hm-sidebar {
  width: 320px;
  background: var(--hm-bg-sidebar);
  border-right: 1px solid var(--hm-border);
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.hm-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--hm-text-muted);
  margin-bottom: 6px;
}

.hm-control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hm-select, .hm-input {
  width: 100%;
  background: var(--hm-bg-input);
  color: var(--hm-text-main);
  border: 1px solid var(--hm-border);
  padding: 8px 10px;
  border-radius: var(--hm-radius-sm);
  font-size: 13px;
  outline: none;
}

.hm-select:focus, .hm-input:focus {
  border-color: var(--hm-accent);
}

.hm-preset-desc {
  font-size: 12px;
  color: var(--hm-text-muted);
  line-height: 1.4;
  background: var(--hm-bg-card);
  padding: 8px;
  border-radius: var(--hm-radius-sm);
  border-left: 3px solid var(--hm-accent);
}

/* Segmented Control */
.hm-segmented {
  display: flex;
  background: var(--hm-bg-card);
  padding: 3px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-segment-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.hm-segment-btn.active {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-main);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Action Buttons */
.hm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.hm-btn-primary {
  background: var(--hm-accent);
  color: #ffffff;
}

.hm-btn-primary:hover {
  background: var(--hm-accent-hover);
}

.hm-btn-secondary {
  background: var(--hm-bg-card);
  color: var(--hm-text-main);
  border-color: var(--hm-border);
}

.hm-btn-secondary:hover {
  background: var(--hm-bg-card-hover);
}

.hm-btn-success {
  background: var(--hm-success);
  color: #ffffff;
}

.hm-btn-danger {
  background: var(--hm-danger);
  color: #ffffff;
}

.hm-btn-full {
  width: 100%;
}

/* Progress Tracker */
.hm-progress-card {
  background: var(--hm-bg-card);
  padding: 12px;
  border-radius: var(--hm-radius-sm);
  border: 1px solid var(--hm-border);
}

.hm-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--hm-text-muted);
  margin-bottom: 6px;
}

.hm-progress-bar-bg {
  height: 6px;
  background: var(--hm-bg-sidebar);
  border-radius: 3px;
  overflow: hidden;
}

.hm-progress-bar-fill {
  height: 100%;
  background: var(--hm-accent);
  width: 0%;
  transition: width 0.3s ease;
}

/* Main Canvas */
.hm-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--hm-bg-main);
}

.hm-canvas-toolbar {
  height: 48px;
  background: var(--hm-bg-card);
  border-bottom: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.hm-view-modes {
  display: flex;
  gap: 4px;
}

.hm-view-mode-btn {
  background: transparent;
  border: none;
  color: var(--hm-text-muted);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
}

.hm-view-mode-btn.active {
  background: var(--hm-bg-sidebar);
  color: var(--hm-accent);
  font-weight: 600;
}

.hm-canvas-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Diff Panes */
.hm-diff-container {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  padding: 20px;
  min-height: 200px;
  font-size: 15px;
  line-height: 1.7;
}

.hm-clean-prose-add {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.hm-diff-del {
  background: var(--hm-danger-bg);
  color: var(--hm-danger);
  text-decoration: line-through;
  padding: 2px 4px;
  border-radius: 3px;
}

.hm-diff-ins {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 3px;
}

.hm-diff-side-by-side {
  display: flex;
  gap: 16px;
}

.hm-diff-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hm-pane-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--hm-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hm-pane-body {
  background: var(--hm-bg-sidebar);
  padding: 14px;
  border-radius: var(--hm-radius-sm);
  min-height: 150px;
  border: 1px solid var(--hm-border-subtle);
}

/* Thinking Card */
.hm-thinking-card {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  overflow: hidden;
}

.hm-thinking-details summary {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  background: var(--hm-bg-sidebar);
}

.hm-thinking-icon {
  font-size: 16px;
}

.hm-thinking-badge {
  margin-left: auto;
  font-size: 11px;
  background: var(--hm-info-bg);
  color: var(--hm-info);
  padding: 2px 6px;
  border-radius: 4px;
}

.hm-thinking-body {
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--hm-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Bottom Action Bar */
.hm-action-bar {
  height: 64px;
  background: var(--hm-bg-sidebar);
  border-top: 1px solid var(--hm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.hm-action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Top Operation Banner */
.hm-op-banner {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-accent);
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: var(--hm-shadow);
  display: none;
  align-items: center;
  gap: 14px;
  z-index: 1000;
  font-size: 13px;
}

.hm-op-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--hm-text-muted);
  border-top-color: var(--hm-accent);
  border-radius: 50%;
  animation: hm-spin 0.8s linear infinite;
}

@keyframes hm-spin {
  to { transform: rotate(360deg); }
}

/* Settings View */
.hm-settings-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hm-settings-card {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hm-settings-title {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hm-table th, .hm-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--hm-border);
  text-align: left;
}

/* Status Tag Badges */
.hm-status-tag {
  padding: 3px 8px;
  border-radius: var(--hm-radius-sm);
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
}
.hm-status-pending {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-muted);
  border: 1px solid var(--hm-border);
}
.hm-status-ready {
  background: var(--hm-info-bg);
  color: var(--hm-info);
  border: 1px solid var(--hm-info);
}
.hm-status-accepted {
  background: var(--hm-success-bg);
  color: var(--hm-success);
  border: 1px solid var(--hm-success);
}
.hm-status-rejected {
  background: var(--hm-danger-bg);
  color: var(--hm-danger);
  border: 1px solid var(--hm-danger);
}
.hm-status-edited {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid #f59e0b;
}
.hm-status-no_change {
  background: var(--hm-bg-sidebar);
  color: var(--hm-text-muted);
}

/* Universal Sandboxed-Safe In-DOM Modal */
.hm-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: hmFadeIn 0.15s ease-out;
}
@keyframes hmFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hm-modal-box {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  animation: hmModalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.hm-modal-box.hm-modal-large {
  max-width: 840px;
  max-height: 88vh;
}

.hm-modal-box.enlarged {
  max-width: calc(100vw - 36px) !important;
  width: calc(100vw - 36px) !important;
  max-height: calc(100vh - 36px) !important;
  height: calc(100vh - 36px) !important;
  border-radius: var(--hm-radius-sm);
}

@keyframes hmModalSlideUp {
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.hm-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--hm-border);
  background: var(--hm-bg-sidebar);
}

.hm-modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--hm-text-main);
  margin: 0;
}

.hm-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-modal-enlarge-btn, .hm-modal-close {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  color: var(--hm-text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: var(--hm-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.hm-modal-enlarge-btn:hover, .hm-modal-close:hover {
  color: var(--hm-text-main);
  border-color: var(--hm-accent);
}

.hm-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.hm-modal-message {
  font-size: 13.5px;
  color: var(--hm-text-muted);
  line-height: 1.5;
  margin-bottom: 14px;
}

.hm-modal-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--hm-bg-input);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-sm);
  color: var(--hm-text-main);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.hm-modal-input:focus {
  border-color: var(--hm-accent);
}

.hm-modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--hm-border);
  background: var(--hm-bg-sidebar);
}

/* Radio choice list inside modal */
.hm-modal-radio-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hm-modal-radio-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: var(--hm-bg-sidebar);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.hm-modal-radio-item:hover {
  border-color: var(--hm-accent);
}

.hm-modal-radio-item.selected {
  border-color: var(--hm-accent);
  background: rgba(var(--hm-accent-rgb), 0.1);
}

/* Top Progress Loader */
.hm-top-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 10000;
  display: none;
  overflow: hidden;
}

.hm-top-loader-bar {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--hm-accent), var(--hm-success));
  transform-origin: left;
  animation: hmLoaderAnim 1.2s infinite ease-in-out;
}

@keyframes hmLoaderAnim {
  0% { transform: scaleX(0.1) translateX(-10%); }
  50% { transform: scaleX(0.7) translateX(30%); }
  100% { transform: scaleX(0.2) translateX(500%); }
}

/* Badges & Pills */
.hm-change-count-pill {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  background: var(--hm-bg-sidebar);
  color: var(--hm-accent);
  border: 1px solid var(--hm-border);
}

.hm-word-count-badge {
  font-size: 11.5px;
  color: var(--hm-text-muted);
  font-family: ui-monospace, monospace;
  display: flex;
  gap: 12px;
}

/* History view styles */
.hm-history-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hm-history-card {
  background: var(--hm-bg-card);
  border: 1px solid var(--hm-border);
  border-radius: var(--hm-radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.hm-history-card:hover {
  border-color: var(--hm-accent);
  transform: translateY(-1px);
}

.hm-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hm-history-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--hm-text-main);
  text-decoration: none;
}

.hm-history-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--hm-text-muted);
}
`;
