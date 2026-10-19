export const DAY = 86400;

export const pad = (n) => String(n).padStart(2, '0');

/** Local date key, e.g. "2026-10-19". */
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function nowSeconds(d = new Date()) {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/** Parses "9:52", "09:52:00", "6:30 PM" into seconds since midnight. */
export function parseTime(str) {
  if (!str) return null;
  const m = String(str)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const s = Number(m[3] || 0);
  const ap = m[4]?.toLowerCase();
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'p' && h !== 12) h += 12;
    if (ap === 'a' && h === 12) h = 0;
  }
  if (h > 23 || min > 59 || s > 59) return null;
  return h * 3600 + min * 60 + s;
}

export function formatClock(sec, use12 = true, withSec = false) {
  if (sec == null) return '--:--';
  const nextDay = sec >= DAY;
  sec = ((Math.round(sec) % DAY) + DAY) % DAY;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const tail = withSec ? `:${pad(s)}` : '';
  const out = use12
    ? `${pad(h % 12 || 12)}:${pad(m)}${tail} ${h < 12 ? 'AM' : 'PM'}`
    : `${pad(h)}:${pad(m)}${tail}`;
  return nextDay ? `${out} (+1d)` : out;
}

/** Value for <input type="time" step="1">. */
export function toInputValue(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${pad(h)}:${pad(m)}:${pad(sec % 60)}`;
}

export function formatDuration(sec, { seconds = false } = {}) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (seconds) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (h === 0) return `${m}m`;
  return `${h}h ${pad(m)}m`;
}

/**
 * Walks IN/OUT pairs and returns the clock time at which `target` seconds of
 * work are reached. For an open (still punched-in) segment the time is
 * projected, so it stays stable instead of drifting with "now".
 */
export function timeWhenReached(sorted, target, allowOpen) {
  let acc = 0;
  for (let i = 0; i < sorted.length; i += 2) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (end === undefined) return allowOpen ? start + (target - acc) : null;
    if (acc + (end - start) >= target) return start + (target - acc);
    acc += end - start;
  }
  return null;
}

/**
 * Punches alternate IN, OUT, IN, OUT… (sorted by time).
 * status: none | in | out | missing (open punch on a past day)
 */
export function computeDay(punches, { now, isToday, target }) {
  const sorted = [...punches].sort((a, b) => a - b);
  const segments = [];
  const breaks = [];
  let worked = 0;

  for (let i = 0; i < sorted.length; i += 2) {
    const start = sorted[i];
    let end = sorted[i + 1];
    const open = end === undefined;
    if (open) end = isToday ? Math.max(start, now) : start;
    worked += end - start;
    segments.push({ start, end, open });
  }
  for (let i = 1; i + 1 < sorted.length; i += 2) {
    breaks.push({ start: sorted[i], end: sorted[i + 1] });
  }

  const isOpen = sorted.length % 2 === 1;
  let status = 'none';
  if (sorted.length) status = isOpen ? (isToday ? 'in' : 'missing') : 'out';

  const completed = worked >= target;
  const leaveAt = timeWhenReached(sorted, target, status === 'in');

  return {
    sorted,
    segments,
    breaks,
    worked,
    breakSec: breaks.reduce((t, b) => t + (b.end - b.start), 0),
    status,
    completed,
    leaveAt,
    remaining: Math.max(0, target - worked),
    overtime: Math.max(0, worked - target),
    firstIn: sorted[0] ?? null,
    lastOut: !isOpen && sorted.length ? sorted[sorted.length - 1] : null,
  };
}

/**
 * Extracts punches from pasted text. Understands the HRMS "Punch History"
 * table ("19/10/2026  09:52:00", DD/MM/YYYY) and also bare times, which are
 * assigned to `fallbackKey`. Returns { [dateKey]: seconds[] }.
 */
export function parsePunchText(text, fallbackKey) {
  const byDate = {};
  const add = (key, t) => {
    if (t == null) return;
    (byDate[key] ||= []).push(t);
  };

  const dated =
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})[\s,|T]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)/gi;
  let m;
  let found = false;
  while ((m = dated.exec(text))) {
    found = true;
    add(`${m[3]}-${pad(m[2])}-${pad(m[1])}`, parseTime(m[4]));
  }

  if (!found) {
    const bare = /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)/gi;
    while ((m = bare.exec(text))) add(fallbackKey, parseTime(m[1]));
  }
  return byDate;
}
