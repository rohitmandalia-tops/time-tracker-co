import { formatClock, formatDuration } from '../lib/time.js';

export default function Timeline({ day, nowSec, isToday, use12h }) {
  if (day.status === 'none') return null;

  const points = [...day.sorted, day.leaveAt, isToday ? nowSec : null].filter((v) => v != null);
  const start = Math.floor((Math.min(...points) - 1800) / 3600) * 3600;
  const end = Math.ceil((Math.max(...points) + 1800) / 3600) * 3600;
  const span = end - start;
  const pos = (sec) => `${((sec - start) / span) * 100}%`;
  const width = (a, b) => `${((b - a) / span) * 100}%`;

  const hours = [];
  for (let h = start; h <= end; h += 3600) hours.push(h);
  const step = hours.length > 10 ? 2 : 1;

  return (
    <section className="card timeline-card">
      <div className="card-head">
        <h3>Day timeline</h3>
        <div className="legend">
          <span><i className="lg-work" /> Working</span>
          <span><i className="lg-break" /> Break</span>
          <span><i className="lg-target" /> Out time</span>
        </div>
      </div>

      <div className="timeline">
        <div className="tl-track">
          {day.segments.map((s, i) => (
            <div
              key={`w${i}`}
              className={`tl-seg tl-work ${s.open ? 'open' : ''}`}
              style={{ left: pos(s.start), width: width(s.start, s.end) }}
              title={`Worked ${formatDuration(s.end - s.start)} (${formatClock(s.start, use12h)} – ${formatClock(s.end, use12h)})`}
            />
          ))}
          {day.breaks.map((b, i) => (
            <div
              key={`b${i}`}
              className="tl-seg tl-break"
              style={{ left: pos(b.start), width: width(b.start, b.end) }}
              title={`Break ${formatDuration(b.end - b.start)}`}
            />
          ))}
          {day.status === 'in' && !day.completed && (
            <div
              className="tl-seg tl-pending"
              style={{ left: pos(nowSec), width: width(nowSec, day.leaveAt) }}
              title={`${formatDuration(day.remaining)} remaining`}
            />
          )}
          {day.leaveAt != null && (
            <div className="tl-marker tl-target" style={{ left: pos(day.leaveAt) }}>
              <span>{formatClock(day.leaveAt, use12h)}</span>
            </div>
          )}
          {isToday && nowSec >= start && nowSec <= end && (
            <div className="tl-marker tl-now" style={{ left: pos(nowSec) }}>
              <span>Now</span>
            </div>
          )}
        </div>
        <div className="tl-hours">
          {hours.map((h, i) =>
            i % step === 0 ? (
              <span key={h} style={{ left: pos(h) }}>
                {use12h ? `${(Math.floor(h / 3600) % 12) || 12}${Math.floor(h / 3600) % 24 < 12 ? 'a' : 'p'}` : `${Math.floor(h / 3600) % 24}:00`}
              </span>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}
