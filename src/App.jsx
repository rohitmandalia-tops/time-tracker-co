import { useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorage from './lib/useLocalStorage.js';
import { computeDay, dateKey, formatClock, formatDuration, keyToDate, nowSeconds } from './lib/time.js';
import Header from './components/Header.jsx';
import HeroCard from './components/HeroCard.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import Timeline from './components/Timeline.jsx';
import PunchPanel from './components/PunchPanel.jsx';
import History from './components/History.jsx';
import Settings from './components/Settings.jsx';

const DEFAULT_SETTINGS = { targetMin: 540, halfDayMin: 270, use12h: true, notify: false };

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [punches, setPunches] = useLocalStorage('tt.punches', {});
  const [settings, setSettings] = useLocalStorage('tt.settings', DEFAULT_SETTINGS);
  // null = follow "today" (rolls over automatically at midnight)
  const [pickedDate, setPickedDate] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = dateKey(now);
  const viewDate = pickedDate ?? today;
  const isToday = viewDate === today;
  const target = settings.targetMin * 60;
  const nowSec = nowSeconds(now);

  const day = useMemo(
    () => computeDay(punches[viewDate] || [], { now: nowSec, isToday, target }),
    [punches, viewDate, nowSec, isToday, target]
  );

  const setDayPunches = (key, list) =>
    setPunches((prev) => {
      const next = { ...prev };
      const clean = [...new Set(list)].sort((a, b) => a - b);
      if (clean.length) next[key] = clean;
      else delete next[key];
      return next;
    });

  const mergePunches = (byDate) =>
    setPunches((prev) => {
      const next = { ...prev };
      for (const [key, list] of Object.entries(byDate)) {
        next[key] = [...new Set([...(next[key] || []), ...list])].sort((a, b) => a - b);
      }
      return next;
    });

  // Live tab title so you can glance at it from any tab.
  useEffect(() => {
    if (!isToday || day.status === 'none') document.title = 'Time Track';
    else if (day.completed) document.title = `✅ ${settings.targetMin / 60}h done · +${formatDuration(day.overtime)}`;
    else if (day.status === 'in')
      document.title = `⏳ ${formatDuration(day.remaining)} left · Out ${formatClock(day.leaveAt, settings.use12h)}`;
    else document.title = `⏸ On break · ${formatDuration(day.remaining)} left`;
  }, [isToday, day, settings.use12h, settings.targetMin]);

  // Browser notifications: 15 minutes before, and when the target is reached.
  const fired = useRef(new Set());
  useEffect(() => {
    if (!settings.notify || !isToday || day.status !== 'in') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const fire = (id, title, body) => {
      const key = `${today}:${id}`;
      if (fired.current.has(key)) return;
      fired.current.add(key);
      new Notification(title, { body, icon: '/favicon.svg' });
    };
    if (day.completed) fire('done', '🎉 Day complete!', `You've worked ${formatDuration(day.worked)}. Time to head out.`);
    else if (day.remaining <= 15 * 60)
      fire('soon', '⏰ Almost there', `${formatDuration(day.remaining)} left · out at ${formatClock(day.leaveAt, settings.use12h)}`);
  }, [settings.notify, settings.use12h, isToday, today, day]);

  const viewLabel = keyToDate(viewDate).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="app">
      <div className="bg-glow" aria-hidden="true" />
      <Header now={now} use12h={settings.use12h} />

      <main className="container">
        <div className="day-bar">
          <div>
            <p className="eyebrow">{isToday ? 'Today' : 'Viewing'}</p>
            <h2 className="day-title">{viewLabel}</h2>
          </div>
          <div className="day-actions">
            <input
              type="date"
              className="input"
              value={viewDate}
              max={today}
              onChange={(e) => setPickedDate(e.target.value && e.target.value !== today ? e.target.value : null)}
              aria-label="Choose day"
            />
            {!isToday && (
              <button className="btn btn-ghost" onClick={() => setPickedDate(null)}>
                Back to today
              </button>
            )}
          </div>
        </div>

        <HeroCard day={day} settings={settings} isToday={isToday} />
        <StatsGrid day={day} settings={settings} isToday={isToday} />
        <Timeline day={day} nowSec={nowSec} isToday={isToday} use12h={settings.use12h} />

        <div className="grid-2">
          <PunchPanel
            viewDate={viewDate}
            isToday={isToday}
            day={day}
            nowSec={nowSec}
            use12h={settings.use12h}
            onChange={(list) => setDayPunches(viewDate, list)}
            onImport={mergePunches}
          />
          <History
            punches={punches}
            today={today}
            viewDate={viewDate}
            nowSec={nowSec}
            target={target}
            use12h={settings.use12h}
            onSelect={(key) => setPickedDate(key === today ? null : key)}
          />
        </div>

        <Settings settings={settings} onChange={setSettings} />

        <footer className="footer">
          Data stays in this browser (localStorage). Nothing is sent anywhere.
        </footer>
      </main>
    </div>
  );
}
