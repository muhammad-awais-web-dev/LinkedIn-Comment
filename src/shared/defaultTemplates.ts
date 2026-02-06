/* ──────────────────────────────────────────────────────────────
   Default comment templates shipped with the extension
   ────────────────────────────────────────────────────────────── */

import type { CommentTemplate } from './types';

export const DEFAULT_TEMPLATES: CommentTemplate[] = [
  {
    id: 'supportive',
    name: '👏 Supportive',
    description: 'Show appreciation and support for the post',
    promptSnippet:
      'Write a supportive and encouraging comment that acknowledges the value of the post and shows genuine appreciation.',
    isDefault: true,
  },
  {
    id: 'insightful',
    name: '💡 Insightful',
    description: 'Add a valuable perspective or insight',
    promptSnippet:
      'Write an insightful comment that adds a new perspective, shares a related idea, or builds on the topic with thoughtful analysis.',
    isDefault: true,
  },
  {
    id: 'question',
    name: '❓ Question-based',
    description: 'Ask a thoughtful question to drive engagement',
    promptSnippet:
      'Write a comment that asks a thoughtful, genuine question related to the post content to encourage further discussion.',
    isDefault: true,
  },
  {
    id: 'engagement',
    name: '🚀 Engagement-focused',
    description: 'Maximize interaction and visibility',
    promptSnippet:
      'Write an engaging comment that is likely to receive likes and replies. Be relatable, add value, and invite others into the conversation.',
    isDefault: true,
  },
];
