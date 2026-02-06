/* ──────────────────────────────────────────────────────────────
   Groq provider  (OpenAI-compatible API)
   Docs → https://console.groq.com/docs/api-reference
   ────────────────────────────────────────────────────────────── */

import type { AIProvider } from './AIProvider';

export class GroqProvider implements AIProvider {
  readonly name = 'Groq';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'llama-3.3-70b-versatile') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'Groq API key is not configured. Please add it in Settings.',
      );
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

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
      throw new Error(`Groq API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Groq returned an empty response.');
    }

    return text.trim();
  }
}
