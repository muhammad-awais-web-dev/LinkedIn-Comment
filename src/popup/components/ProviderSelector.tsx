import React from 'react';
import type { ProviderId } from '../../shared/types';
import { PROVIDER_META } from '../../shared/types';

interface Props {
  selectedId: ProviderId;
  onChange: (id: ProviderId) => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function ProviderSelector({
  selectedId,
  onChange,
  hasApiKey,
  onOpenSettings,
}: Props) {
  return (
    <div className="provider-row">
      <div className="field-group">
        <label className="field-label">AI Provider</label>
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value as ProviderId)}
        >
          {Object.values(PROVIDER_META).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {hasApiKey ? (
        <span className="key-ok">✓ Key set</span>
      ) : (
        <span className="key-hint" onClick={onOpenSettings}>
          Add API key →
        </span>
      )}
    </div>
  );
}
