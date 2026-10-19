import { formatClock, formatDuration } from '../lib/time.js';

export default function StatsGrid({ day, settings }) {
  const { use12h } = settings;
  const stats = [
    { label: 'First In', value: formatClock(day.firstIn, use12h), icon: '→', accent: 'indigo' },
    {
      label: day.completed ? 'Overtime' : 'Remaining',
      value: day.status === 'none' ? '—' : formatDuration(day.completed ? day.overtime : day.remaining),
      icon: day.completed ? '+' : '⏳',
      accent: day.completed ? 'green' : 'amber',
    },
    { label: 'Break Taken', value: formatDuration(day.breakSec), icon: '☕', accent: 'pink' },
    {
      label: day.status === 'in' ? 'Expected Out' : 'Last Out',
      value: formatClock(day.status === 'in' ? day.leaveAt : day.lastOut, use12h),
      icon: '←',
      accent: 'cyan',
    },
  ];

  return (
    <section className="stats">
      {stats.map((s) => (
        <div key={s.label} className={`card stat accent-${s.accent}`}>
          <span className="stat-icon">{s.icon}</span>
          <span className="stat-label">{s.label}</span>
          <span className="stat-value mono">{s.value}</span>
        </div>
      ))}
    </section>
  );
}
