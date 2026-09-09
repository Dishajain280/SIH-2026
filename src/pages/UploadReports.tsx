import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  Braces,
  CheckCircle2,
  FileText,
  FileUp,
  Link2,
  Loader2,
  ScanSearch,
  UploadCloud,
} from 'lucide-react'
import { cn, fmtSize } from '../lib/utils'
import type { NlpResult, UploadResult } from '../types'
import { NLP_RESULTS } from '../data/mockData'
import { ConfidenceBar, RiskBadge, SectionTitle, StatusBadge } from '../components/ui'

const ACCEPT = '.csv,.pdf,.txt,.doc,.docx,.md'

const SAMPLE_REPORT = `Near-miss report — Casting Bay 2, 06 Sep 2026.
During the afternoon shift, a rigger climbed the EOT crane gantry at approximately 14 meters to replace a worn beam clamp. The harness he carried was not attached to any anchor point; the lanyard remained hooked on the dorsal D-ring only. A crane lift of 3.2 t was simultaneously in progress over the adjacent aisle. The spotter on the floor noticed the unsecured lanyard and halted the lift via emergency stop. No injury occurred. Supervisor intervention: work was stopped for 40 minutes while a certified anchor sling was rigged. The crew had skipped the pre-task briefing because the previous shift overran.`

const SAMPLE_STAGES = ['Text extraction', 'Entity recognition', 'Precursor classification', 'LSR rule mapping']

const ENTITY_COLORS: Record<string, string> = {
  SITE: 'bg-navy-100 text-navy-800 border-navy-200',
  DATE: 'bg-navy-50 text-navy-500 border-navy-100',
  EQUIPMENT: 'bg-gold-100 text-gold-700 border-gold-300',
  PERSON_ROLE: 'bg-navy-800 text-white border-navy-800',
  INJURY: 'bg-red-50 text-red-700 border-red-200',
  ACTIVITY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

type Phase = 'idle' | 'processing' | 'done'

function Dropzone({ onFiles }: { onFiles: (names: string[]) => void }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDrag(false)
      const names = Array.from(e.dataTransfer.files).map((f) => f.name)
      onFiles(names.length ? names : ['pasted_report.txt'])
    },
    [onFiles]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={cn(
        'group relative cursor-pointer rounded-md border-2 border-dashed p-10 text-center transition-all',
        drag ? 'border-gold-500 bg-gold-50' : 'border-navy-200 bg-white hover:border-navy-300 hover:bg-navy-50/50'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const names = Array.from(e.target.files ?? []).map((f) => f.name)
          onFiles(names.length ? names : ['pasted_report.txt'])
          e.target.value = ''
        }}
      />
      <div
        className={cn(
          'mx-auto flex h-14 w-14 items-center justify-center rounded-sm transition-colors',
          drag ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-gold-500'
        )}
      >
        <UploadCloud className="h-7 w-7" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-navy-900">
        {drag ? 'Release to run NLP extraction' : 'Drag & drop safety reports here'}
      </p>
      <p className="mt-1 text-[12.5px] text-navy-400">
        CSV · PDF · TXT · DOCX — unstructured shift logs, near-miss reports, audit notes
      </p>
      <p className="mt-3 font-mono text-[11px] text-navy-300">or click to browse · max 25 MB per file</p>
    </div>
  )
}

function ProcessingPanel({ stage, progress }: { stage: string; progress: number }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-navy-900 text-gold-500">
          <ScanSearch className="h-5 w-5" />
          <span className="animate-scanline absolute inset-x-1 h-0.5 rounded bg-gold-500/80" />
        </span>
        <div>
          <div className="text-sm font-bold text-navy-900">AI extraction in progress…</div>
          <div className="text-[12px] text-navy-400">Transformer NLP pipeline · GPU node sif-gpu-02</div>
        </div>
        <Loader2 className="ml-auto h-5 w-5 animate-spin text-gold-600" />
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy-600 via-navy-400 to-gold-500 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-navy-400">
        <span>{stage}</span>
        <span className="tnum">{Math.round(progress)}%</span>
      </div>

      <ol className="mt-5 space-y-2.5">
        {SAMPLE_STAGES.map((s, i) => {
          const active = s === stage
          const done = progress >= ((i + 1) / SAMPLE_STAGES.length) * 100
          return (
            <li key={s} className="flex items-center gap-3 text-[13px]">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-navy-200" />
              )}
              <span className={cn(done || active ? 'font-medium text-navy-800' : 'text-navy-300')}>{s}</span>
              {done && <span className="ml-auto text-[11px] text-emerald-600">complete</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ExtractionView({ r }: { r: NlpResult }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Raw report */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText className="h-4 w-4 text-gold-600" /> Raw Unstructured Report
          </h3>
          <span className="font-mono text-[11px] text-navy-300">{r.name}</span>
        </div>
        <div className="p-5">
          <div className="whitespace-pre-wrap rounded-sm border border-navy-100 bg-navy-50/60 p-4 font-mono text-[12.5px] leading-relaxed text-navy-700">
            {r.rawText}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-navy-300">
            <span>{fmtSize(r.size)} · ingested via secure upload</span>
            <span className="font-mono">{r.reportId}</span>
          </div>
        </div>
      </div>

      {/* AI extraction */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Braces className="h-4 w-4 text-gold-600" /> AI-Extracted Intelligence
          </h3>
          <ConfidenceBar value={r.confidence} label="model confidence" />
        </div>
        <div className="space-y-5 p-5">
          {/* Entities */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">Named Entities</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.entities.map((e) => (
                <span
                  key={e.type + e.value}
                  className={cn('inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11.5px] font-medium', ENTITY_COLORS[e.type])}
                  title={`${e.type} · confidence ${(e.score * 100).toFixed(0)}%`}
                >
                  <span className="text-[9.5px] font-bold opacity-60">{e.type}</span>
                  {e.value}
                  <span className="tnum text-[10px] opacity-70">{(e.score * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">Flagged Keywords</h4>
            <div className="mt-2 space-y-1.5">
              {r.keywords.map((k) => (
                <div key={k.term} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-[12.5px] text-navy-700">{k.term}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${k.weight * 100}%` }} />
                  </div>
                  <span className="tnum w-8 text-right text-[11px] font-semibold text-navy-500">
                    {Math.round(k.weight * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="rounded-sm border border-navy-100 bg-navy-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Predicted precursor</span>
              <RiskBadge level={r.risk} />
              <StatusBadge status={r.mappingStatus} />
            </div>
            <p className="mt-2 text-[13.5px] font-semibold text-navy-900">{r.precursor}</p>
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-navy-500">
              <Link2 className="h-3.5 w-3.5 text-gold-600" />
              Mapped to <b className="text-navy-800">{r.rule}</b>
              <span className="font-mono text-[11px] text-navy-300">{r.ruleId}</span>
            </div>
          </div>

          {/* Pipeline counts */}
          <div>
            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
              <Activity className="h-3.5 w-3.5" /> Pipeline Output
            </h4>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {r.pipeline.map((p) => (
                <div key={p.stage} className="rounded-sm border border-navy-100 px-3 py-2">
                  <div className="tnum text-lg font-bold leading-none text-navy-900">{p.count}</div>
                  <div className="mt-1 text-[11px] text-navy-400">{p.stage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UploadReports() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(SAMPLE_STAGES[0])
  const [files, setFiles] = useState<UploadResult[]>([])
  const [resultIdx, setResultIdx] = useState(0)
  const [demoText, setDemoText] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startProcessing = useCallback((names: string[]) => {
    const now = Date.now()
    setFiles((prev) => [
      ...names.map((name, i) => ({
        name,
        size: 18_000 + ((now + i * 977) % 480_000),
        status: 'queued' as const,
        progress: 0,
        reportId: `SR-${2486 + i}`,
      })),
      ...prev,
    ])
    setPhase('processing')
    setProgress(0)
    setStage(SAMPLE_STAGES[0])

    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 3 + Math.random() * 5
        const pct = Math.min(next, 100)
        const idx = Math.min(Math.floor(pct / (100 / SAMPLE_STAGES.length)), SAMPLE_STAGES.length - 1)
        setStage(SAMPLE_STAGES[idx])
        if (pct >= 100) {
          if (timer.current) clearInterval(timer.current)
          setPhase('done')
          setFiles((prev) => prev.map((f) => (f.status !== 'done' ? { ...f, status: 'done', progress: 100 } : f)))
        }
        return pct
      })
    }, 220)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const result = NLP_RESULTS[resultIdx]

  return (
    <div className="animate-fade-up space-y-6">
      <SectionTitle
        icon={<FileUp className="h-4.5 w-4.5" />}
        title="Upload Reports & NLP Analysis"
        sub="Ingest unstructured safety reports — the AI extracts entities, precursors and LSR mappings"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Dropzone onFiles={startProcessing} />
        </div>

        {phase === 'processing' ? (
          <ProcessingPanel stage={stage} progress={progress} />
        ) : (
          <div className="card p-5">
            <h3 className="card-title mb-3">
              <FileText className="h-4 w-4 text-gold-600" /> Paste Sample Text
            </h3>
            <textarea
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              rows={5}
              placeholder="Paste an incident narrative to analyze…"
              className="input resize-none font-mono text-[12px]"
            />
            <div className="mt-3 flex gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  setDemoText(SAMPLE_REPORT)
                  startProcessing(['pasted_narrative.txt'])
                }}
              >
                <ScanSearch className="h-4 w-4" /> Load sample & analyze
              </button>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-navy-400">
              Tip: the sample narrates an unanchored work-at-height event near a suspended load — a classic hidden SIF
              precursor.
            </p>
          </div>
        )}
      </div>

      {/* Ingestion queue */}
      {files.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <FileUp className="h-4 w-4 text-gold-600" /> Ingestion Queue
            </h2>
            <span className="text-[11px] text-navy-300">{files.length} file(s)</span>
          </div>
          <div className="divide-y divide-navy-50">
            {files.map((f) => (
              <div key={f.reportId + f.name} className="flex items-center gap-4 px-5 py-3">
                <FileText className="h-4 w-4 shrink-0 text-navy-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-navy-900">{f.name}</span>
                    <span className="font-mono text-[11px] text-navy-300">{f.reportId}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={cn('h-full rounded-full transition-[width]', f.status === 'done' ? 'bg-emerald-500' : 'bg-gold-500')}
                      style={{ width: `${f.status === 'done' ? 100 : 0}%` }}
                    />
                  </div>
                </div>
                {f.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">Analyzed reports:</span>
          {NLP_RESULTS.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setResultIdx(i)}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-colors',
                i === resultIdx
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300'
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
        <ExtractionView r={result} />
      </div>
    </div>
  )
}
