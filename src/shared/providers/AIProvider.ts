/* ──────────────────────────────────────────────────────────────
   AI Provider interface — every provider must implement this.
   ────────────────────────────────────────────────────────────── */

export interface AIProvider {
  /** Human-readable name shown in logs / errors */
  readonly name: string;

  /**
   * Send a prompt and return the generated text.
   * Throws on network / auth / rate-limit errors.
   */
  generate(prompt: string): Promise<string>;
}
