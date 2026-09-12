# SIFGuard — Backend & Database Integration Report

**Scope:** How to move the dashboard from in-memory mock data (`src/data/mockData.ts`) to a
real backend + database, what the NLP pipeline service looks like, and what else becomes
possible once data is server-side.

---

## 1. Executive summary & recommended stack

The app was built with a clean seam: every page reads from typed domain models
(`Site`, `LsrMappingRow`, `SifAlert`, `NlpResult` in `src/types.ts`). Those types map
1:1 to database tables, so integration is mechanical, not a rewrite.

| Layer | Recommendation (SIH demo) | Production alternative |
|---|---|---|
| API framework | **FastAPI (Python)** — same language as the ML/NLP stack, auto OpenAPI docs | Same, or NestJS if the team is JS-only |
| Database | **PostgreSQL 16 + pgvector** | Same + read replicas |
| ORM / migrations | SQLModel or SQLAlchemy 2 + Alembic | Same |
| Async jobs (OCR/NLP) | FastAPI `BackgroundTasks` for demo → **Celery/Redis** or RQ for scale | Celery + Redis / SQS |
| Realtime alerts | **WebSocket** (FastAPI native) | Same behind Redis pub/sub fan-out |
| Auth | JWT (access + refresh), roles in claims | SSO (Azure AD / Google Workspace) |
| File storage | Local volume (demo) | S3-compatible (S3 / MinIO) + presigned URLs |
| Frontend data layer | **TanStack Query** + a generated typed client | Same |
| Deployment | **docker-compose** on one VM (EC2 free tier / Render) | K8s or ECS, managed Postgres (RDS/Neon) |

**Why FastAPI + Postgres specifically:**
- The NLP work (transformers, OCR, embeddings) is Python — no cross-language boundary for the core IP.
- **pgvector** turns the LSR mapping from a hardcoded threshold into a real semantic-search problem:
  embed the report narrative, embed the 9 rule descriptions, map by cosine similarity. That is a
  defensible SIH demo, not a lookup table.
- FastAPI auto-generates OpenAPI → `openapi-typescript` generates a typed frontend client, keeping
  the existing strict TypeScript intact.

---

## 2. Architecture

```
┌─────────────┐   HTTPS/WS   ┌──────────────────┐        ┌─────────────────────┐
│ React (Vite)│◄────────────►│  FastAPI Gateway  │───────►│ PostgreSQL + pgvector│
│  this repo  │  REST + WS   │  auth · CRUD · WS │        │ sites · reports ·   │
└─────────────┘              │                   │        │ mappings · alerts   │
                             │  POST /reports/.. │        └─────────────────────┘
                             │    → enqueue job  │        ┌─────────────────────┐
                             └────────┬──────────┘───────►│ Redis (queue+pubsub)│
                                      │                   └──────────┬──────────┘
                             ┌────────▼──────────┐        ┌──────────▼──────────┐
                             │ Object storage    │        │ Celery worker(s)    │
                             │ raw PDF/CSV/TXT   │        │ OCR → NER → classify│
                             └───────────────────┘        │ → embed → map → save│
                                                          └─────────────────────┘
```

Data flow for the upload page: `POST /api/reports` stores the file + row (`status=queued`),
publishes a job; the worker runs the pipeline, updates the row (`status=done`), writes the
extraction; the frontend polls `GET /api/reports/{id}/analysis` or subscribes to
`WS /ws/reports/{id}` for progress (replaces the simulated `setInterval` progress bar with
real stage callbacks).

---

## 3. API contract (v1)

Base: `/api` · Auth: `Authorization: Bearer <jwt>` · Errors: `{ code, message, details }`

| Method & path | Maps to (current mock) | Notes |
|---|---|---|
| `POST /auth/login` · `POST /auth/refresh` | — (none) | Returns `{access, refresh, user}` |
| `GET /metrics/overview` | `METRICS` | One endpoint powering the 4 dashboard cards + deltas |
| `GET /sites` · `GET /sites/{id}` | `SITES`, `SITE_BY_ID` | Includes `riskScore`, `trend[]`, `interventions[]` |
| `GET /sites/{id}/insights` | `SITE_INSIGHTS` | Radar, leading precursors, risk trend |
| `GET /heatmap` | `HEAT_CELLS` | Derived from sites; server computes level buckets |
| `GET /trend?months=10` | `TREND_SERIES` | `reports`, `precursors`, `sifEvents` per month |
| `GET /alerts?active=true&severity=` | `ALERT_SEED` + stream | `GET` for history; **WS** for live |
| `POST /alerts/{id}/acknowledge` | Dashboard ✕ button | Writes `acknowledged_by/at` — audit-ready |
| `POST /reports` (multipart) | Upload dropzone | Returns `{reportId, jobId}`; validate MIME + size server-side |
| `GET /reports/{id}/analysis` | `NLP_RESULTS` | Status, progress, stage, entities, keywords, confidence |
| `GET /lsr/rules` | `LSR_RULES` | The 9-rule catalog with descriptions (used for embeddings) |
| `GET /lsr/rows?q=&status=&rule=` | `LSR_ROWS` + LsrMapping filters | Server-side search/filter/paginate |
| `PATCH /mappings/{id}` | "Manual Review" badge | **Human-in-the-loop correction** → feeds retraining set |
| `GET /analytics/incident-types?site=` | `RiskPrioritization` charts | Bar/pie breakdowns |
| `GET /prioritization` | Ranked queue | Server computes composite score server-side |

**Sample — `POST /api/reports` response:**
```json
{ "reportId": "SR-2486", "jobId": "job_01J9...", "status": "queued",
  "wsProgress": "/ws/reports/job_01J9..." }
```

**Sample — `GET /api/reports/{id}/analysis` (done):**
```json
{ "status": "done", "progress": 100, "confidence": 0.96, "risk": "Critical",
  "entities": [{ "type": "EQUIPMENT", "value": "EOT crane gantry", "score": 0.93 }],
  "keywords": [{ "term": "harness not attached", "weight": 0.91 }],
  "mapping": { "ruleId": "LSR-01", "similarity": 0.96, "status": "Mapped" } }
```

---

## 4. Database schema (PostgreSQL + pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('hse_lead','site_supervisor','auditor')),
  site_id       UUID,                      -- null = all sites (hse_lead)
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,        -- 'SBG-01'
  name        TEXT NOT NULL,
  region      TEXT NOT NULL,
  city        TEXT NOT NULL,
  headcount   INT NOT NULL DEFAULT 0,
  risk_score  NUMERIC(5,2) DEFAULT 0,      -- recomputed nightly + on ingest
  last_audit  DATE,
  geom        GEOGRAPHY(Point, 4326)       -- optional PostGIS for map view
);

CREATE TABLE lsr_rules (
  id          TEXT PRIMARY KEY,            -- 'LSR-01'
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  embedding   vector(384)                  -- MiniLM/L6-v2 (or IndicSBERT) of description
);

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,       -- 'SR-2481'
  site_id      UUID REFERENCES sites(id),
  uploaded_by  UUID REFERENCES users(id),
  file_key     TEXT NOT NULL,              -- object-storage key
  mime         TEXT NOT NULL,
  raw_text     TEXT,
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','processing','done','error')),
  error        TEXT,
  embedding    vector(384),                -- of raw_text
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON reports (site_id, created_at DESC);
CREATE INDEX ON reports USING hnsw (embedding vector_cosine_ops);

CREATE TABLE extractions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  entities    JSONB NOT NULL,              -- [{type, value, score}]
  keywords    JSONB NOT NULL,
  confidence  NUMERIC(5,2) NOT NULL,
  precursor   TEXT NOT NULL,
  risk_level  TEXT NOT NULL CHECK (risk_level IN ('Critical','High','Medium','Low')),
  stages      JSONB NOT NULL               -- per-stage counts/durations
);

CREATE TABLE mappings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     UUID REFERENCES reports(id),
  rule_id       TEXT REFERENCES lsr_rules(id),  -- null = unmapped
  similarity    NUMERIC(5,2),             -- cosine score (real 'confidence')
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','mapped','manual_review','confirmed','rejected')),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  correction    TEXT                      -- human-corrected rule, for retraining
);

CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID REFERENCES sites(id),
  report_id     UUID REFERENCES reports(id),
  precursor     TEXT NOT NULL,
  rule_id       TEXT REFERENCES lsr_rules(id),
  severity      TEXT NOT NULL CHECK (severity IN ('Critical','High','Medium','Low')),
  confidence    NUMERIC(5,2),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON alerts (created_at DESC) WHERE acknowledged_at IS NULL;

CREATE TABLE interventions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID REFERENCES sites(id),
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','done','verified')),
  assigned_to UUID REFERENCES users(id),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID REFERENCES users(id),
  action     TEXT NOT NULL,               -- 'alert.acknowledge', 'mapping.correct'
  entity     TEXT NOT NULL, entity_id TEXT NOT NULL,
  meta       JSONB,
  at         TIMESTAMPTZ DEFAULT now()
);
```

**Key design decisions**
- `mappings.similarity` is the real confidence; the 75/90 thresholds live **once** server-side
  (config row or env), eliminating the duplicated magic numbers in the frontend.
- `mappings.correction` + status is the active-learning feedback set: `SELECT * FROM mappings
  WHERE status='confirmed' AND correction IS NOT NULL` is the next fine-tuning batch.
- pgvector HNSW index makes "top-3 similar rules for this report" a sub-millisecond query.
- `audit_log` gives the "who acknowledged what, when" trail safety auditors expect.

---

## 5. NLP pipeline service (Celery worker)

```
file → [1 OCR/extract] → [2 clean] → [3 NER] → [4 precursor classify] → [5 embed+map] → [6 persist]
```

| Stage | Tooling (demo-grade) | Production upgrade |
|---|---|---|
| 1. OCR / text | `pdfplumber` (PDF), `pandas` (CSV), plain read (TXT) | Tesseract for scans; Apache Tika |
| 2. Clean | lower/strip PII (names → roles), dedupe | Presidio PII redaction |
| 3. NER (SITE/DATE/EQUIPMENT/PERSON_ROLE/INJURY/ACTIVITY) | `transformers` token classifier (fine-tuned DistilBERT; **IndicBERT/AI4Bharat for Hindi-mixed text**) | Domain fine-tune on labelled plant reports |
| 4. Precursor classification | zero-shot or fine-tuned classifier over precursor taxonomy | Same, with active-learning loop (§7) |
| 5. Embed + map | `sentence-transformers` (MiniLM / IndicSBERT) → cosine vs `lsr_rules.embedding`; ≥0.75 → `mapped`, else `manual_review` | Cross-encoder reranker for top-k |
| 6. Persist + notify | write `extractions`+`mappings`; severity heuristics → `alerts` + Redis pub/sub → WS fan-out | Same |

The 4 progress stages the frontend already animates (Text extraction → Entity recognition →
Precursor classification → LSR rule mapping) map exactly to stages 1/3/4/5 — the simulation
becomes the truth with zero UI redesign.

---

## 6. Realtime layer

- **`WS /ws/alerts`**: server pushes new alerts (from Redis pub/sub) → replaces the Topbar and
  Dashboard `setInterval` streams. Backpressure: server caps at N msgs/min, client shows
  "reconnecting…" with exponential backoff — fixing the hidden-tab burst edge case for real.
- **`WS /ws/reports/{jobId}`**: per-file progress `{stage, progress}` → drives the existing
  `ProcessingPanel` for real.
- Fallback: SSE (`EventSource`) if corporate proxies block WS.

---

## 7. Auth & roles

| Role | Sites visible | Can do |
|---|---|---|
| `site_supervisor` | own site only | upload, acknowledge alerts, confirm/reject mappings |
| `hse_lead` | all | everything above + assign interventions + export |
| `auditor` | all (read-only) | read + export only |

JWT access (15 min) + refresh (7 d, rotating), roles in claims; every mutation writes
`audit_log`. The current profile-button no-op becomes the real account menu (profile, role,
logout) — closing an existing a11y gap.

---

## 8. Frontend changes in *this* repo (smaller than it sounds)

1. **`src/lib/api.ts`** — fetch wrapper: base URL from `VITE_API_URL`, JWT injection, refresh-on-401.
2. **Generate types** — `openapi-typescript` from FastAPI's `/openapi.json`; keep `src/types.ts`
   re-exporting the generated types so pages barely change.
3. **TanStack Query** — replace direct imports of `mockData` with `useQuery(['sites'])`,
   `useMutation(ackAlert)` etc. Invalidate-on-mutate gives correct cross-page consistency
   (acknowledging in the bell clears it on the dashboard — another known gap, solved for free).
4. **Swap import sites** — each page's `import { X } from '../data/mockData'` becomes a hook call;
   mockData stays as a dev fallback behind `VITE_USE_MOCKS=true` (demo insurance).
5. **Delete the fake timers** — Topbar/Dashboard `setInterval` streams → one WS hook
   `useLiveAlerts()`; localStorage persistence no longer needed server-side (session persists).

Estimated effort: **1.5–2 days** for steps 1–5 with the API contract above fixed.

---

## 9. Deployment

**docker-compose (demo-ready, one VM):** services `web` (nginx serving `dist/`),
`api` (uvicorn), `worker` (celery), `redis`, `db` (postgres+pgvector, init script creates
extension + schema + seed). `VITE_API_URL` baked at build.

**CI (GitHub Actions):** lint → `tsc --noEmit` → `vitest` → `vite build` → docker build →
push to registry → deploy hook. (The repo now installs clean via `npm ci` after the
node_modules untracking fix, so CI is straightforward.)

**India-relevant hosting for the hack:** AWS EC2 t3.small free tier or Render single service
for `db+api`; static frontend on Vercel/Netlify. Data residency note: worker-safety records
are sensitive — keep the DB in `ap-south-1` (Mumbai) and mention DPDP Act alignment in the pitch.

---

## 10. What more becomes possible (the "what else" list)

**Enabled directly by the backend**
1. **Human-in-the-loop retraining loop** — confirmed corrections accumulate as labelled data;
   scheduled fine-tune + model-version table; show "model v2 improved mapping accuracy 84%→91%"
   in the demo.
2. **Cross-site analytics at scale** — SQL over all sites: LSR compliance %, month-over-month,
   worst precursor per region; server-side aggregation instead of client `reduce`.
3. **Real notifications** — email (SMTP) and **WhatsApp (Gupshup/Meta Cloud API — Indian
   context, huge demo value)**: "Critical precursor at your site, tap to review".
4. **Geospatial** — PostGIS: site pins on a real India map, 50 km risk clusters, monsoon-season
   correlation.
5. **Scheduled digests** — Monday 8 AM "site safety brief" PDF generated server-side.
6. **Multilingual ingest** — reports in Hindi/Telugu/Tamil via IndicBERT/AI4Bharat models +
   translation fallback; UI i18n. Very strong SIH angle for Indian factory floors.
7. **Voice-to-report** — worker speaks the near-miss (WhatsApp voice note), Whisper STT → same
   pipeline. Accessibility + low-literacy win.
8. **IoT correlation** — ingest sensor streams (gas, vibration, wearable man-down) and correlate
   with narrative precursors; anomaly spikes (z-score) auto-generate alerts.
9. **Compliance packs** — one-click ISO 45001 / Factories Act 1948 evidence export from
   `audit_log` + mappings.
10. **SLA/escalation** — unacknowledged Critical alert > 15 min → escalate to next role
    (job queue + notification).

**Product polish unlocked by auth/roles**
- Assignment queue for Manual Review rows (assignee, due date, closure evidence photo).
- Read receipts on interventions; verification photos stored in object storage.
- Public transparency dashboard (sanitized aggregates) for the CSR/government pitch.

---

## 11. Phased plan

| Phase | Scope | Effort | Outcome |
|---|---|---|---|
| **P1 — Live demo backend** | FastAPI + Postgres schema above, upload→pipeline→results, WS alerts, JWT stub, docker-compose, frontend steps §8 | 3–4 days (2 dev) | No mocks anywhere; refresh-safe; real NLP on real files |
| **P2 — Differentiators** | pgvector semantic mapping + threshold config, human-in-loop corrections, roles + audit log, CSV/PDF export, WhatsApp alerts | 1–2 weeks | The SIH-winning story: real AI + human oversight + Indian context |
| **P3 — Production path** | Multi-tenant orgs, SSO, IoT ingest, IndicNLP + voice, PostGIS map, compliance packs, CI/CD + monitoring (Sentry/Prometheus) | 3–6 weeks | Pilotable with one plant, then a cluster |

**Top 5 risks:** (1) OCR quality on scanned plant documents — mitigate with pdfplumber-first +
Tesseract fallback and a "low text confidence" manual-entry path; (2) NER precision on
domain jargon — mitigate with a seed glossary per site; (3) WS behind client networks — SSE
fallback; (4) demo-day infra flakiness — keep `VITE_USE_MOCKS=true` escape hatch; (5) PII in
reports — redact names at stage 2 (Presidio) before storage.
