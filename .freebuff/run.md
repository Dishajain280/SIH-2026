# SIFGuard Dashboard — Run Doc (SIH 2026)

Vite + React 18 + TypeScript + Tailwind CSS v4 + Recharts + Lucide + React Router.

## How to reproduce the artifacts

From the project root (`C:\Users\LENOVO\Desktop\SIH`):

1. Install dependencies with the project's package manager (npm; there is a `package-lock.json`):
   ```
   npm install
   ```
2. If npm reports pending install scripts, approve esbuild so its binary is installed:
   ```
   npm approve-scripts esbuild --yes
   ```
3. No `.env.local` or other secret env files are needed — the app is fully client-side with mock data.
4. Typecheck / production build (optional verification):
   ```
   npx tsc --noEmit
   npm run build
   ```

## How to run the dev server

1. Start Vite (default port 5173; use `-- --port 5173` if that port is taken):
   ```
   npm run dev
   ```
2. Dev URL: `http://localhost:5173/` (Vite prints the exact port at startup — confirm in the log before sharing).
3. Routes: `/` Dashboard, `/upload` Upload & NLP Analysis, `/lsr-mapping` LSR Mapping, `/risk` Risk Prioritization, `/insights` Site Insights.
4. Stop the server by killing the recorded process id (see preview registration) or Ctrl+C if foregrounded.
