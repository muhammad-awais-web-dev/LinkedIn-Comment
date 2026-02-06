import React from 'react';
import type { Tone } from '../../shared/types';
import { TONES } from '../../shared/types';

interface Props {
  selectedTone: Tone;
  onChange: (tone: Tone) => void;
}

export function ToneSelector({ selectedTone, onChange }: Props) {
  return (
    <div className="field-group">
      <label className="field-label">Tone</label>
      <select
        value={selectedTone}
        onChange={(e) => onChange(e.target.value as Tone)}
      >
        {TONES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.emoji} {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
