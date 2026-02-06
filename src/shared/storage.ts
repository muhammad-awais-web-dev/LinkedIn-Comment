/* ──────────────────────────────────────────────────────────────
   Chrome storage helpers — thin typed wrappers around
   chrome.storage.local  (keys match StorageSchema)
   ────────────────────────────────────────────────────────────── */

import type {
  StorageSchema,
  CommentTemplate,
  ProviderConfig,
  ProviderId,
  UserSettings,
  Platform,
  ToneOption,
} from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

// ── Defaults ──────────────────────────────────────────────────
const DEFAULT_SETTINGS: UserSettings = {
  defaultTone: 'professional',
  defaultProvider: 'gemini',
};

const DEFAULT_PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  gemini: { apiKey: '', model: 'gemini-2.0-flash' },
  openai: { apiKey: '', model: 'gpt-4o-mini' },
  anthropic: { apiKey: '', model: 'claude-sonnet-4-20250514' },
  groq: { apiKey: '', model: 'llama-3.3-70b-versatile' },
  openrouter: { apiKey: '', model: 'google/gemini-2.0-flash-001' },
};

// ── Generic get / set ─────────────────────────────────────────
async function get<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as StorageSchema[K] | undefined;
}

async function set<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ── Selection ─────────────────────────────────────────────────
export async function getSelection(): Promise<{
  text: string;
  platform: Platform;
} | null> {
  return (await get('selection')) ?? null;
}

export async function saveSelection(
  text: string,
  platform: Platform,
): Promise<void> {
  await set('selection', { text, platform });
}

export async function clearSelection(): Promise<void> {
  await chrome.storage.local.remove('selection');
}

// ── Templates ─────────────────────────────────────────────────
export async function getTemplates(): Promise<CommentTemplate[]> {
  const stored = await get('templates');
  if (stored && stored.length > 0) return stored;
  // First run — seed defaults
  await set('templates', DEFAULT_TEMPLATES);
  return DEFAULT_TEMPLATES;
}

export async function saveTemplates(
  templates: CommentTemplate[],
): Promise<void> {
  await set('templates', templates);
}

// ── Provider configs ──────────────────────────────────────────
export async function getProviderConfigs(): Promise<
  Record<ProviderId, ProviderConfig>
> {
  const stored = await get('providerConfigs');
  return stored ?? DEFAULT_PROVIDER_CONFIGS;
}

export async function saveProviderConfigs(
  configs: Record<ProviderId, ProviderConfig>,
): Promise<void> {
  await set('providerConfigs', configs);
}

// ── Settings ──────────────────────────────────────────────────
export async function getSettings(): Promise<UserSettings> {
  const stored = await get('settings');
  return stored ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await set('settings', settings);
}

// ── Custom Tones ──────────────────────────────────────────────
export async function getCustomTones(): Promise<ToneOption[]> {
  const stored = await get('customTones');
  return stored ?? [];
}

export async function saveCustomTones(tones: ToneOption[]): Promise<void> {
  await set('customTones', tones);
}
