/* ──────────────────────────────────────────────────────────────
   Content Script — injected into LinkedIn / Facebook / Instagram
   • Detects text selection
   • Shows a floating action button (FAB)
   • Saves selection to storage + signals background to open popup
   ────────────────────────────────────────────────────────────── */

import type { Platform } from '../shared/types';

// ── Constants ─────────────────────────────────────────────────
const FAB_ID = '__ai_comment_fab__';
const MIN_SELECTION_LENGTH = 10; // ignore very short selections
let fabElement: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

// ── Platform detection ────────────────────────────────────────
function detectPlatform(): Platform {
  const host = location.hostname;
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('facebook.com') || host.includes('fb.com'))
    return 'facebook';
  if (host.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

// ── Floating Action Button ────────────────────────────────────
function createFab(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = FAB_ID;

  // Inline styles to avoid conflicts with host-page CSS
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '2147483647',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    boxShadow: '0 4px 14px rgba(99,102,241,.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform .15s ease, opacity .15s ease',
    opacity: '0',
    transform: 'scale(0.7)',
    pointerEvents: 'none',
    userSelect: 'none',
    border: 'none',
  } as CSSStyleDeclaration);

  // Spark ✦ icon (SVG inline)
  el.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 8v0m-3.5 3h7" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="8" r="0.5" fill="white"/>
    </svg>`;

  // Hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.12)';
    el.style.boxShadow = '0 6px 20px rgba(99,102,241,.55)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
    el.style.boxShadow = '0 4px 14px rgba(99,102,241,.45)';
  });

  document.body.appendChild(el);
  return el;
}

function showFab(x: number, y: number): void {
  if (!fabElement) fabElement = createFab();

  // Clear any pending hide
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // Position relative to viewport (fixed positioning)
  const fabSize = 42;
  const margin = 8;
  let left = x + margin;
  let top = y - fabSize - margin;

  // Keep within viewport
  if (left + fabSize > window.innerWidth) left = window.innerWidth - fabSize - margin;
  if (top < margin) top = y + margin;
  if (left < margin) left = margin;

  Object.assign(fabElement.style, {
    left: `${left}px`,
    top: `${top}px`,
    opacity: '1',
    transform: 'scale(1)',
    pointerEvents: 'auto',
  });
}

function hideFab(): void {
  if (!fabElement) return;
  Object.assign(fabElement.style, {
    opacity: '0',
    transform: 'scale(0.7)',
    pointerEvents: 'none',
  });
}

// ── Selection handler ─────────────────────────────────────────
function handleSelectionChange(e: MouseEvent): void {
  // Small delay to let the browser finalize the selection
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';

    if (text.length < MIN_SELECTION_LENGTH) {
      hideFab();
      return;
    }

    showFab(e.clientX, e.clientY);
  }, 10);
}

// ── FAB click → save selection + open popup ───────────────────
function handleFabClick(): void {
  const sel = window.getSelection();
  const text = sel?.toString().trim() ?? '';
  if (!text) return;

  const platform = detectPlatform();

  // Persist to storage so the popup can read it
  chrome.storage.local.set({
    selection: { text, platform },
  });

  // Ask the background to open a popup window
  chrome.runtime.sendMessage({ action: 'OPEN_POPUP' });

  hideFab();
}

// ── Listen for messages from popup (e.g. insert comment) ──────
chrome.runtime.onMessage.addListener(
  (message: { action: string; text?: string }) => {
    if (message.action === 'INSERT_COMMENT' && message.text) {
      insertComment(message.text);
    }
  },
);

/** Try to insert text into the active comment box on the page. */
function insertComment(text: string): void {
  // Platform-specific selectors for comment input fields
  const selectors: string[] = [
    // LinkedIn
    '.comments-comment-texteditor .ql-editor',
    'div.ql-editor[contenteditable="true"]',
    // Facebook
    'div[contenteditable="true"][role="textbox"][aria-label*="comment" i]',
    'div[contenteditable="true"][role="textbox"]',
    // Instagram
    'textarea[aria-label*="comment" i]',
    // Generic fallbacks
    'textarea[placeholder*="comment" i]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) continue;

    if (el instanceof HTMLTextAreaElement) {
      el.focus();
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      el.focus();
      el.innerText = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  // Fallback: copy to clipboard
  navigator.clipboard.writeText(text).catch(() => {});
}

// ── Bootstrap ─────────────────────────────────────────────────
function init(): void {
  // Create the FAB (hidden initially)
  fabElement = createFab();

  // Click handler on the FAB
  fabElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFabClick();
  });

  // Detect text selection via mouseup
  document.addEventListener('mouseup', handleSelectionChange, true);

  // Hide FAB when user clicks elsewhere or scrolls
  document.addEventListener(
    'mousedown',
    (e) => {
      if (fabElement && e.target !== fabElement && !fabElement.contains(e.target as Node)) {
        hideTimeout = setTimeout(hideFab, 200);
      }
    },
    true,
  );

  window.addEventListener('scroll', () => hideFab(), { passive: true });

  console.log('[AI Comment Generator] Content script loaded on', detectPlatform());
}

init();
