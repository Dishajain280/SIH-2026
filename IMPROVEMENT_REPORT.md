# SIFGuard — Improvement & Edge-Case Report

**Scope:** Full audit of the SIH 2026 dashboard (`src/`) as of Sep 2026.
**Goal:** What to add next, what breaks under stress, and what to fix before the demo.

---

## 1. Executive summary

The app is a polished, fully client-side prototype: 5 pages, live-simulated alert feeds,
NLP-extraction theater, and a consistent design system. The biggest gaps are:

1. **Everything is in-memory** — refresh loses all state; there is no persistence or backend.
2. **The alert feed grows unbounded** — `setInterval` streams run while the tab is hidden and are never cleared on logout/unmount in some paths.
3. **No loading/empty/error states** — every screen assumes happy-path data exists.
4. **A few a11y and correctness nits** remain (nested buttons, tooltip text duplication in the a11y tree).

For a hackathon demo this is a strong base; the sections below triage what to invest in.

---

## 2. Feature gaps — what more the website can have

### 2.1 Data & persistence (highest impact)
| Idea | Why it matters |
|---|---|
| **localStorage/IndexedDB persistence layer** | Survive refreshes during a live demo; keep acknowledged alerts, applied filters, selected site. |
| **Real backend (Express/FastAPI) + REST contract** | Swap `mockData.ts` behind a typed `api/` client so the same UI runs on live model output. |
| **WebSocket/SSE instead of `setInterval`** | Honest "live" feed; also fixes the hidden-tab drift problem (see §3.2). |
| **Auth (mock or real)** | Role-based views: HSE lead vs site supervisor vs auditor; audit trail of who acknowledged what. |
| **Report history & versioning** | Re-open a previously analyzed report; diff re-analyses when the model improves. |

### 2.2 Analytics depth
| Idea | Why it matters |
|---|---|
| **Time-range selector** (7d/30d/90d/custom) on every chart | Judges ask "show me only this quarter" — currently impossible. |
| **Cross-filtering** (click a bar → filter the table) | Turns static charts into an exploratory tool. |
| **LSR compliance rate per site** (mapped vs total %) | The single KPI safety officers actually report on. |
| **Forecast/projection band** on the trend chart | "Precursors projected to hit 50 by Nov" is a killer demo line. |
| **Export**: CSV + PDF one-pager per site | Real-world adoption requires offline reporting. |
| **Geographic map view** (real India map with site pins) | The current "heatmap" is a tile grid; an actual map reads better for "8 sites across India". |

### 2.3 NLP / upload page
| Idea | Why it matters |
|---|---|
| **Editable extraction review** — let the user correct entities/rule mapping, feeding a "human-in-the-loop" story | Strong SIH differentiator: model improves from corrections. |
| **Multi-file batch results table** with per-file status | Current queue is cosmetic; results only show 3 hardcoded docs. |
| **Real file parsing** (client-side PDF.js/CSV parse for the demo) | Even a naive parse proves the pipeline isn't canned. |
| **Drag-and-drop re-ordering / file preview thumbnails** | Polish. |
| **Confidence threshold slider** — interactively change the ≥75 mapping cutoff and watch badges flip | Directly demonstrates the "Manual Review" logic. |

### 2.4 Collaboration & workflow
- **Acknowledge with a note + assignee** on alerts (currently a bare acknowledge).
- **Assignment queue**: turn "Manual Review" rows into assignable tasks with due dates.
- **Comments/mentions** on any report row.
- **Shareable filtered views** (URL query params encode filters — also makes demos linkable).
- **Email/Slack-style digest** mock: "Monday morning safety brief" generated from the data.

### 2.5 Delight for judges
- Guided tour overlay (`intro.js`-style) with a scripted 60-second story.
- "What the AI saw" highlight overlay — hover a keyword in the extraction pane and the exact words glow in the raw text.
- Command palette (extend the existing `Ctrl+K` to actions, not just site search).
- Print stylesheet for the one-pager export.

---

## 3. Edge cases & failure modes

### 3.1 State & data
| Edge case | Current behavior | Fix |
|---|---|---|
| Browser refresh mid-demo | All state (alerts acknowledged, filters, uploads) resets | Persist to localStorage (see §2.1) |
| Two tabs open simultaneously | Each tab runs its own fake feed; acknowledged in one stays in the other | `storage` event sync or backend |
| LSR row with `confidence` exactly 75/90 | Boundary works (>=), but thresholds are magic numbers in 3 files | Extract to shared constants |
| Report text containing HTML/`<script>` | React escapes by default — safe, but document it | Keep; add eslint react/no-danger |
| Extremely long report text | Raw pane scrolls, but table cell `max-w` truncation may hide the only critical phrase | Add expandable cell + `title` already present; consider word-level search highlight |
| Unicode/emoji/Hindi-Marathi report text | Fonts render, but `fmt` uses `en-IN` grouping only; NLP theater ignores locale | Add a Devanagari sample to mock data for inclusivity points |
| File > 25 MB or 0-byte file | Dropzone ignores; no client validation feedback | Validate size/type on drop, show inline error |
| 100+ files dropped at once | Ingestion queue renders all; progress bar logic applies to the batch, not per-file | Cap concurrent processing, per-file progress |

### 3.2 Timers & lifecycle (real bugs, demo-visible)
| Edge case | Current behavior | Fix |
|---|---|---|
| Tab hidden for 10 min | `setInterval` throttles; on return, a burst of queued alerts arrives at once | Use `document.visibilitychange` to pause, or timestamp alerts on arrival |
| LiveAlerts unmounts while paused | Timer cleared (effect cleanup exists) — OK | None |
| Topbar feed + Dashboard feed both run | Two independent 9s/14s streams double the noise | Hoist to a shared context/store (also fixes §2.1) |
| `ALERT_SEED` ids collide with streamed ids after "Clear all" | Streamed `AL-3400+i` can repeat `key`s if the interval fires twice in the same ms | Use `crypto.randomUUID()` |
| System clock skew | "just now" labels are hardcoded strings, not derived | Generate `Date.now()` and format relative time |

### 3.3 Layout & responsiveness
| Edge case | Current behavior | Fix |
|---|---|---|
| 320 px phones | Sidebar overlays fine, but tables need 900 px horizontal scroll; heatmap tiles go 2-up and text clips | Add card-style responsive table fallback |
| Tablet (768–1024) | Metric cards 2-up, heatmap 4-up — good; TrendChart legend may wrap | Test `Legend` `wrapperStyle` maxWidth |
| Ultra-wide (2560+) | Content capped at 1440 px (good) — but sidebar stays fixed 264 px, leaving big empty margins | Optionally add a collapsed icon-only sidebar at `2xl` |
| Landscape mobile keyboards (search) | `Ctrl+K` hint is irrelevant on touch | Hide the `kbd` hints behind `pointer: fine` media query |
| Print | Not styled; charts may clip | `@media print` stylesheet (also serves §2.2 export) |
| Windows high-contrast / forced colors | `:where` focus ring uses brand colors that may be overridden | Add `forced-colors` fallbacks |

### 3.4 Accessibility (beyond the pass already done)
- **Nested interactive elements**: the alert feed row contains a button inside a div row — fine — but the bell dropdown's rows are `button` containing `RiskBadge span` + text — fine. The **heatmap legend** and **LSR table expand chevron** are OK. One real one: **Topbar profile is a `button` wrapping text and chevron** with no menu — it announces as clickable but does nothing. Either open a menu or make it non-interactive.
- **UxHint tooltip duplication**: screen readers hear the hint twice (icon `aria-label` + tooltip text). Use `aria-describedby` instead.
- **Live region politeness**: the dashboard feed is `aria-live="polite"` and streams every 9 s — verbose for SR users. Add a "mute announcements" toggle.
- **Color-only encoding** on the heatmap for Medium vs High is mitigated by labels + tooltips — good; keep verifying with a deuteranopia simulator.
- **Focus management**: opening the bell dropdown doesn't move focus into it; Escape closes but focus stays on the trigger (acceptable) — moving focus to the first item would be better.
- **`tabIndex={-1}` on `<main>`** is good for skip-link targets — keep.

### 3.5 Performance
| Item | Current | Risk | Action |
|---|---|---|---|
| Bundle | 697 kB min / ~194 kB gzip, single chunk | First paint on slow 4G ~3–4 s | Route-level `React.lazy` (biggest win: recharts) |
| Recharts re-mounts | Charts remount on every page nav | Nav jank | Keep pages mounted (`display:none` route caching) or accept |
| AnimatedNumber | One RAF per card | Negligible | Fine |
| Sparkline draw-in | `stroke-dasharray` animation runs even offscreen | Negligible | Fine |
| `stagger` CSS | Runs on every re-render of children (keys change) | Minor | Keep keys stable |
| Alert feed | Unbounded 12-item cap exists | Fine | Fine |

### 3.6 Security & privacy (real-world deployment)
- **No CSP**; Vite dev server is not hardened — fine for demo, not for production.
- **File upload has no sanitization** (names rendered as text — React-safe; still validate MIME server-side in production).
- **No authN/authZ** — anyone with the URL sees all safety data; in production this is legally sensitive (worker safety records).
- **No rate-limit/backoff** on the simulated feed — in production, a real stream needs reconnect + exponential backoff.

### 3.7 Code quality / tech debt
- `mockData.ts` is a single 400-line module — split by domain as it grows.
- Types are good (`strict: true`), but `ChartTip` uses `any` for Recharts props — type it loosely with `Payload[]`.
- Two small dead helpers remain in `utils.ts` (`confBadge`/`confBar` duplicate the logic now inline in `ConfidenceBar`) — consolidate.
- The `StatusBadge`/`RiskBadge` glyph SVGs could move to a tiny `Icon` component.
- No tests. Minimum viable: vitest + RTL smoke tests per page + a Playwright happy-path (upload → analyze → map → prioritize).

---

## 4. Prioritized action list

### P0 — before the demo (≤ 1 day total)
1. Persist acknowledged alerts + filters to localStorage (survives a mid-demo refresh).
2. Pause live feeds on `visibilitychange` (prevents the 10-min-tab burst).
3. Fix the profile-button no-op (announces clickable, does nothing).
4. Add a `<title>`-driven favicon/OG image polish + `meta theme-color`.
5. Build a 320 px pass on the LSR table (cards instead of horizontal scroll).

### P1 — strong differentiators (1–3 days)
6. Human-in-the-loop editable extraction (§2.3) — best SIH story.
7. Confidence-threshold slider flipping badges live.
8. CSV/PDF export (§2.2).
9. Route-level code splitting (drop initial JS by ~60%).
10. URL-encoded filter state (shareable demo links).

### P2 — production path (post-hackathon)
11. Backend + WebSocket feed + auth (§2.1, §3.6).
12. Real file parsing and batch results.
13. Vitest/RTL + Playwright smoke suite in CI.
14. India-map geographic view.
15. CSP + upload hardening.

---

## 5. Known non-issues (verified, do not re-litigate)
- `npm run build` exits 0 after the node_modules untracking fix (Sep 2026); `npm ci` → build path is the deploy contract.
- React StrictMode double-invoke is handled in `AnimatedNumber` (RAF cleanup, no ref guard).
- `prefers-reduced-motion` disables count-ups, sparkline draw-in, and all transitions.
- The deploy exit-126 root cause (committed Windows node_modules) is fixed by `.gitignore` + `.gitattributes`; commit + push remains with the user.
