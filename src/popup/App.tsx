import React, { useEffect, useState, useCallback } from 'react';
import type {
  Platform,
  Tone,
  ProviderId,
  CommentTemplate,
  ProviderConfig,
} from '../shared/types';
import { PROVIDER_META } from '../shared/types';
import {
  getSelection,
  getTemplates,
  getProviderConfigs,
  getSettings,
  saveSettings,
  saveProviderConfigs,
  saveTemplates,
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
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [tone, setTone] = useState<Tone>('professional');
  const [selectedTemplateId, setSelectedTemplateId] = useState('supportive');
  const [providerId, setProviderId] = useState<ProviderId>('gemini');

  // ── Data state ────────────────────────────────────────────
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<
    Record<ProviderId, ProviderConfig>
  >({
    gemini: { apiKey: '', model: PROVIDER_META.gemini.defaultModel },
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
      const [sel, tmpl, configs, settings] = await Promise.all([
        getSelection(),
        getTemplates(),
        getProviderConfigs(),
        getSettings(),
      ]);

      if (sel) {
        setSelectedText(sel.text);
        setPlatform(sel.platform);
      }
      setTemplates(tmpl);
      setProviderConfigs(configs);
      setTone(settings.defaultTone);
      setProviderId(settings.defaultProvider);
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
  const platformLabel: Record<Platform, string> = {
    linkedin: '🔗 LinkedIn',
    facebook: '📘 Facebook',
    instagram: '📸 Instagram',
    unknown: '🌐 Unknown',
  };

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
          <div className="platform-badge">{platformLabel[platform]}</div>

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
            <ToneSelector selectedTone={tone} onChange={setTone} />
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
    </div>
  );
}
