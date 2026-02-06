/* ──────────────────────────────────────────────────────────────
   Shared type definitions for AI Comment Generator extension
   ────────────────────────────────────────────────────────────── */

// ── Platforms ──────────────────────────────────────────────────
export type Platform = 'linkedin';

// ── Tones ─────────────────────────────────────────────────────
export type Tone =
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'thoughtful'
  | 'bold'
  | 'encouraging';

export const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'friendly', label: 'Friendly', emoji: '😊' },
  { value: 'casual', label: 'Casual', emoji: '✌️' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { value: 'bold', label: 'Bold', emoji: '🔥' },
  { value: 'encouraging', label: 'Encouraging', emoji: '🙌' },
];

// ── Templates ─────────────────────────────────────────────────
export interface CommentTemplate {
  id: string;
  name: string;
  description: string;
  promptSnippet: string;
  isDefault?: boolean;
}

// ── AI Providers ──────────────────────────────────────────────
export type ProviderId = 'gemini' | 'openrouter';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  defaultModel: string;
  models: string[];
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    models: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'google/gemini-2.0-flash-001',
    models: [
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'mistralai/mistral-small-24b-instruct-2501',
    ],
  },
};

// ── Provider Config (persisted per-provider) ──────────────────
export interface ProviderConfig {
  apiKey: string;
  model: string;
}

// ── User Settings ─────────────────────────────────────────────
export interface UserSettings {
  defaultTone: Tone;
  defaultProvider: ProviderId;
}

// ── Storage Schema ────────────────────────────────────────────
export interface StorageSchema {
  /** Currently selected text + platform from content script */
  selection: { text: string; platform: Platform } | null;
  /** User-created + default templates */
  templates: CommentTemplate[];
  /** Per-provider API key & model */
  providerConfigs: Record<ProviderId, ProviderConfig>;
  /** General user preferences */
  settings: UserSettings;
}

// ── Messages (content ↔ background ↔ popup) ──────────────────
export interface SelectionDetectedMsg {
  action: 'SELECTION_DETECTED';
  text: string;
  platform: Platform;
}

export interface OpenPopupMsg {
  action: 'OPEN_POPUP';
}

export interface GenerateRequestMsg {
  action: 'GENERATE_REQUEST';
  prompt: string;
  providerId: ProviderId;
}

export interface GenerateResponseMsg {
  action: 'GENERATE_RESPONSE';
  status: 'ok' | 'error';
  result?: string;
  error?: string;
}

export interface InsertCommentMsg {
  action: 'INSERT_COMMENT';
  text: string;
}

export type ExtensionMessage =
  | SelectionDetectedMsg
  | OpenPopupMsg
  | GenerateRequestMsg
  | GenerateResponseMsg
  | InsertCommentMsg;
