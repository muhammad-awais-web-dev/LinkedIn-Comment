import React from 'react';
import type { CommentTemplate } from '../../shared/types';

interface Props {
  templates: CommentTemplate[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function TemplateSelector({ templates, selectedId, onChange }: Props) {
  return (
    <div className="field-group">
      <label className="field-label">Template</label>
      <select value={selectedId} onChange={(e) => onChange(e.target.value)}>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
