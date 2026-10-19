import { computeDay, dateKey, formatClock, formatDuration, keyToDate } from '../lib/time.js';

export default function History({ punches, today, viewDate, nowSec, target, use12h, onSelect }) {
  const keys = [...new Set([today, ...Object.keys(punches)])]
    .filter((k) => k <= today)
    .sort()
    .reverse()
    .slice(0, 14);

  const rows = keys.map((key) => ({
    key,
    day: computeDay(punches[key] || [], { now: nowSec, isToday: key === today, target }),
  }));

  // This week (Mon → today)
  const t = keyToDate(today);
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const weekRows = rows.filter((r) => r.key >= dateKey(monday) && r.day.status !== 'none');
  const weekWorked = weekRows.reduce((s, r) => s + r.day.worked, 0);
  const weekTarget = weekRows.length * target;

  return (
    <section className="card history">
      <div className="card-head">
        <h3>History</h3>
        <span className="week-sum">
          This week <b className="mono">{formatDuration(weekWorked)}</b>
          {weekTarget > 0 && (
            <em className={weekWorked >= weekTarget ? 'pos' : 'neg'}>
              {weekWorked >= weekTarget ? '+' : '−'}
              {formatDuration(Math.abs(weekWorked - weekTarget))}
            </em>
          )}
        </span>
      </div>

      <ul className="history-list">
        {rows.map(({ key, day }) => {
          const d = keyToDate(key);
          const pct = Math.min(1, day.worked / target);
          const badge =
            day.status === 'none' ? ['—', 'idle'] : day.status === 'missing' ? ['!', 'warn'] : day.completed ? ['✓', 'ok'] : ['✕', 'bad'];
          return (
            <li key={key}>
              <button className={`history-row ${key === viewDate ? 'active' : ''}`} onClick={() => onSelect(key)}>
                <span className="h-date">
                  <b>{d.toLocaleDateString(undefined, { weekday: 'short' })}</b>
                  {d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </span>
                <span className="h-times mono">
                  {formatClock(day.firstIn, use12h)} → {day.status === 'in' ? 'now' : formatClock(day.lastOut, use12h)}
                </span>
                <span className="h-bar">
                  <i style={{ width: `${pct * 100}%` }} className={day.completed ? 'ok' : ''} />
                </span>
                <span className="h-worked mono">{formatDuration(day.worked)}</span>
                <span className={`h-badge ${badge[1]}`}>{badge[0]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
