/* ──────────────────────────────────────────────────────────────
   Prompt builder — assembles the final prompt sent to the AI
   provider from the user's selections.
   ────────────────────────────────────────────────────────────── */

import type { Platform, Tone, CommentTemplate } from './types';

/** Platform-specific behavioural hints appended to every prompt. */
const PLATFORM_HINTS: Record<Platform, string> = {
  linkedin:
    'This is LinkedIn — use a professional tone, minimal emojis, and focus on insight-driven commentary.',
  facebook:
    'This is Facebook — use a conversational tone, moderate emojis are fine, and keep it friendly.',
  instagram:
    'This is Instagram — be casual, emoji-friendly, and write short engaging comments.',
  unknown:
    'The platform is unknown — write a balanced, generally appropriate social media comment.',
};

export interface PromptParams {
  selectedText: string;
  platform: Platform;
  tone: Tone;
  template: CommentTemplate;
}

/**
 * Build the complete prompt string sent to the AI model.
 */
export function buildPrompt(params: PromptParams): string {
  const { selectedText, platform, tone, template } = params;

  return `You are an expert social media engagement assistant.

Platform: ${platform}
Tone: ${tone}
Template style: ${template.name}

${PLATFORM_HINTS[platform]}

${template.promptSnippet}

Post content:
"""
${selectedText.trim()}
"""

Rules:
- Sound natural and human — never robotic or generic.
- Keep the comment concise (1–3 sentences).
- Match the requested tone precisely.
- Adjust professionalism and emoji usage based on the platform.
- Do NOT include hashtags unless the template explicitly asks for them.
- Do NOT repeat or quote the post verbatim.
- Output ONLY the comment text, nothing else.`;
}
