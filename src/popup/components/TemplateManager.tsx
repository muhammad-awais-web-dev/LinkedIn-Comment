import React, { useState } from 'react';
import type { CommentTemplate } from '../../shared/types';

interface Props {
  templates: CommentTemplate[];
  onSave: (templates: CommentTemplate[]) => void;
  onClose: () => void;
}

interface EditState {
  id: string | null; // null = new template
  name: string;
  description: string;
  promptSnippet: string;
}

const EMPTY_EDIT: EditState = {
  id: null,
  name: '',
  description: '',
  promptSnippet: '',
};

export function TemplateManager({ templates, onSave, onClose }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);

  // ── Delete ──────────────────────────────────────────────
  function handleDelete(id: string) {
    onSave(templates.filter((t) => t.id !== id));
  }

  // ── Start editing ───────────────────────────────────────
  function startEdit(tpl: CommentTemplate) {
    setEditing({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      promptSnippet: tpl.promptSnippet,
    });
  }

  // ── Save edit / new ─────────────────────────────────────
  function handleSaveEdit() {
    if (!editing || !editing.name.trim()) return;

    if (editing.id) {
      // Update existing
      onSave(
        templates.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                name: editing.name,
                description: editing.description,
                promptSnippet: editing.promptSnippet,
              }
            : t,
        ),
      );
    } else {
      // Create new
      const newId = `custom_${Date.now()}`;
      onSave([
        ...templates,
        {
          id: newId,
          name: editing.name,
          description: editing.description,
          promptSnippet: editing.promptSnippet,
          isDefault: false,
        },
      ]);
    }

    setEditing(null);
  }

  return (
    <div className="panel scrollable">
      <div className="panel-header">
        <h2>📝 Templates</h2>
        <button className="panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Template list */}
      <div className="template-list">
        {templates.map((tpl) => (
          <div key={tpl.id} className="template-item">
            <div className="tpl-info">
              <span className="tpl-name">{tpl.name}</span>
              <span className="tpl-desc">{tpl.description}</span>
            </div>
            <div className="tpl-actions">
              <button onClick={() => startEdit(tpl)} title="Edit">
                ✏️
              </button>
              {!tpl.isDefault && (
                <button onClick={() => handleDelete(tpl.id)} title="Delete">
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create form */}
      {editing && (
        <div className="template-form">
          <div className="form-row">
            <label className="field-label">Name</label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              placeholder="e.g. 🎯 Strategic"
            />
          </div>
          <div className="form-row">
            <label className="field-label">Description</label>
            <input
              type="text"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              placeholder="Short description of this template"
            />
          </div>
          <div className="form-row">
            <label className="field-label">Prompt instruction</label>
            <textarea
              rows={3}
              value={editing.promptSnippet}
              onChange={(e) =>
                setEditing({ ...editing, promptSnippet: e.target.value })
              }
              placeholder="Write a comment that…"
            />
          </div>
          <div className="btn-row">
            <button className="btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-sm primary" onClick={handleSaveEdit}>
              {editing.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Add new template button */}
      {!editing && (
        <button
          className="add-tpl-btn"
          onClick={() => setEditing({ ...EMPTY_EDIT })}
        >
          + Add custom template
        </button>
      )}
    </div>
  );
}
