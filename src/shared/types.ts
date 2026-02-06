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
  | 'encouraging'
  | (string & {}); // allows custom tones

export interface ToneOption {
  value: string;
  label: string;
  emoji: string;
  isDefault?: boolean;
}

export const DEFAULT_TONES: ToneOption[] = [
  { value: 'professional', label: 'Professional', emoji: '💼', isDefault: true },
  { value: 'friendly', label: 'Friendly', emoji: '😊', isDefault: true },
  { value: 'casual', label: 'Casual', emoji: '✌️', isDefault: true },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔', isDefault: true },
  { value: 'bold', label: 'Bold', emoji: '🔥', isDefault: true },
  { value: 'encouraging', label: 'Encouraging', emoji: '🙌', isDefault: true },
];

/** @deprecated Use DEFAULT_TONES instead */
export const TONES = DEFAULT_TONES;

// ── Templates ─────────────────────────────────────────────────
export interface CommentTemplate {
  id: string;
  name: string;
  description: string;
  promptSnippet: string;
  isDefault?: boolean;
}

// ── AI Providers ──────────────────────────────────────────────
export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter';

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
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4.1-nano',
      'gpt-4.1-mini',
      'o4-mini',
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022',
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
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
  /** Custom tones created by user */
  customTones: ToneOption[];
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
