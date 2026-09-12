import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  Braces,
  CheckCircle2,
  FileText,
  FileUp,
  Link2,
  Loader2,
  PenLine,
  ScanSearch,
  UploadCloud,
} from 'lucide-react'
import { cn, fmtSize } from '../lib/utils'
import type { Entity, ExtractionCorrection, LsrStatus, NlpResult, UploadResult } from '../types'
import { NLP_RESULTS, LSR_RULES } from '../data/mockData'
import { ConfidenceBar, PageHeader, RiskBadge, StatusBadge, UxHint } from '../components/ui'

const ACCEPT = '.csv,.pdf,.txt,.doc,.docx,.md'

const CORRECTION_STORAGE_KEY = 'sifguard.corrections.v1'

function loadCorrections(): Record<string, ExtractionCorrection[]> {
  try {
    const raw = localStorage.getItem(CORRECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ExtractionCorrection[]>
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function clearCorrections(): void {
  try {
    localStorage.removeItem(CORRECTION_STORAGE_KEY)
  } catch {
    // no-op
  }
}

function saveCorrections(map: Record<string, ExtractionCorrection[]>): void {
  try {
    localStorage.setItem(CORRECTION_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // no-op
  }
}

const ENTITY_COLORS: Record<string, string> = {
  SITE: 'bg-navy-100 text-navy-800 border-navy-200',
  DATE: 'bg-navy-50 text-navy-500 border-navy-100',
  EQUIPMENT: 'bg-gold-100 text-gold-700 border-gold-300',
  PERSON_ROLE: 'bg-navy-800 text-white border-navy-800',
  INJURY: 'bg-red-50 text-red-700 border-red-200',
  ACTIVITY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function totalCorrections(nlpId: string, corrections: Record<string, ExtractionCorrection[]>): number {
  return (corrections[nlpId] ?? []).length
}

// ------------------------------------------------ "what the AI saw" grounding --
interface TextMatch {
  start: number
  end: number
  /** Index of the keyword that produced this match. */
  kw: number
}

/**
 * Locate the exact spans in the raw narrative that back each flagged keyword.
 * Matches the full phrase where present, and falls back to its significant words
 * (≥5 chars) so the grounding is visible even when the report paraphrases.
 * Overlapping candidates are resolved longest-first.
 */
function findHighlights(text: string, keywords: { term: string; weight: number }[]): TextMatch[] {
  const lower = text.toLowerCase()
  const candidates: TextMatch[] = []

  keywords.forEach((k, ki) => {
    const needles = new Set<string>()
    const full = k.term.trim().toLowerCase()
    if (full.length >= 4) needles.add(full)
    full
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 5)
      .forEach((w) => needles.add(w))

    needles.forEach((needle) => {
      let from = 0
      for (;;) {
        const i = lower.indexOf(needle, from)
        if (i === -1) break
        candidates.push({ start: i, end: i + needle.length, kw: ki })
        from = i + needle.length
      }
    })
  })

  candidates.sort((a, b) => b.end - b.start - (a.end - a.start))
  const chosen: TextMatch[] = []
  for (const c of candidates) {
    if (chosen.some((x) => c.start < x.end && x.start < c.end)) continue
    chosen.push(c)
  }
  return chosen.sort((a, b) => a.start - b.start)
}

/**
 * Renders the raw narrative with the evidence for each keyword highlighted.
 * When one keyword is hovered/focused, its spans glow and the rest recede.
 */
function GroundedText({
  text,
  keywords,
  active,
}: {
  text: string
  keywords: { term: string; weight: number }[]
  active: number | null
}) {
  const marks = useMemo(() => findHighlights(text, keywords), [text, keywords])
  if (marks.length === 0) return <>{text}</>

  const out: ReactNode[] = []
  let cursor = 0
  marks.forEach((m, i) => {
    if (m.start > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, m.start)}</span>)
    const isActive = active === null || active === m.kw
    out.push(
      <mark
        key={`m${i}`}
        data-kw={m.kw}
        className={cn(
          'rounded-[2px] px-0.5 transition-colors duration-150',
          isActive
            ? 'bg-gold-300/70 text-navy-950'
            : 'bg-transparent text-navy-200'
        )}
      >
        {text.slice(m.start, m.end)}
      </mark>
    )
    cursor = m.end
  })
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>)
  return <>{out}</>
}

function commit(
  nlpId: string,
  field: ExtractionCorrection['field'],
  before: string | number,
  after: string | number,
  corrections: Record<string, ExtractionCorrection[]>
): void {
  if (before === after) return
  const record: ExtractionCorrection = { nlpId, field, before, after, at: Date.now() }
  const next: Record<string, ExtractionCorrection[]> = { ...corrections }
  next[nlpId] = [...(next[nlpId] ?? []), record]
  saveCorrections(next)
}

const SAMPLE_REPORT = `Near-miss report — Casting Bay 2, 06 Sep 2026.
During the afternoon shift, a rigger climbed the EOT crane gantry at approximately 14 meters to replace a worn beam clamp. The harness he carried was not attached to any anchor point; the lanyard remained hooked on the dorsal D-ring only. A crane lift of 3.2 t was simultaneously in progress over the adjacent aisle. The spotter on the floor noticed the unsecured lanyard and halted the lift via emergency stop. No injury occurred. Supervisor intervention: work was stopped for 40 minutes while a certified anchor sling was rigged. The crew had skipped the pre-task briefing because the previous shift overran.`

const SAMPLE_STAGES = ['Text extraction', 'Entity recognition', 'Precursor classification', 'LSR rule mapping']

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

function CorrectionBadge({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-gold-300 bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
      <PenLine className="h-3 w-3" />
      {count} correction{count !== 1 ? 's' : ''}
    </span>
  )
}

function EditableEntity({
  entity,
  idx,
  corrections,
  nlpId,
  onCommit,
}: {
  entity: Entity
  idx: number
  corrections: Record<string, ExtractionCorrection[]>
  nlpId: string
  onCommit: (nlpId: string, field: ExtractionCorrection['field'], before: string | number, after: string | number, corrections: Record<string, ExtractionCorrection[]>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(entity.value)
  const [score, setScore] = useState(entity.score)

  const existing = (corrections[nlpId] ?? []).filter((c) => c.field === 'entity' && c.before === idx).pop()
  const effective = existing
    ? { ...entity, value: String(existing.after), score: typeof existing.after === 'number' ? existing.after : entity.score }
    : entity
  const curValue = editing ? value : effective.value
  const curScore = editing ? score : effective.score

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors',
        editing ? 'border-gold-400 bg-gold-50 ring-1 ring-gold-300' : 'ring-0',
        ENTITY_COLORS[effective.type]
      )}
    >
      {editing ? (
        <>
          <span className="text-[9.5px] font-bold opacity-60">{effective.type}</span>
          <input
            aria-label="Entity value"
            className="min-w-0 flex-1 bg-transparent px-0 py-0 text-[11.5px] font-medium"
            value={curValue}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && finish()}
            onBlur={finish}
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            aria-label="Entity confidence"
            className="w-12 shrink-0 rounded-sm border border-navy-200 bg-white px-1 text-center text-[10px] font-semibold"
            value={curScore}
            onChange={(e) => setScore(Math.max(0, Math.min(1, Number(e.target.value) || 0)))}
            onBlur={finish}
          />
          <button
            className="shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-navy-600"
            onClick={() => setEditing(false)}
            aria-label="Done editing entity"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="text-[9.5px] font-bold opacity-60">{effective.type}</span>
          <span>{curValue}</span>
          <span className="tnum text-[10px] opacity-70">{(curScore * 100).toFixed(0)}%</span>
          <button
            className="ml-0.5 shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-gold-700"
            onClick={() => {
              setValue(entity.value)
              setScore(entity.score)
              setEditing(true)
            }}
            aria-label={`Edit entity ${entity.type}: ${entity.value}`}
          >
            <PenLine className="h-3 w-3" />
          </button>
        </>
      )}
    </span>
  )

  function finish(): void {
    if (curValue !== entity.value) onCommit(nlpId, 'entity', idx, curValue, corrections)
    if (Math.abs(curScore - entity.score) > 0.001) onCommit(nlpId, 'entity', idx, curScore, corrections)
    setEditing(false)
  }
}

function EditableKeyword({
  kw,
  idx,
  corrections,
  nlpId,
  onCommit,
  active,
  onHover,
}: {
  kw: { term: string; weight: number }
  idx: number
  corrections: Record<string, ExtractionCorrection[]>
  nlpId: string
  onCommit: (nlpId: string, field: ExtractionCorrection['field'], before: string | number, after: string | number, corrections: Record<string, ExtractionCorrection[]>) => void
  /** True when this keyword is the one being grounded in the raw text. */
  active?: boolean
  onHover?: (idx: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [term, setTerm] = useState(kw.term)
  const [weight, setWeight] = useState(kw.weight)

  const existing = (corrections[nlpId] ?? []).find((c) => c.field === 'keyword' && c.before === idx)
  const base = existing
    ? { term: String(existing.after), weight: typeof existing.after === 'number' ? existing.after : kw.weight }
    : kw
  const curTerm = editing ? term : base.term
  const curWeight = editing ? weight : base.weight

  return (
    <div
      onMouseEnter={() => onHover?.(idx)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'flex items-center gap-3 rounded-sm px-1 transition-colors',
        editing ? 'bg-gold-50 -mx-2 px-2 py-1 ring-1 ring-gold-300' : '',
        active && !editing ? 'bg-gold-50/70' : ''
      )}
    >
      <span className={cn('min-w-0 flex-1', editing ? 'w-0' : 'w-44')}>
        {editing ? (
          <input
            aria-label="Keyword term"
            className="min-w-0 bg-transparent px-0 py-0 text-[12.5px] text-navy-700"
            value={curTerm}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && finish()}
            onBlur={finish}
          />
        ) : (
          <span className="truncate text-[12.5px] text-navy-700">{curTerm}</span>
        )}
      </span>
      {editing ? (
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          aria-label="Keyword weight"
          className="w-24 h-1 accent-gold-600 cursor-pointer"
          value={curWeight}
          onChange={(e) => setWeight(Number(e.target.value))}
          onBlur={finish}
        />
      ) : (
        <div className="h-1.5 flex-[2] overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-gold-500" style={{ width: `${curWeight * 100}%` }} />
        </div>
      )}
      <span className="tnum w-8 text-right text-[11px] font-semibold text-navy-500 shrink-0">
        {Math.round(curWeight * 100)}
      </span>
      {editing ? (
        <button
          className="shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-navy-600"
          onClick={() => setEditing(false)}
          aria-label="Done editing keyword"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          className="shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-gold-700"
          onClick={() => {
            setTerm(kw.term)
            setWeight(kw.weight)
            setEditing(true)
          }}
          aria-label={`Edit keyword ${kw.term}`}
        >
          <PenLine className="h-3 w-3" />
        </button>
      )}
    </div>
  )

  function finish(): void {
    if (curTerm !== kw.term) onCommit(nlpId, 'keyword', idx, curTerm, corrections)
    if (Math.abs(curWeight - kw.weight) > 0.001) onCommit(nlpId, 'keyword', idx, curWeight, corrections)
    setEditing(false)
  }
}

function ExtractionView({
  r,
  corrections,
  onCommit,
}: {
  r: NlpResult
  corrections: Record<string, ExtractionCorrection[]>
  onCommit: (nlpId: string, field: ExtractionCorrection['field'], before: string | number, after: string | number, corrections: Record<string, ExtractionCorrection[]>) => void
}) {
  // Key corrections by REPORT ID so they flow into the LSR Mapping registry.
  const key = r.reportId
  const corrCount = totalCorrections(key, corrections)

  const [editingPrecursor, setEditingPrecursor] = useState(false)
  const [precursorText, setPrecursorText] = useState(r.precursor)
  const [editingRule, setEditingRule] = useState(false)
  const [ruleText, setRuleText] = useState(r.ruleId)
  const [flash, setFlash] = useState(0)
  /** Keyword index currently hovered/focused — dims everything else in the raw text. */
  const [activeKw, setActiveKw] = useState<number | null>(null)

  // Re-flash the correction badge on each committed edit.
  useEffect(() => {
    if (corrCount > 0) setFlash((f) => f + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrCount])

  const effectivePrecursor =
    (corrections[key] ?? []).find((x) => x.field === 'precursor')
      ? String((corrections[key] ?? []).find((x) => x.field === 'precursor')!.after)
      : r.precursor
  const effectiveRuleId =
    (corrections[key] ?? []).find((x) => x.field === 'ruleId')
      ? String((corrections[key] ?? []).find((x) => x.field === 'ruleId')!.after)
      : r.ruleId
  const effectiveConfidence =
    (corrections[key] ?? []).find((x) => x.field === 'confidence')
      ? Number((corrections[key] ?? []).find((x) => x.field === 'confidence')!.after)
      : r.confidence

  const entities = r.entities.map((e, i) => {
    const c = (corrections[key] ?? []).find((x) => x.field === 'entity' && x.before === i)
    return c
      ? { ...e, value: String(c.after), score: typeof c.after === 'number' ? c.after : e.score }
      : e
  })
  const keywords = r.keywords.map((k, i) => {
    const c = (corrections[key] ?? []).find((x) => x.field === 'keyword' && x.before === i)
    return c ? { ...k, term: String(c.after), weight: typeof c.after === 'number' ? c.after : k.weight } : k
  })

  const rule = effectiveRuleId !== '—' && effectiveRuleId !== '' ? LSR_RULES.find((rl) => rl.id === effectiveRuleId) : null
  const mappingStatus: LsrStatus = effectiveConfidence >= 75 ? 'Mapped' : 'Manual Review'

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Raw report */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText className="h-4 w-4 text-gold-600" /> Raw Unstructured Report
            <UxHint>Highlighted spans are the exact words behind each flagged keyword. Hover a keyword to isolate its evidence.</UxHint>
          </h3>
          <span className="font-mono text-[11px] text-navy-300">{r.name}</span>
        </div>
        <div className="p-5">
          <div className="whitespace-pre-wrap rounded-sm border border-navy-100 bg-navy-50/60 p-4 font-mono text-[12.5px] leading-relaxed text-navy-700">
            <GroundedText text={r.rawText} keywords={keywords} active={activeKw} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-navy-300">
            <span>
              {fmtSize(r.size)} · ingested via secure upload
              {activeKw !== null && keywords[activeKw] ? (
                <span className="ml-2 font-medium text-gold-700">showing evidence for “{keywords[activeKw].term}”</span>
              ) : null}
            </span>
            <span className="font-mono">{r.reportId}</span>
          </div>
        </div>
      </div>

      {/* AI extraction — editable */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Braces className="h-4 w-4 text-gold-600" /> AI-Extracted Intelligence
            {corrCount > 0 ? <CorrectionBadge key={flash} count={corrCount} /> : null}
          </h3>
          <ConfidenceBar value={effectiveConfidence} label="model confidence" />
        </div>
        <div className="space-y-5 p-5">
          {/* Confidence editor */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Override confidence</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label="Confidence override slider"
              className="flex-1 h-1 accent-gold-600 cursor-pointer"
              value={effectiveConfidence}
              onChange={(e) => onCommit(key, 'confidence', r.confidence, Number(e.target.value), corrections)}
            />
            <span className="w-10 text-right tnum text-[13px] font-bold text-navy-900">
              {Math.round(effectiveConfidence)}%
            </span>
            <span className="text-[11px] text-navy-400">
              {mappingStatus === 'Mapped' ? '→ mapped' : '→ manual review'}
            </span>
          </div>

          {/* Entities */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
              Named Entities <span className="font-normal text-navy-300">(click to edit)</span>
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {entities.map((e, i) => (
                <EditableEntity
                  key={e.type + e.value + i}
                  entity={e}
                  idx={i}
                  corrections={corrections}
                  nlpId={key}
                  onCommit={onCommit}
                />
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
              Flagged Keywords <span className="font-normal text-navy-300">(click to edit)</span>
            </h4>
            <div className="mt-2 space-y-1.5">
              {keywords.map((k, i) => (
                <EditableKeyword
                  key={k.term + i}
                  kw={k}
                  idx={i}
                  corrections={corrections}
                  nlpId={key}
                  onCommit={onCommit}
                  active={activeKw === i}
                  onHover={setActiveKw}
                />
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="rounded-sm border border-navy-100 bg-navy-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Predicted precursor</span>
              <RiskBadge level={r.risk} />
              <StatusBadge status={mappingStatus} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {editingPrecursor ? (
                <input
                  autoFocus
                  aria-label="Precursor text"
                  className="flex-1 rounded-sm border border-navy-200 bg-white px-2 py-1 text-[13.5px] font-semibold text-navy-900"
                  value={precursorText}
                  onChange={(e) => setPrecursorText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCommit(key, 'precursor', r.precursor, precursorText, corrections)
                      setEditingPrecursor(false)
                    }
                    if (e.key === 'Escape') setEditingPrecursor(false)
                  }}
                  onBlur={() => {
                    if (precursorText !== effectivePrecursor) onCommit(key, 'precursor', r.precursor, precursorText, corrections)
                    setEditingPrecursor(false)
                  }}
                />
              ) : (
                <p className="text-[13.5px] font-semibold text-navy-900">{effectivePrecursor}</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-navy-500">
              <Link2 className="h-3.5 w-3.5 text-gold-600" />
              Mapped to {' '}
              {editingRule ? (
                <select
                  autoFocus
                  aria-label="Mapped Life-Saving Rule"
                  className="rounded-sm border border-navy-200 bg-white px-1 py-0.5 text-[12.5px] font-medium text-navy-800"
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCommit(key, 'ruleId', r.ruleId, ruleText, corrections)
                      setEditingRule(false)
                    }
                    if (e.key === 'Escape') setEditingRule(false)
                  }}
                  onBlur={() => {
                    if (ruleText !== r.ruleId) onCommit(key, 'ruleId', r.ruleId, ruleText, corrections)
                    setEditingRule(false)
                  }}
                >
                  <option value="—">No clear rule mapping</option>
                  {LSR_RULES.map((rl) => (
                    <option key={rl.id} value={rl.id}>
                      {rl.id} — {rl.name}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <b className="text-navy-800">{rule?.name ?? effectivePrecursor}</b>
                  {effectiveRuleId && effectiveRuleId !== '—' && (
                    <span className="font-mono text-[11px] text-navy-300">{effectiveRuleId}</span>
                  )}
                </>
              )}
              <button
                className="ml-auto shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-gold-700"
                onClick={() => {
                  setEditingPrecursor(true)
                  setEditingRule(false)
                }}
                aria-label="Edit precursor"
              >
                <PenLine className="h-3 w-3" />
              </button>
              <button
                className="shrink-0 rounded-sm p-0.5 text-navy-300 hover:text-gold-700"
                onClick={() => {
                  setEditingRule(true)
                  setEditingPrecursor(false)
                }}
                aria-label="Edit mapped rule"
              >
                <PenLine className="h-3 w-3" />
              </button>
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

  /**
   * Drive every queued file through the four pipeline stages independently, so
   * the batch table shows genuine per-file progress rather than a batch average.
   */
  const startProcessing = useCallback((names: string[]) => {
    const now = Date.now()
    let batchSeq = 0
    setFiles((prev) => [
      ...names.map((name, i) => ({
        name,
        size: 18_000 + ((now + i * 977) % 480_000),
        status: 'queued' as const,
        progress: 0,
        stage: 'Queued',
        reportId: `SR-${2486 + i}`,
      })),
      ...prev,
    ])
    setPhase('processing')
    setProgress(0)
    setStage(SAMPLE_STAGES[0])

    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      batchSeq += 1
      setFiles((prev) => {
        if (!prev.some((f) => f.status !== 'done')) {
          if (timer.current) clearInterval(timer.current)
          setPhase('done')
          return prev
        }

        const next = prev.map((f, i) => {
          if (f.status === 'done') return f
          // Stagger: each file advances at its own deterministic rate.
          const step = 2.5 + ((i * 13 + batchSeq) % 7) * 0.9
          const pct = Math.min(100, f.progress + step)
          const stageIdx = Math.min(Math.floor(pct / (100 / SAMPLE_STAGES.length)), SAMPLE_STAGES.length - 1)
          if (pct >= 100) {
            const tpl = NLP_RESULTS[(i + 1) % NLP_RESULTS.length]
            return {
              ...f,
              status: 'done' as const,
              progress: 100,
              stage: 'Extraction complete',
              confidence: tpl.confidence,
              precursor: tpl.precursor,
              ruleId: tpl.ruleId,
              risk: tpl.risk,
            }
          }
          return { ...f, status: 'processing' as const, progress: pct, stage: SAMPLE_STAGES[stageIdx] }
        })

        const overall = Math.round(next.reduce((a, f) => a + f.progress, 0) / Math.max(1, next.length))
        setProgress(overall)
        const busiest = next.find((f) => f.status !== 'done')
        if (busiest?.stage) setStage(busiest.stage)
        return next
      })
    }, 240)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const result = NLP_RESULTS[resultIdx]

  // Corrections live in state so the badge and derived statuses update immediately.
  const [corrections, setCorrections] = useState<Record<string, ExtractionCorrection[]>>(() => loadCorrections())
  const handleCommit = useCallback(
    (
      nlpId: string,
      field: ExtractionCorrection['field'],
      before: string | number,
      after: string | number,
      current: Record<string, ExtractionCorrection[]>
    ) => {
      commit(nlpId, field, before, after, current)
      setCorrections(loadCorrections())
    },
    []
  )

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        icon={<FileUp className="h-5 w-5" />}
        eyebrow="Document Intelligence"
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

      {/* Batch results — per-file pipeline status */}
      {files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="card-title">
              <FileUp className="h-4 w-4 text-gold-600" /> Batch Ingestion
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="tnum text-navy-500">{files.filter((f) => f.status === 'done').length}/{files.length} processed</span>
              {files.some((f) => f.status !== 'done') && (
                <span className="badge border-gold-300 bg-gold-100 text-gold-700">
                  <Loader2 className="h-3 w-3 animate-spin" /> running
                </span>
              )}
              {files.length > 0 && files.every((f) => f.status === 'done') && (
                <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> batch complete
                </span>
              )}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-2.5">File</th>
                  <th className="px-5 py-2.5">Report ID</th>
                  <th className="px-5 py-2.5">Pipeline stage</th>
                  <th className="px-5 py-2.5">Confidence</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {files.map((f) => (
                  <tr key={f.reportId + f.name} className="transition-colors hover:bg-navy-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-navy-300" />
                        <div className="min-w-0">
                          <div className="max-w-56 truncate text-[13px] font-medium text-navy-900">{f.name}</div>
                          <div className="text-[11px] text-navy-300">{fmtSize(f.size)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11.5px] text-navy-500">{f.reportId}</td>
                    <td className="px-5 py-3">
                      <div className="text-[12px] text-navy-600">{f.stage}</div>
                      <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-navy-100">
                        <div
                          className={cn('h-full rounded-full transition-[width] duration-200', f.status === 'done' ? 'bg-emerald-500' : 'bg-gold-500')}
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {f.confidence != null ? <ConfidenceBar value={f.confidence} /> : <span className="text-[12px] text-navy-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {f.status === 'done' ? <StatusBadge status={f.confidence != null && f.confidence >= 75 ? 'Mapped' : 'Manual Review'} /> : <span className="text-[11.5px] font-medium text-gold-700">processing…</span>}
                    </td>
                    <td className="px-5 py-3">
                      {f.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="divide-y divide-navy-50 md:hidden">
            {files.map((f) => (
              <div key={f.reportId + f.name} className="flex flex-col gap-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate text-[13px] font-medium text-navy-900">{f.name}</span>
                  {f.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-navy-400">
                  <span className="font-mono">{f.reportId}</span>
                  <span>·</span>
                  <span>{fmtSize(f.size)}</span>
                </div>
                <div className="text-[12px] text-navy-600">{f.stage}</div>
                <div className="h-1 overflow-hidden rounded-full bg-navy-100">
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-200', f.status === 'done' ? 'bg-emerald-500' : 'bg-gold-500')}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-navy-100 px-5 py-3 text-[11.5px] text-navy-400">
            Each file runs the four-stage pipeline independently — OCR → entity recognition → precursor
            classification → LSR mapping.
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
          <button
            className="rounded-sm border border-red-200 text-[12px] font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
            onClick={() => {
              clearCorrections()
              setCorrections({})
            }}
            title="Clear all saved corrections for this session"
          >
            Reset corrections
          </button>
        </div>
        <ExtractionView r={result} corrections={corrections} onCommit={handleCommit} />
      </div>
    </div>
  )
}
