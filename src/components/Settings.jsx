import { useState } from 'react';

export default function Settings({ settings, onChange }) {
  const [open, setOpen] = useState(false);
  const set = (patch) => onChange((s) => ({ ...s, ...patch }));

  const toggleNotify = async () => {
    if (settings.notify) return set({ notify: false });
    if (typeof Notification === 'undefined') return alert('Notifications are not supported in this browser.');
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') set({ notify: true });
    else alert('Notification permission was denied.');
  };

  const minutesField = (label, key) => {
    const total = settings[key];
    const update = (h, m) => set({ [key]: Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m)) });
    return (
      <label className="field">
        <span>{label}</span>
        <div className="hm">
          <input type="number" className="input mono" min="0" max="23" value={Math.floor(total / 60)}
            onChange={(e) => update(Number(e.target.value) || 0, total % 60)} />
          <small>h</small>
          <input type="number" className="input mono" min="0" max="59" value={total % 60}
            onChange={(e) => update(Math.floor(total / 60), Number(e.target.value) || 0)} />
          <small>m</small>
        </div>
      </label>
    );
  };

  return (
    <section className="card settings">
      <button className="card-head settings-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <h3>⚙ Settings</h3>
        <span className="chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="settings-body">
          {minutesField('Daily target', 'targetMin')}
          {minutesField('Half day', 'halfDayMin')}
          <label className="field switch-field">
            <span>12-hour clock</span>
            <button className={`switch ${settings.use12h ? 'on' : ''}`} onClick={() => set({ use12h: !settings.use12h })} aria-pressed={settings.use12h} />
          </label>
          <label className="field switch-field">
            <span>Notify me (15 min before &amp; at completion)</span>
            <button className={`switch ${settings.notify ? 'on' : ''}`} onClick={toggleNotify} aria-pressed={settings.notify} />
          </label>
        </div>
      )}
    </section>
  );
}
