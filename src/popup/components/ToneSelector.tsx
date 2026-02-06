import React from 'react';
import type { Tone, ToneOption } from '../../shared/types';

interface Props {
  selectedTone: Tone;
  onChange: (tone: Tone) => void;
  tones: ToneOption[];
}

export function ToneSelector({ selectedTone, onChange, tones }: Props) {
  return (
    <div className="field-group">
      <label className="field-label">Tone</label>
      <select
        value={selectedTone}
        onChange={(e) => onChange(e.target.value as Tone)}
      >
        {tones.map((t) => (
          <option key={t.value} value={t.value}>
            {t.emoji} {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
