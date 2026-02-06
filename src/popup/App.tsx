import React, { useEffect, useState, useCallback } from 'react';
import type {
  Platform,
  Tone,
  ProviderId,
  CommentTemplate,
  ProviderConfig,
  ToneOption,
} from '../shared/types';
import { PROVIDER_META, DEFAULT_TONES } from '../shared/types';
import {
  getSelection,
  getTemplates,
  getProviderConfigs,
  getSettings,
  saveSettings,
  saveProviderConfigs,
  saveTemplates,
  getCustomTones,
} from '../shared/storage';
import { buildPrompt } from '../shared/promptBuilder';

import { SelectedTextArea } from './components/SelectedTextArea';
import { TemplateSelector } from './components/TemplateSelector';
import { ToneSelector } from './components/ToneSelector';
import { ProviderSelector } from './components/ProviderSelector';
import { GenerateButton } from './components/GenerateButton';
import { OutputArea } from './components/OutputArea';
import { SettingsPanel } from './components/SettingsPanel';
import { TemplateManager } from './components/TemplateManager';

type View = 'main' | 'settings' | 'templates';

export function App() {
  // ── View state ────────────────────────────────────────────
  const [view, setView] = useState<View>('main');

  // ── Form state ────────────────────────────────────────────
  const [selectedText, setSelectedText] = useState('');
  const [platform] = useState<Platform>('linkedin');
  const [tone, setTone] = useState<Tone>('professional');
  const [selectedTemplateId, setSelectedTemplateId] = useState('supportive');
  const [providerId, setProviderId] = useState<ProviderId>('gemini');

  // ── Data state ────────────────────────────────────────────
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [allTones, setAllTones] = useState<ToneOption[]>(DEFAULT_TONES);
  const [providerConfigs, setProviderConfigs] = useState<
    Record<ProviderId, ProviderConfig>
  >({
    gemini: { apiKey: '', model: PROVIDER_META.gemini.defaultModel },
    openai: { apiKey: '', model: PROVIDER_META.openai.defaultModel },
    anthropic: { apiKey: '', model: PROVIDER_META.anthropic.defaultModel },
    groq: { apiKey: '', model: PROVIDER_META.groq.defaultModel },
    openrouter: { apiKey: '', model: PROVIDER_META.openrouter.defaultModel },
  });

  // ── Output state ──────────────────────────────────────────
  const [generatedComment, setGeneratedComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Load persisted data on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      const [sel, tmpl, configs, settings, customTones] = await Promise.all([
        getSelection(),
        getTemplates(),
        getProviderConfigs(),
        getSettings(),
        getCustomTones(),
      ]);

      if (sel) {
        setSelectedText(sel.text);
      }
      setTemplates(tmpl);
      setProviderConfigs(configs);
      setTone(settings.defaultTone);
      setProviderId(settings.defaultProvider);
      setAllTones([...DEFAULT_TONES, ...customTones]);
    })();
  }, []);

  // ── Generate handler ──────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template || !selectedText.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedComment('');

    const prompt = buildPrompt({
      selectedText,
      platform,
      tone,
      template,
    });

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_REQUEST',
        prompt,
        providerId,
      });

      if (response?.status === 'ok' && response.result) {
        setGeneratedComment(response.result);
      } else {
        setError(response?.error ?? 'Unknown error occurred.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedText, platform, tone, selectedTemplateId, providerId, templates]);

  // ── Copy to clipboard ─────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!generatedComment) return;
    await navigator.clipboard.writeText(generatedComment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedComment]);

  // ── Insert into page comment box ──────────────────────────
  const handleInsert = useCallback(async () => {
    if (!generatedComment) return;

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'INSERT_COMMENT',
        text: generatedComment,
      });
    }
  }, [generatedComment]);

  // ── Save settings helpers ─────────────────────────────────
  const handleSaveProviderConfigs = useCallback(
    async (configs: Record<ProviderId, ProviderConfig>) => {
      setProviderConfigs(configs);
      await saveProviderConfigs(configs);
    },
    [],
  );

  const handleSaveTemplates = useCallback(
    async (newTemplates: CommentTemplate[]) => {
      setTemplates(newTemplates);
      await saveTemplates(newTemplates);
    },
    [],
  );

  // Persist tone / provider changes
  useEffect(() => {
    saveSettings({ defaultTone: tone, defaultProvider: providerId });
  }, [tone, providerId]);

  // ── Platform badge helper ─────────────────────────────────
  const platformLabel = '🔗 LinkedIn';

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <img src="logo.svg" alt="AI Comment" />
          </div>
          <h1>AI Comment</h1>
        </div>
        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('editor/index.html') })}
            title="Template & Tone Editor"
          >
            ✏️
          </button>
          <button
            className={`icon-btn ${view === 'templates' ? 'active' : ''}`}
            onClick={() => setView(view === 'templates' ? 'main' : 'templates')}
            title="Manage templates"
          >
            📝
          </button>
          <button
            className={`icon-btn ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView(view === 'settings' ? 'main' : 'settings')}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* ── Settings Panel ─────────────────────────────────── */}
      {view === 'settings' && (
        <SettingsPanel
          providerConfigs={providerConfigs}
          onSave={handleSaveProviderConfigs}
          onClose={() => setView('main')}
        />
      )}

      {/* ── Template Manager ───────────────────────────────── */}
      {view === 'templates' && (
        <TemplateManager
          templates={templates}
          onSave={handleSaveTemplates}
          onClose={() => setView('main')}
        />
      )}

      {/* ── Main generation view ───────────────────────────── */}
      {view === 'main' && (
        <div className="main-view">
          {/* Platform badge */}
          <div className="platform-badge">{platformLabel}</div>

          {/* Selected text */}
          <SelectedTextArea
            text={selectedText}
            onChange={setSelectedText}
            platform={platform}
          />

          {/* Controls row */}
          <div className="controls-grid">
            <TemplateSelector
              templates={templates}
              selectedId={selectedTemplateId}
              onChange={setSelectedTemplateId}
            />
            <ToneSelector selectedTone={tone} onChange={setTone} tones={allTones} />
          </div>

          {/* Provider selector */}
          <ProviderSelector
            selectedId={providerId}
            onChange={setProviderId}
            hasApiKey={!!providerConfigs[providerId]?.apiKey}
            onOpenSettings={() => setView('settings')}
          />

          {/* Generate button */}
          <GenerateButton
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={
              !selectedText.trim() ||
              !providerConfigs[providerId]?.apiKey
            }
          />

          {/* Error message */}
          {error && (
            <div className="error-box">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Output */}
          {generatedComment && (
            <OutputArea
              comment={generatedComment}
              onChange={setGeneratedComment}
              onCopy={handleCopy}
              onInsert={handleInsert}
              copied={copied}
            />
          )}
        </div>
      )}

      {/* ── Footer with social links ─────────────────────────── */}
      <footer className="app-footer">
        <a
          href="https://github.com/muhammad-awais-web-dev/LinkedIn-Comment"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          title="⭐ Star on GitHub"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
          Star
        </a>
        <span className="footer-divider">·</span>
        <a
          href="https://github.com/muhammad-awais-web-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          title="GitHub Profile"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
        <span className="footer-divider">·</span>
        <a
          href="https://www.linkedin.com/in/muhammad-awais-web-dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          title="LinkedIn Profile"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.632 13.635h-2.37V9.922c0-.886-.018-2.025-1.234-2.025-1.235 0-1.424.964-1.424 1.96v3.778h-2.37V6H8.51v1.04h.03c.318-.6 1.092-1.233 2.247-1.233 2.4 0 2.845 1.58 2.845 3.637v4.188zM3.558 4.955a1.376 1.376 0 1 1 0-2.752 1.376 1.376 0 0 1 0 2.752zM4.743 13.636H2.372V6h2.371v7.635zM14.816 0H1.18C.528 0 0 .516 0 1.153v13.694C0 15.484.528 16 1.18 16h13.635c.652 0 1.185-.516 1.185-1.153V1.153C16 .516 15.467 0 14.815 0z"/></svg>
          LinkedIn
        </a>
      </footer>
    </div>
  );
}
