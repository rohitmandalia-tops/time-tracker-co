import { formatClock, nowSeconds } from '../lib/time.js';

export default function Header({ now, use12h }) {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <div>
            <h1>Time Track</h1>
            <p>Punch in · count down · head out</p>
          </div>
        </div>
        <div className="live-clock" aria-label="Current time">
          <span className="pulse" />
          <span className="mono">{formatClock(nowSeconds(now), use12h, true)}</span>
        </div>
      </div>
    </header>
  );
}
