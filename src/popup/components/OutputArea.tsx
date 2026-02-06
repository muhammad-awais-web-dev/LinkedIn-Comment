import React from 'react';

interface Props {
  comment: string;
  onChange: (text: string) => void;
  onCopy: () => void;
  onInsert: () => void;
  copied: boolean;
}

export function OutputArea({
  comment,
  onChange,
  onCopy,
  onInsert,
  copied,
}: Props) {
  return (
    <div className="output-area">
      <div className="output-header">
        <span>✅ Generated Comment</span>
        <div className="output-actions">
          <button onClick={onInsert} title="Insert into comment box on page">
            📥 Insert
          </button>
          <button
            onClick={onCopy}
            className={copied ? 'copied' : ''}
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
      <textarea
        rows={4}
        value={comment}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
