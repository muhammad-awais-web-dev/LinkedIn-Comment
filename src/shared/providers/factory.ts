/* ──────────────────────────────────────────────────────────────
   Provider factory — returns the correct AIProvider instance
   based on the user's current configuration.
   ────────────────────────────────────────────────────────────── */

import type { AIProvider } from './AIProvider';
import type { ProviderId, ProviderConfig } from '../types';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openRouter';

export function createProvider(
  id: ProviderId,
  config: ProviderConfig,
): AIProvider {
  switch (id) {
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model);
    case 'openrouter':
      return new OpenRouterProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown provider: ${id}`);
  }
}
