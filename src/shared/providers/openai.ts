/* ──────────────────────────────────────────────────────────────
   OpenAI provider
   Docs → https://platform.openai.com/docs/api-reference/chat
   ────────────────────────────────────────────────────────────── */

import type { AIProvider } from './AIProvider';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key is not configured. Please add it in Settings.',
      );
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 256,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('OpenAI returned an empty response.');
    }

    return text.trim();
  }
}
