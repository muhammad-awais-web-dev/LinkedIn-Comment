import React from 'react';

interface Props {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export function GenerateButton({ onClick, loading, disabled }: Props) {
  return (
    <button
      className="generate-btn"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="spinner" />
          Generating…
        </>
      ) : (
        <>✦ Generate Comment</>
      )}
    </button>
  );
}
