/* ──────────────────────────────────────────────────────────────
   Anthropic Claude provider
   Docs → https://docs.anthropic.com/en/api/messages
   ────────────────────────────────────────────────────────────── */

import type { AIProvider } from './AIProvider';

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'Anthropic API key is not configured. Please add it in Settings.',
      );
    }

    const url = 'https://api.anthropic.com/v1/messages';

    const body = {
      model: this.model,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.content?.[0]?.text;

    if (!text) {
      throw new Error('Anthropic returned an empty response.');
    }

    return text.trim();
  }
}
