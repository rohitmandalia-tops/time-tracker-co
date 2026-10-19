import { useState } from 'react';
import { formatClock, formatDuration, parsePunchText, parseTime, toInputValue } from '../lib/time.js';

export default function PunchPanel({ viewDate, isToday, day, nowSec, use12h, onChange, onImport }) {
  const [time, setTime] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState(null);

  const add = (sec) => {
    if (sec == null) return;
    if (day.sorted.includes(sec)) {
      setMessage({ type: 'warn', text: 'That punch already exists.' });
      return;
    }
    onChange([...day.sorted, sec]);
    setTime('');
    setMessage(null);
  };

  const handleImport = () => {
    const byDate = parsePunchText(pasteText, viewDate);
    const days = Object.keys(byDate);
    const count = days.reduce((n, k) => n + byDate[k].length, 0);
    if (!count) {
      setMessage({ type: 'warn', text: 'No times found. Paste rows like "19/10/2026 09:52:00".' });
      return;
    }
    onImport(byDate);
    setPasteText('');
    setShowPaste(false);
    setMessage({ type: 'ok', text: `Imported ${count} punch${count > 1 ? 'es' : ''} across ${days.length} day${days.length > 1 ? 's' : ''}.` });
  };

  return (
    <section className="card punches">
      <div className="card-head">
        <h3>Punches</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowPaste((v) => !v)}>
          {showPaste ? 'Close' : '⇩ Import from HRMS'}
        </button>
      </div>

      {showPaste && (
        <div className="paste-box">
          <p className="hint">
            Select the <b>Punch History</b> table on your HRMS dashboard, copy it, and paste here. Each
            date is filed under the right day automatically.
          </p>
          <textarea
            className="input"
            rows={5}
            placeholder={'19/10/2026\t09:52:00\n16/10/2026\t18:36:00\n16/10/2026\t09:36:00'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleImport} disabled={!pasteText.trim()}>
            Import punches
          </button>
        </div>
      )}

      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          add(parseTime(time));
        }}
      >
        <input
          type="time"
          step="1"
          className="input mono"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Punch time"
          required
        />
        <button type="submit" className="btn btn-primary">
          + Add {day.sorted.length % 2 === 0 ? 'IN' : 'OUT'}
        </button>
        {isToday && (
          <button type="button" className="btn btn-ghost" onClick={() => add(nowSec)} title="Add current time">
            Punch now
          </button>
        )}
      </form>

      {message && <p className={`msg msg-${message.type}`}>{message.text}</p>}

      {day.sorted.length === 0 ? (
        <div className="empty">
          <span>🕘</span>
          <p>No punches yet. Add your punch-in time{isToday ? ' (e.g. 09:52:00)' : ''}.</p>
        </div>
      ) : (
        <ol className="punch-list">
          {day.sorted.map((sec, i) => {
            const isIn = i % 2 === 0;
            const prev = day.sorted[i - 1];
            const note =
              i === 0 ? 'Start of day' : isIn ? `Break ${formatDuration(sec - prev)}` : `Worked ${formatDuration(sec - prev)}`;
            return (
              <li key={sec} className={isIn ? 'in' : 'out'}>
                <span className={`tag tag-${isIn ? 'in' : 'out'}`}>{isIn ? 'IN' : 'OUT'}</span>
                <input
                  type="time"
                  step="1"
                  className="input input-inline mono"
                  defaultValue={toInputValue(sec)}
                  key={`${viewDate}-${sec}`}
                  onBlur={(e) => {
                    const v = parseTime(e.target.value);
                    if (v != null && v !== sec) onChange(day.sorted.map((s) => (s === sec ? v : s)));
                  }}
                  aria-label={`Edit ${isIn ? 'in' : 'out'} punch`}
                />
                <span className="punch-12h">{use12h ? formatClock(sec, true) : ''}</span>
                <span className="punch-note">{note}</span>
                <button
                  className="icon-btn"
                  onClick={() => onChange(day.sorted.filter((s) => s !== sec))}
                  aria-label="Delete punch"
                  title="Delete"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {day.sorted.length > 0 && (
        <button
          className="btn btn-danger btn-sm clear-btn"
          onClick={() => window.confirm('Clear all punches for this day?') && onChange([])}
        >
          Clear day
        </button>
      )}
    </section>
  );
}
