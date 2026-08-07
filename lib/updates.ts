/**
 * The program update feed behind the live ticker. Entries are authored in
 * `data/updates.json` whenever a pipeline sync lands, newest first.
 */
export interface UpdateEntry {
  id: string;
  /**
   * When the update landed: "YYYY-MM-DD", or "YYYY-MM-DDTHH:MM" when the
   * wall-clock time is known. Times are local — the feed is a shared,
   * single-timezone program record, not a multi-region log.
   */
  at: string;
  /** Category label. Doubles as the non-color cue for the accent styling. */
  kind: string;
  /** EST numbers this update touches, if any. Drives the jump-to-line action. */
  est?: string[];
  headline: string;
  /** Who reported it, shown as the trailing attribution. */
  source?: string;
}

const AT_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

export interface ParsedAt {
  date: Date;
  /** False when only a date was given, so the time is not shown or implied. */
  hasTime: boolean;
}

/**
 * Parses an entry's `at` into a local Date. Built component-wise rather than
 * handed to `new Date(string)`, which reads date-only strings as UTC and
 * date-time strings as local — a mismatch that would shift whole days.
 */
export function parseAt(at: string): ParsedAt | null {
  const m = AT_RE.exec(at);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m;
  return {
    date: new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      hh ? Number(hh) : 0,
      mm ? Number(mm) : 0
    ),
    hasTime: hh !== undefined,
  };
}

/** Feed entries, newest first. Drops any entry with an unparseable date. */
export function sortUpdates(list: UpdateEntry[]): UpdateEntry[] {
  return list
    .filter((u) => parseAt(u.at) !== null)
    .sort((a, b) => parseAt(b.at)!.date.getTime() - parseAt(a.at)!.date.getTime());
}

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** Absolute stamp for a feed item: "08.07.26" or "08.07.26 · 3:03 PM". */
export function formatStamp(at: string): string {
  const p = parseAt(at);
  if (!p) return at;
  const { date, hasTime } = p;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const stamp = `${mm}.${dd}.${yy}`;
  return hasTime ? `${stamp} · ${TIME_FMT.format(date)}` : stamp;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Freshness label for the newest entry — the part that reads as "live".
 * Only ever called client-side, after mount, so the server and the browser
 * never disagree about what "now" is.
 */
export function relativeTime(at: string, now: Date): string {
  const p = parseAt(at);
  if (!p) return "";
  const diff = now.getTime() - p.date.getTime();
  if (diff < 0) return "just now";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** "EST 1002" / "EST 1002 + 1003" / "EST 1002 + 2 more" for the item tag. */
export function formatEstTag(est: string[] | undefined): string | null {
  if (!est || est.length === 0) return null;
  if (est.length === 1) return `EST ${est[0]}`;
  if (est.length === 2) return `EST ${est[0]} + ${est[1]}`;
  return `EST ${est[0]} + ${est.length - 1} more`;
}
