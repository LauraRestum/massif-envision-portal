"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatEstTag,
  formatStamp,
  relativeTime,
  type UpdateEntry,
} from "@/lib/updates";

interface UpdateTickerProps {
  /** Feed entries, newest first. */
  items: UpdateEntry[];
  /** Jump the pipeline to a line. Items without an EST stay non-interactive. */
  onSelectEst?: (est: string) => void;
}

/** Seconds of travel per character of feed text — tuned so the copy stays readable. */
const SECONDS_PER_CHAR = 0.17;
const MIN_DURATION = 45;

/**
 * The rolling program feed under the nav. Motion is decorative: the same
 * entries are readable when paused, when reduced-motion is on, and to a
 * screen reader, which reads the list straight through and never sees the
 * duplicated run that makes the loop seamless.
 */
export default function UpdateTicker({ items, onSelectEst }: UpdateTickerProps) {
  const [paused, setPaused] = useState(false);
  // Null until mounted: "now" must not be evaluated during SSR, or the server
  // and browser render different freshness strings and hydration mismatches.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const duration = useMemo(() => {
    const chars = items.reduce(
      (n, u) => n + u.headline.length + (u.source?.length ?? 0) + 32,
      0
    );
    return Math.max(MIN_DURATION, Math.round(chars * SECONDS_PER_CHAR));
  }, [items]);

  if (items.length === 0) return null;

  const newest = items[0];
  const freshness = now ? relativeTime(newest.at, now) : null;

  const run = (clone: boolean) => (
    <ul className="ticker-run" aria-hidden={clone || undefined}>
      {items.map((u) => (
        <TickerItem
          key={clone ? `${u.id}-clone` : u.id}
          entry={u}
          clone={clone}
          onSelectEst={onSelectEst}
        />
      ))}
    </ul>
  );

  return (
    <section
      className="ticker"
      aria-label="Recent program updates"
      data-paused={paused ? "true" : undefined}
    >
      <p className="ticker-flag">
        <span className="ticker-dot" aria-hidden="true" />
        <span className="ticker-flag-label">Live</span>
        <span className="ticker-flag-sub" aria-hidden="true">
          // Program Feed
        </span>
      </p>

      <div className="ticker-viewport">
        <div
          className="ticker-track"
          style={{ ["--ticker-duration" as string]: `${duration}s` }}
        >
          {run(false)}
          {run(true)}
        </div>
      </div>

      <div className="ticker-meta">
        {/* The nav already carries the absolute date, and every item carries
            its own stamp, so this slot shows only how fresh the feed is. */}
        <span className="ticker-fresh">
          <span className="ticker-fresh-label">Updated</span>{" "}
          <span className="ticker-fresh-value">
            {freshness ?? formatStamp(newest.at)}
          </span>
        </span>
        <button
          type="button"
          className="ticker-toggle"
          onClick={() => setPaused((p) => !p)}
          aria-label={
            paused ? "Resume the updates ticker" : "Pause the updates ticker"
          }
        >
          <span className="ticker-toggle-glyph" aria-hidden="true">
            {paused ? "▶" : "❚❚"}
          </span>
        </button>
      </div>
    </section>
  );
}

function TickerItem({
  entry,
  clone,
  onSelectEst,
}: {
  entry: UpdateEntry;
  clone: boolean;
  onSelectEst?: (est: string) => void;
}) {
  const estTag = formatEstTag(entry.est);
  const target = entry.est?.[0];
  const interactive = Boolean(target && onSelectEst);

  const body = (
    <>
      <span className="ticker-kind">{entry.kind}</span>
      <span className="ticker-time">{formatStamp(entry.at)}</span>
      {estTag && <span className="ticker-est">{estTag}</span>}
      <span className="ticker-text">{entry.headline}</span>
      {entry.source && (
        <span className="ticker-source">via {entry.source}</span>
      )}
    </>
  );

  return (
    <li className="ticker-li">
      {interactive ? (
        <button
          type="button"
          className="ticker-item is-link"
          // The cloned run is aria-hidden; keeping its buttons out of the tab
          // order stops focus from landing on an element screen readers cannot see.
          tabIndex={clone ? -1 : undefined}
          onClick={() => onSelectEst!(target!)}
          // Focus stops the roll (CSS), but the track keeps whatever offset it
          // froze at, so pull the focused item into the viewport explicitly.
          // "nearest" on both axes keeps the page itself from jumping.
          onFocus={(e) =>
            e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })
          }
        >
          {body}
          <span className="visually-hidden">
            {" "}
            — show EST {target} in the pipeline
          </span>
        </button>
      ) : (
        <span className="ticker-item">{body}</span>
      )}
      <span className="ticker-sep" aria-hidden="true">
        ◆
      </span>
    </li>
  );
}
