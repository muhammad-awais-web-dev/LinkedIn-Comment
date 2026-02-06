import React, { useState, useEffect } from 'react';
import type { ProviderId, ProviderConfig } from '../../shared/types';
import { PROVIDER_META } from '../../shared/types';

interface Props {
  providerConfigs: Record<ProviderId, ProviderConfig>;
  onSave: (configs: Record<ProviderId, ProviderConfig>) => void;
  onClose: () => void;
}

export function SettingsPanel({ providerConfigs, onSave, onClose }: Props) {
  const [local, setLocal] = useState<Record<ProviderId, ProviderConfig>>(
    () => structuredClone(providerConfigs),
  );
  const [saved, setSaved] = useState(false);

  // Sync when parent updates
  useEffect(() => {
    setLocal(structuredClone(providerConfigs));
  }, [providerConfigs]);

  function updateField(
    id: ProviderId,
    field: keyof ProviderConfig,
    value: string,
  ) {
    setLocal((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="panel scrollable">
      <div className="panel-header">
        <h2>⚙️ Settings</h2>
        <button className="panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => {
        const meta = PROVIDER_META[id];
        return (
          <div key={id} className="panel-section">
            <h3>{meta.name}</h3>

            <div className="form-row">
              <label className="field-label">API Key</label>
              <input
                type="password"
                placeholder={`Enter ${meta.name} API key`}
                value={local[id]?.apiKey ?? ''}
                onChange={(e) => updateField(id, 'apiKey', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label className="field-label">Model</label>
              <select
                value={local[id]?.model ?? meta.defaultModel}
                onChange={(e) => updateField(id, 'model', e.target.value)}
              >
                {meta.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      <div className="save-bar">
        <button className="btn-sm primary" onClick={handleSave}>
          {saved ? '✓ Saved!' : 'Save settings'}
        </button>
      </div>

      <div className="panel-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
        <h3>💖 Support</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="https://github.com/muhammad-awais-web-dev/LinkedIn-Comment"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sm"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            ⭐ Star on GitHub
          </a>
          <a
            href="https://github.com/sponsors/muhammad-awais-web-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sm"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            ❤️ Sponsor
          </a>
          <a
            href="https://www.linkedin.com/in/muhammad-awais-web-dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sm"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            🔗 LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
