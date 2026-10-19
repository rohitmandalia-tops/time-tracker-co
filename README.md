# Time Track

Enter your punch-in time and see when 9 hours will be done, how long is left, and whether today's target is met.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Deploy to Vercel

- **CLI:** `npx vercel` (then `npx vercel --prod`)
- **Git:** push this folder to GitHub/GitLab → "Add New Project" on vercel.com → import it. Vercel detects Vite; `vercel.json` already sets the build command and output folder.

## Features

- Live countdown, expected out time, progress ring, half/full-day milestones
- Multiple IN/OUT punches with breaks subtracted automatically
- **Import from HRMS:** copy the Punch History table (`19/10/2026 09:52:00` rows) and paste it in
- Day timeline, 14-day history, and a running weekly total
- Configurable target (default 9h), 12/24h clock, browser notifications
- All data stays in the browser's localStorage
