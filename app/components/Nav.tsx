"use client";

interface NavProps {
  liveCount: number;
}

export default function Nav({ liveCount }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-x">x</span>
        <div className="nav-massif"></div>
        <span className="nav-massif-label">Program Pipeline</span>
      </div>
      <div className="nav-meta">
        <span>Last Update 2026.05.20</span>
        <span>
          <span id="liveCount">{liveCount}</span> Active Lines
        </span>
      </div>
    </nav>
  );
}
