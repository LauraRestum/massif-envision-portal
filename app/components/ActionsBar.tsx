"use client";

interface ActionsBarProps {
  onSubmit: () => void;
}

export default function ActionsBar({ onSubmit }: ActionsBarProps) {
  return (
    <div className="actions-bar">
      <button className="action" onClick={() => window.print()}>
        ⬇ Export PDF
      </button>
      <button className="action primary" onClick={onSubmit}>
        + Submit Update
      </button>
    </div>
  );
}
