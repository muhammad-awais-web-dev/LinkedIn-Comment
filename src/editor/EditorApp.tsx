import React, { useEffect, useState, useCallback } from 'react';
import type { CommentTemplate, ToneOption } from '../shared/types';
import { DEFAULT_TONES } from '../shared/types';
import {
  getTemplates,
  saveTemplates,
  getCustomTones,
  saveCustomTones,
} from '../shared/storage';

type Tab = 'templates' | 'tones';

interface EditingTemplate {
  id: string | null;
  name: string;
  description: string;
  promptSnippet: string;
}

interface EditingTone {
  id: string | null;
  value: string;
  label: string;
  emoji: string;
}

const EMPTY_TPL: EditingTemplate = { id: null, name: '', description: '', promptSnippet: '' };
const EMPTY_TONE: EditingTone = { id: null, value: '', label: '', emoji: '🎯' };

export function EditorApp() {
  const [tab, setTab] = useState<Tab>('templates');

  // ── Templates ───────────────────────────────────────────────
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [editingTpl, setEditingTpl] = useState<EditingTemplate | null>(null);

  // ── Tones ───────────────────────────────────────────────────
  const [customTones, setCustomTones] = useState<ToneOption[]>([]);
  const [editingTone, setEditingTone] = useState<EditingTone | null>(null);

  // ── Toast ───────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // ── Load data ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [tmpl, tones] = await Promise.all([getTemplates(), getCustomTones()]);
      setTemplates(tmpl);
      setCustomTones(tones);
    })();
  }, []);

  // ── Template CRUD ───────────────────────────────────────────
  const handleSaveTemplate = useCallback(async () => {
    if (!editingTpl || !editingTpl.name.trim()) return;

    let updated: CommentTemplate[];
    if (editingTpl.id) {
      updated = templates.map((t) =>
        t.id === editingTpl.id
          ? { ...t, name: editingTpl.name, description: editingTpl.description, promptSnippet: editingTpl.promptSnippet }
          : t,
      );
    } else {
      const newId = `custom_${Date.now()}`;
      updated = [
        ...templates,
        { id: newId, name: editingTpl.name, description: editingTpl.description, promptSnippet: editingTpl.promptSnippet, isDefault: false },
      ];
    }

    setTemplates(updated);
    await saveTemplates(updated);
    setEditingTpl(null);
    showToast(editingTpl.id ? 'Template updated!' : 'Template created!');
  }, [editingTpl, templates, showToast]);

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      await saveTemplates(updated);
      showToast('Template deleted');
    },
    [templates, showToast],
  );

  // ── Tone CRUD ───────────────────────────────────────────────
  const handleSaveTone = useCallback(async () => {
    if (!editingTone || !editingTone.label.trim()) return;

    const toneValue = editingTone.value || editingTone.label.toLowerCase().replace(/\s+/g, '_');

    let updated: ToneOption[];
    if (editingTone.id) {
      updated = customTones.map((t) =>
        t.value === editingTone.id
          ? { value: toneValue, label: editingTone.label, emoji: editingTone.emoji }
          : t,
      );
    } else {
      updated = [...customTones, { value: toneValue, label: editingTone.label, emoji: editingTone.emoji }];
    }

    setCustomTones(updated);
    await saveCustomTones(updated);
    setEditingTone(null);
    showToast(editingTone.id ? 'Tone updated!' : 'Tone created!');
  }, [editingTone, customTones, showToast]);

  const handleDeleteTone = useCallback(
    async (value: string) => {
      const updated = customTones.filter((t) => t.value !== value);
      setCustomTones(updated);
      await saveCustomTones(updated);
      showToast('Tone deleted');
    },
    [customTones, showToast],
  );

  return (
    <div className="editor">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="editor-header">
        <div className="editor-header-inner">
          <h1>✦ AI Comment Generator — Editor</h1>
          <p>Create and manage custom templates and tones</p>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="editor-tabs">
        <button className={`tab-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
          📝 Templates
        </button>
        <button className={`tab-btn ${tab === 'tones' ? 'active' : ''}`} onClick={() => setTab('tones')}>
          🎭 Tones
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <main className="editor-content">
        {/* ─── Templates Tab ──────────────────────────────── */}
        {tab === 'templates' && (
          <div className="editor-section">
            <div className="section-header">
              <h2>Comment Templates</h2>
              <button
                className="editor-btn primary"
                onClick={() => setEditingTpl({ ...EMPTY_TPL })}
              >
                + New Template
              </button>
            </div>

            {/* Edit form */}
            {editingTpl && (
              <div className="editor-form">
                <h3>{editingTpl.id ? 'Edit Template' : 'New Template'}</h3>
                <div className="form-field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editingTpl.name}
                    onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
                    placeholder="e.g. 🎯 Strategic"
                  />
                </div>
                <div className="form-field">
                  <label>Description</label>
                  <input
                    type="text"
                    value={editingTpl.description}
                    onChange={(e) => setEditingTpl({ ...editingTpl, description: e.target.value })}
                    placeholder="Short description of this template"
                  />
                </div>
                <div className="form-field">
                  <label>Prompt Instruction</label>
                  <textarea
                    rows={4}
                    value={editingTpl.promptSnippet}
                    onChange={(e) => setEditingTpl({ ...editingTpl, promptSnippet: e.target.value })}
                    placeholder="Write a comment that…"
                  />
                </div>
                <div className="form-actions">
                  <button className="editor-btn" onClick={() => setEditingTpl(null)}>Cancel</button>
                  <button className="editor-btn primary" onClick={handleSaveTemplate}>
                    {editingTpl.id ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Template list */}
            <div className="card-grid">
              {templates.map((tpl) => (
                <div key={tpl.id} className="card">
                  <div className="card-body">
                    <div className="card-title">
                      {tpl.name}
                      {tpl.isDefault && <span className="badge">Default</span>}
                    </div>
                    <p className="card-desc">{tpl.description}</p>
                    <p className="card-prompt">{tpl.promptSnippet}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="editor-btn sm"
                      onClick={() =>
                        setEditingTpl({
                          id: tpl.id,
                          name: tpl.name,
                          description: tpl.description,
                          promptSnippet: tpl.promptSnippet,
                        })
                      }
                    >
                      ✏️ Edit
                    </button>
                    {!tpl.isDefault && (
                      <button className="editor-btn sm danger" onClick={() => handleDeleteTemplate(tpl.id)}>
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tones Tab ──────────────────────────────────── */}
        {tab === 'tones' && (
          <div className="editor-section">
            <div className="section-header">
              <h2>Comment Tones</h2>
              <button
                className="editor-btn primary"
                onClick={() => setEditingTone({ ...EMPTY_TONE })}
              >
                + New Tone
              </button>
            </div>

            {/* Edit form */}
            {editingTone && (
              <div className="editor-form">
                <h3>{editingTone.id ? 'Edit Tone' : 'New Tone'}</h3>
                <div className="form-row-inline">
                  <div className="form-field" style={{ flex: '0 0 80px' }}>
                    <label>Emoji</label>
                    <input
                      type="text"
                      value={editingTone.emoji}
                      onChange={(e) => setEditingTone({ ...editingTone, emoji: e.target.value })}
                      placeholder="🎯"
                      maxLength={4}
                    />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label>Label</label>
                    <input
                      type="text"
                      value={editingTone.label}
                      onChange={(e) => setEditingTone({ ...editingTone, label: e.target.value })}
                      placeholder="e.g. Inspirational"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="editor-btn" onClick={() => setEditingTone(null)}>Cancel</button>
                  <button className="editor-btn primary" onClick={handleSaveTone}>
                    {editingTone.id ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Default tones (read-only) */}
            <h3 className="sub-heading">Built-in Tones</h3>
            <div className="card-grid">
              {DEFAULT_TONES.map((t) => (
                <div key={t.value} className="card tone-card">
                  <span className="tone-emoji">{t.emoji}</span>
                  <span className="tone-label">{t.label}</span>
                  <span className="badge">Default</span>
                </div>
              ))}
            </div>

            {/* Custom tones */}
            {customTones.length > 0 && (
              <>
                <h3 className="sub-heading">Custom Tones</h3>
                <div className="card-grid">
                  {customTones.map((t) => (
                    <div key={t.value} className="card tone-card">
                      <span className="tone-emoji">{t.emoji}</span>
                      <span className="tone-label">{t.label}</span>
                      <div className="card-actions">
                        <button
                          className="editor-btn sm"
                          onClick={() =>
                            setEditingTone({ id: t.value, value: t.value, label: t.label, emoji: t.emoji })
                          }
                        >
                          ✏️
                        </button>
                        <button className="editor-btn sm danger" onClick={() => handleDeleteTone(t.value)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
