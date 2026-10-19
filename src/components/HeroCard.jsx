import { formatClock, formatDuration, timeWhenReached } from '../lib/time.js';

const R = 96;
const C = 2 * Math.PI * R;

export default function HeroCard({ day, settings, isToday }) {
  const { use12h, targetMin, halfDayMin } = settings;
  const target = targetMin * 60;
  const pct = Math.min(1, day.worked / target);
  const tone = day.completed ? 'done' : day.status;

  let label, headline, sub;
  switch (true) {
    case day.status === 'none':
      label = 'No punches';
      headline = '--:--';
      sub = isToday ? 'Add your punch-in time below to start tracking.' : 'Nothing recorded for this day.';
      break;
    case day.completed:
      label = `${formatDuration(target)} completed`;
      headline = formatClock(day.leaveAt, use12h);
      sub = `Completed at ${formatClock(day.leaveAt, use12h)} · +${formatDuration(day.overtime)} extra`;
      break;
    case day.status === 'in':
      label = 'You can leave at';
      headline = formatClock(day.leaveAt, use12h);
      sub = `${formatDuration(day.remaining, { seconds: true })} to go`;
      break;
    case day.status === 'out':
      label = 'Punched out';
      headline = formatDuration(day.remaining);
      sub = 'still short of the target — punch in again to continue.';
      break;
    default:
      label = 'Punch missing';
      headline = formatDuration(day.worked);
      sub = 'Odd number of punches — an OUT punch is missing for this day.';
  }

  const milestones = [
    { name: 'Half day', sec: halfDayMin * 60 },
    { name: 'Full day', sec: target },
  ].map((m) => ({
    ...m,
    at: timeWhenReached(day.sorted, m.sec, day.status === 'in'),
    reached: day.worked >= m.sec,
  }));

  return (
    <section className={`card hero tone-${tone}`}>
      <div className="ring-wrap">
        <svg viewBox="0 0 220 220" className="ring" role="img" aria-label={`${Math.round(pct * 100)}% of target`}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--ring-a)" />
              <stop offset="100%" stopColor="var(--ring-b)" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r={R} className="ring-track" />
          <circle
            cx="110"
            cy="110"
            r={R}
            className="ring-bar"
            stroke="url(#ringGrad)"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 110 110)"
          />
        </svg>
        <div className="ring-center">
          <span className="ring-label">Worked</span>
          <span className="ring-value mono">{formatDuration(day.worked, { seconds: true })}</span>
          <span className="ring-pct">
            {Math.round(pct * 100)}% of {formatDuration(target)}
          </span>
        </div>
      </div>

      <div className="hero-info">
        <span className={`pill pill-${tone}`}>
          <span className="dot" />
          {{ none: 'Not punched in', in: 'In office', out: 'On break / out', missing: 'Punch missing', done: 'Target reached' }[tone]}
        </span>
        <p className="hero-label">{label}</p>
        <p className="hero-headline mono">{headline}</p>
        <p className="hero-sub">{sub}</p>

        <ul className="milestones">
          {milestones.map((m) => (
            <li key={m.name} className={m.reached ? 'reached' : ''}>
              <span className="ms-check">{m.reached ? '✓' : ''}</span>
              <span className="ms-name">
                {m.name} <small>({formatDuration(m.sec)})</small>
              </span>
              <span className="ms-time mono">{m.at != null ? formatClock(m.at, use12h) : '—'}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
