/* ──────────────────────────────────────────────────────────────
   Content Script — injected into LinkedIn

   Features:
   1. ✦ Button injected into every comment bar
   2. Floating action button on text selection
   3. Inline panel UI rendered in-page below the comment bar
   4. Full generate → edit → copy → insert flow without popup window
   ────────────────────────────────────────────────────────────── */

import type { Platform, Tone, ProviderId, CommentTemplate, ProviderConfig } from '../shared/types';
import { TONES, PROVIDER_META } from '../shared/types';
import { DEFAULT_TEMPLATES } from '../shared/defaultTemplates';
import { buildPrompt } from '../shared/promptBuilder';

// ══════════════════════════════════════════════════════════════
//  Constants & State
// ══════════════════════════════════════════════════════════════
const PANEL_ATTR   = 'data-ai-comment-panel';
const BTN_ATTR     = 'data-ai-comment-btn';
const FAB_ID       = '__ai_comment_fab__';
const MIN_SEL_LEN  = 10;
const SCAN_INTERVAL = 2500;

let fabElement: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let activePanelHost: HTMLElement | null = null;

// ══════════════════════════════════════════════════════════════
//  Platform detection
// ══════════════════════════════════════════════════════════════
function detectPlatform(): Platform {
  return 'linkedin';
}

// ══════════════════════════════════════════════════════════════
//  Post-text extraction (walk up from a comment bar to the post)
// ══════════════════════════════════════════════════════════════
function extractPostText(commentBar: HTMLElement): string {
  const post =
    commentBar.closest('.feed-shared-update-v2') ??
    commentBar.closest('[data-urn]') ??
    commentBar.closest('.occludable-update');
  if (post) {
    const desc =
      post.querySelector('.feed-shared-update-v2__description') ??
      post.querySelector('.feed-shared-text') ??
      post.querySelector('.update-components-text') ??
      post.querySelector('[dir="ltr"] span[dir="ltr"]') ??
      post.querySelector('.break-words');
    if (desc) return (desc as HTMLElement).innerText.trim();
  }

  // Fallback: walk up to find a container with meaningful text
  let el: HTMLElement | null = commentBar;
  let attempts = 0;
  while (el && attempts < 15) {
    el = el.parentElement;
    attempts++;
    if (!el) break;

    if (el.innerText && el.innerText.length > 80) {
      const paragraphs = el.querySelectorAll('p, span[dir], div[dir]');
      for (const p of paragraphs) {
        const t = (p as HTMLElement).innerText.trim();
        if (t.length > 40) return t;
      }
    }
  }
  return '';
}

// ══════════════════════════════════════════════════════════════
//  Comment-bar selectors per platform
// ══════════════════════════════════════════════════════════════
function getCommentBarSelectors(): string[] {
  return [
    '.comments-comment-box',
    '.comments-comment-texteditor',
    'form.comments-comment-box__form',
    '.comment-box',
  ];
}

// ══════════════════════════════════════════════════════════════
//  Inject ✦ button into a comment bar
// ══════════════════════════════════════════════════════════════
function injectCommentBarButton(bar: HTMLElement): void {
  if (bar.querySelector(`[${BTN_ATTR}]`)) return;

  const btn = document.createElement('button');
  btn.setAttribute(BTN_ATTR, 'true');
  btn.title = 'Generate AI comment';
  btn.type = 'button';

  Object.assign(btn.style, {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '5px',
    height:         '32px',
    padding:        '0 12px',
    margin:         '4px 6px',
    border:         'none',
    borderRadius:   '16px',
    background:     'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color:          '#fff',
    fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize:       '12px',
    fontWeight:     '600',
    cursor:         'pointer',
    whiteSpace:     'nowrap',
    boxShadow:      '0 2px 6px rgba(99,102,241,.3)',
    transition:     'transform .12s ease, box-shadow .12s ease',
    flexShrink:     '0',
    zIndex:         '10',
    lineHeight:     '1',
    verticalAlign:  'middle',
    position:       'relative',
  });

  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>AI Comment</span>`;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 4px 12px rgba(99,102,241,.4)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 2px 6px rgba(99,102,241,.3)';
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const postText = extractPostText(bar);
    openInlinePanel(bar, postText);
  });

  // Find best insertion point
  const platform = detectPlatform();
  if (platform === 'linkedin') {
    const submitArea =
      bar.querySelector('.comments-comment-box__submit-button--cr') ??
      bar.querySelector('button[type="submit"]') ??
      bar.querySelector('.display-flex');
    if (submitArea && submitArea.parentElement) {
      submitArea.parentElement.insertBefore(btn, submitArea);
      return;
    }
  }

  bar.appendChild(btn);
}

// ══════════════════════════════════════════════════════════════
//  Scan page for comment bars and inject buttons
// ══════════════════════════════════════════════════════════════
function scanAndInjectButtons(): void {
  const selectors = getCommentBarSelectors();
  for (const sel of selectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach((bar) => {
      injectCommentBarButton(bar);
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  Inline Panel — full UI rendered inside the page
// ══════════════════════════════════════════════════════════════
async function openInlinePanel(anchor: HTMLElement, postText: string): Promise<void> {
  closeInlinePanel();

  const platform = detectPlatform();

  const stored = await chrome.storage.local.get([
    'templates', 'providerConfigs', 'settings',
  ]);

  const templates: CommentTemplate[] =
    (stored.templates && stored.templates.length > 0) ? stored.templates : DEFAULT_TEMPLATES;

  const providerConfigs: Record<ProviderId, ProviderConfig> = stored.providerConfigs ?? {
    gemini:     { apiKey: '', model: PROVIDER_META.gemini.defaultModel },
    openrouter: { apiKey: '', model: PROVIDER_META.openrouter.defaultModel },
  };

  const settings = stored.settings ?? { defaultTone: 'professional', defaultProvider: 'gemini' };

  // State
  let selectedText  = postText;
  let tone: Tone    = settings.defaultTone;
  let templateId    = templates[0]?.id ?? 'supportive';
  let providerId: ProviderId = settings.defaultProvider;
  let generatedComment = '';
  let isGenerating  = false;
  let errorMsg      = '';

  // Shadow host
  const host = document.createElement('div');
  host.setAttribute(PANEL_ATTR, 'true');
  Object.assign(host.style, {
    width:     '100%',
    margin:    '8px 0 4px 0',
    display:   'block',
    zIndex:    '999999',
    position:  'relative',
  });

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = getInlinePanelCSS();
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'aicg-panel';
  shadow.appendChild(panel);

  // Render function
  function render() {
    const hasKey = !!providerConfigs[providerId]?.apiKey;

    panel.innerHTML = `
      <div class="aicg-header">
        <div class="aicg-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          AI Comment Generator
        </div>
        <button class="aicg-close" title="Close">&times;</button>
      </div>

      <div class="aicg-body">
        <div class="aicg-badge">${platformLabel(platform)}</div>

        <label class="aicg-label">Post Text</label>
        <textarea class="aicg-textarea aicg-input-text" rows="3" placeholder="Paste or auto-detected post text…">${escHtml(selectedText)}</textarea>

        <div class="aicg-row">
          <div class="aicg-field">
            <label class="aicg-label">Template</label>
            <select class="aicg-select aicg-sel-template">
              ${templates.map(t => `<option value="${t.id}" ${t.id === templateId ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="aicg-field">
            <label class="aicg-label">Tone</label>
            <select class="aicg-select aicg-sel-tone">
              ${TONES.map(t => `<option value="${t.value}" ${t.value === tone ? 'selected' : ''}>${t.emoji} ${t.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="aicg-row">
          <div class="aicg-field" style="flex:1">
            <label class="aicg-label">AI Provider</label>
            <select class="aicg-select aicg-sel-provider">
              ${Object.values(PROVIDER_META).map(p => `<option value="${p.id}" ${p.id === providerId ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="aicg-key-status" style="padding-top:20px;">
            ${hasKey
              ? '<span class="aicg-key-ok">✓ Key set</span>'
              : '<span class="aicg-key-missing">⚠ No API key — set in extension popup ⚙️</span>'}
          </div>
        </div>

        <button class="aicg-generate-btn" ${isGenerating || !hasKey || !selectedText.trim() ? 'disabled' : ''}>
          ${isGenerating
            ? '<span class="aicg-spinner"></span> Generating…'
            : '✦ Generate Comment'}
        </button>

        ${errorMsg ? `<div class="aicg-error"><span>⚠️</span><p>${escHtml(errorMsg)}</p></div>` : ''}

        ${generatedComment ? `
          <div class="aicg-output">
            <div class="aicg-output-header">
              <span>✅ Generated Comment</span>
              <div class="aicg-output-actions">
                <button class="aicg-btn-insert" title="Insert into comment box">📥 Insert</button>
                <button class="aicg-btn-copy" title="Copy to clipboard">📋 Copy</button>
              </div>
            </div>
            <textarea class="aicg-textarea aicg-output-text" rows="3">${escHtml(generatedComment)}</textarea>
          </div>
        ` : ''}
      </div>
    `;

    // Wire events
    shadow.querySelector('.aicg-close')?.addEventListener('click', closeInlinePanel);

    shadow.querySelector('.aicg-input-text')?.addEventListener('input', (e) => {
      selectedText = (e.target as HTMLTextAreaElement).value;
    });

    shadow.querySelector('.aicg-sel-template')?.addEventListener('change', (e) => {
      templateId = (e.target as HTMLSelectElement).value;
    });

    shadow.querySelector('.aicg-sel-tone')?.addEventListener('change', (e) => {
      tone = (e.target as HTMLSelectElement).value as Tone;
    });

    shadow.querySelector('.aicg-sel-provider')?.addEventListener('change', (e) => {
      providerId = (e.target as HTMLSelectElement).value as ProviderId;
      render();
    });

    shadow.querySelector('.aicg-generate-btn')?.addEventListener('click', handleGenerate);
    shadow.querySelector('.aicg-btn-copy')?.addEventListener('click', handleCopy);
    shadow.querySelector('.aicg-btn-insert')?.addEventListener('click', handleInsert);

    shadow.querySelector('.aicg-output-text')?.addEventListener('input', (e) => {
      generatedComment = (e.target as HTMLTextAreaElement).value;
    });
  }

  // Generate handler
  async function handleGenerate() {
    const template = templates.find(t => t.id === templateId);
    if (!template || !selectedText.trim()) return;

    isGenerating = true;
    errorMsg = '';
    generatedComment = '';
    render();

    const prompt = buildPrompt({ selectedText, platform, tone, template });

    try {
      const response: any = await chrome.runtime.sendMessage({
        action: 'GENERATE_REQUEST',
        prompt,
        providerId,
      });

      if (response?.status === 'ok' && response.result) {
        generatedComment = response.result;
      } else {
        errorMsg = response?.error ?? 'Unknown error occurred.';
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : String(err);
    } finally {
      isGenerating = false;
      render();
    }
  }

  // Copy
  async function handleCopy() {
    if (!generatedComment) return;
    await navigator.clipboard.writeText(generatedComment);
    const btn = shadow.querySelector('.aicg-btn-copy') as HTMLElement | null;
    if (btn) {
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
    }
  }

  // Insert into comment box
  function handleInsert() {
    if (!generatedComment) return;
    insertCommentText(generatedComment, anchor);
    closeInlinePanel();
  }

  // Mount — insert panel right after the anchor
  if (anchor.parentElement) {
    anchor.parentElement.insertBefore(host, anchor.nextSibling);
  } else {
    anchor.appendChild(host);
  }

  activePanelHost = host;
  render();

  host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ══════════════════════════════════════════════════════════════
//  Close the inline panel
// ══════════════════════════════════════════════════════════════
function closeInlinePanel(): void {
  if (activePanelHost) {
    activePanelHost.remove();
    activePanelHost = null;
  }
}

// ══════════════════════════════════════════════════════════════
//  Insert text into the nearest comment input
// ══════════════════════════════════════════════════════════════
function insertCommentText(text: string, context: HTMLElement): void {
  const selectors: string[] = [
    '.comments-comment-texteditor .ql-editor',
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"][aria-label*="comment" i]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[aria-label*="comment" i]',
    'textarea[placeholder*="comment" i]',
  ];

  const post =
    context.closest('.feed-shared-update-v2') ??
    context.closest('[data-urn]') ??
    context.closest('[role="article"]') ??
    context.closest('article') ??
    context.parentElement;

  const scope = post ?? document;

  for (const sel of selectors) {
    const el = scope.querySelector<HTMLElement>(sel);
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

  navigator.clipboard.writeText(text).catch(() => {});
}

// ══════════════════════════════════════════════════════════════
//  Floating Action Button (text selection flow)
// ══════════════════════════════════════════════════════════════
function createFab(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = FAB_ID;

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

  el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v0m-3.5 3h7" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="0.5" fill="white"/></svg>`;

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
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }

  const sz = 42, m = 8;
  let left = x + m;
  let top  = y - sz - m;
  if (left + sz > window.innerWidth) left = window.innerWidth - sz - m;
  if (top < m) top = y + m;
  if (left < m) left = m;

  Object.assign(fabElement.style, {
    left: `${left}px`, top: `${top}px`,
    opacity: '1', transform: 'scale(1)', pointerEvents: 'auto',
  });
}

function hideFab(): void {
  if (!fabElement) return;
  Object.assign(fabElement.style, {
    opacity: '0', transform: 'scale(0.7)', pointerEvents: 'none',
  });
}

function handleSelectionChange(e: MouseEvent): void {
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length < MIN_SEL_LEN) { hideFab(); return; }
    showFab(e.clientX, e.clientY);
  }, 10);
}

/** FAB click — open inline panel near the closest comment bar, pre-filled with selected text */
function handleFabClick(): void {
  const sel = window.getSelection();
  const text = sel?.toString().trim() ?? '';
  if (!text) return;

  hideFab();

  const range = sel?.getRangeAt(0);
  const container = range?.commonAncestorContainer;
  const parentEl = container instanceof HTMLElement ? container : container?.parentElement;

  const post =
    parentEl?.closest('.feed-shared-update-v2') ??
    parentEl?.closest('[data-urn]') ??
    parentEl?.closest('[role="article"]') ??
    parentEl?.closest('article');

  let commentBar: HTMLElement | null = null;
  if (post) {
    const barSels = getCommentBarSelectors();
    for (const s of barSels) {
      commentBar = post.querySelector<HTMLElement>(s);
      if (commentBar) break;
    }
  }

  if (!commentBar) {
    const barSels = getCommentBarSelectors();
    for (const s of barSels) {
      commentBar = document.querySelector<HTMLElement>(s);
      if (commentBar) break;
    }
  }

  if (commentBar) {
    openInlinePanel(commentBar, text);
  } else {
    // Last resort: save to storage and open extension popup
    chrome.storage.local.set({ selection: { text, platform: detectPlatform() } });
    chrome.runtime.sendMessage({ action: 'OPEN_POPUP' });
  }
}

// ══════════════════════════════════════════════════════════════
//  Listen for messages from popup
// ══════════════════════════════════════════════════════════════
chrome.runtime.onMessage.addListener(
  (message: { action: string; text?: string }) => {
    if (message.action === 'INSERT_COMMENT' && message.text) {
      insertCommentText(message.text, document.body);
    }
  },
);

// ══════════════════════════════════════════════════════════════
//  Bootstrap
// ══════════════════════════════════════════════════════════════
function init(): void {
  fabElement = createFab();
  fabElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFabClick();
  });

  document.addEventListener('mouseup', handleSelectionChange, true);
  document.addEventListener('mousedown', (e) => {
    if (fabElement && e.target !== fabElement && !fabElement.contains(e.target as Node)) {
      hideTimeout = setTimeout(hideFab, 200);
    }
  }, true);
  window.addEventListener('scroll', () => hideFab(), { passive: true });

  // Inject buttons into existing comment bars
  scanAndInjectButtons();

  // Re-scan periodically (SPAs dynamically add comment bars)
  setInterval(scanAndInjectButtons, SCAN_INTERVAL);

  // Also observe DOM mutations for faster injection
  const observer = new MutationObserver(() => scanAndInjectButtons());
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[AI Comment Generator] Content script loaded on LinkedIn');
}

init();

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function platformLabel(_p: Platform): string {
  return '🔗 LinkedIn';
}

// ══════════════════════════════════════════════════════════════
//  Inline Panel CSS (injected inside shadow DOM)
// ══════════════════════════════════════════════════════════════
function getInlinePanelCSS(): string {
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:host {
  display: block;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

.aicg-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.06);
  overflow: hidden;
  animation: aicg-slideIn .2s ease;
}

@keyframes aicg-slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.aicg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
}

.aicg-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
}

.aicg-close {
  background: rgba(255,255,255,.18);
  border: none;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background .12s;
}

.aicg-close:hover { background: rgba(255,255,255,.32); }

.aicg-body {
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aicg-badge {
  display: inline-flex;
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #4f46e5;
  background: #eef2ff;
  padding: 2px 10px;
  border-radius: 20px;
}

.aicg-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #64748b;
  margin-bottom: 3px;
}

.aicg-textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
  background: #f8fafc;
  resize: vertical;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.aicg-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  background: #fff;
}

.aicg-select {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 28px 7px 10px;
  font-family: inherit;
  font-size: 13px;
  color: #1e293b;
  background: #fff;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.aicg-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.12);
}

.aicg-row {
  display: flex;
  gap: 10px;
}

.aicg-field {
  flex: 1;
  min-width: 0;
}

.aicg-key-status { flex-shrink: 0; }
.aicg-key-ok      { font-size: 11px; color: #10b981; font-weight: 600; }
.aicg-key-missing  { font-size: 11px; color: #ef4444; font-weight: 600; }

.aicg-generate-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity .12s, transform .12s;
  box-shadow: 0 2px 8px rgba(99,102,241,.28);
}

.aicg-generate-btn:hover:not(:disabled) {
  opacity: .92;
  transform: translateY(-1px);
}

.aicg-generate-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.aicg-spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: aicg-spin .55s linear infinite;
}

@keyframes aicg-spin { to { transform: rotate(360deg); } }

.aicg-error {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 11px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.aicg-error span { flex-shrink: 0; font-size: 13px; }
.aicg-error p    { font-size: 12px; color: #ef4444; word-break: break-word; }

.aicg-output {
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  overflow: hidden;
}

.aicg-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 11px;
  background: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
}

.aicg-output-header span {
  font-size: 12px;
  font-weight: 700;
  color: #166534;
}

.aicg-output-actions {
  display: flex;
  gap: 5px;
}

.aicg-output-actions button {
  padding: 3px 9px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  color: #166534;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s;
}

.aicg-output-actions button:hover { background: #dcfce7; }

.aicg-output-actions button.copied {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.aicg-output .aicg-textarea {
  border: none;
  border-radius: 0;
  background: #fff;
}

.aicg-output .aicg-textarea:focus { box-shadow: none; }
`;
}
