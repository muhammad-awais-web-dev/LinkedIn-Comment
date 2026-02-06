import React from 'react';
import type { Platform } from '../../shared/types';

interface Props {
  text: string;
  onChange: (text: string) => void;
  platform: Platform;
}

export function SelectedTextArea({ text, onChange }: Props) {
  return (
    <div className="field-group">
      <label className="field-label">Selected text</label>
      <textarea
        rows={4}
        placeholder="Select text on a social media post, or paste it here…"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
