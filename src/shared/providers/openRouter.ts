/* ──────────────────────────────────────────────────────────────
   OpenRouter provider  (OpenAI-compatible API)
   Docs → https://openrouter.ai/docs/api-reference
   ────────────────────────────────────────────────────────────── */

import type { AIProvider } from './AIProvider';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'google/gemini-2.0-flash-001') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'OpenRouter API key is not configured. Please add it in Settings.',
      );
    }

    const url = 'https://openrouter.ai/api/v1/chat/completions';

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
        'HTTP-Referer': 'chrome-extension://ai-comment-generator',
        'X-Title': 'AI Comment Generator',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();

    const text: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('OpenRouter returned an empty response.');
    }

    return text.trim();
  }
}
