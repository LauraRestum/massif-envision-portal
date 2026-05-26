"use client";

interface ActionsBarProps {
  onSubmit: () => void;
}

export default function ActionsBar({ onSubmit }: ActionsBarProps) {
  return (
    <div className="actions-bar">
      <button
        type="button"
        className="action"
        onClick={() => window.print()}
        aria-label="Export pipeline as PDF"
      >
        <span aria-hidden="true">⬇</span> Export PDF
      </button>
      <button
        type="button"
        className="action primary"
        onClick={onSubmit}
        aria-label="Submit an update to the pipeline"
      >
        <span aria-hidden="true">+</span> Submit Update
      </button>
    </div>
  );
}
