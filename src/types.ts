export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export type LsrStatus = 'Mapped' | 'Manual Review'

export interface LifeSavingRule {
  id: string
  name: string
  category: string
}

export interface Site {
  id: string
  name: string
  region: string
  city: string
  headcount: number
  riskLevel: RiskLevel
  riskScore: number // 0-100 composite
  openPrecursors: number
  unmapped: number
  reports: number
  trend: number[] // sparkline series
  incidentTypes: Record<string, number>
  lastAudit: string
  interventions: string[]
}

export interface LsrMappingRow {
  id: string
  date: string
  siteId: string
  reportText: string
  precursor: string
  rule: string
  ruleId: string
  confidence: number
  status: LsrStatus
}

export interface SifAlert {
  id: string
  site: string
  siteId: string
  precursor: string
  rule: string
  ruleId: string
  severity: RiskLevel
  confidence: number
  time: string
  acknowledged?: boolean
}

export interface Metric {
  label: string
  value: number
  delta: number
  sublabel: string
  icon: 'file' | 'shield' | 'alert' | 'map'
}

export interface HeatCell {
  siteId: string
  site: string
  zone: string
  score: number
  level: RiskLevel
}

export interface PipelineStage {
  stage: string
  count: number
}

export interface TrendPoint {
  month: string
  reports: number
  precursors: number
  sifEvents: number
}

export interface UploadResult {
  name: string
  size: number
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  reportId: string
  /** Per-file pipeline stage label while processing. */
  stage?: string
  /** Post-extraction summary, filled when the file reaches 'done'. */
  confidence?: number
  precursor?: string
  ruleId?: string
  risk?: RiskLevel
}

/** Time window applied to time-series charts. */
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all'

/** A point in a time series, optionally carrying a projection branch. */
export interface SeriesPoint {
  label: string
  reports: number | null
  precursors: number | null
  sifEvents: number | null
  /** Projected value; null on historical points. */
  projected?: number | null
  projLower?: number | null
  projUpper?: number | null
}

/** Site location + derived safety metrics for the geographic view. */
export interface SiteGeo {
  id: string
  name: string
  city: string
  region: string
  lon: number
  lat: number
  level: RiskLevel
  score: number
  reports: number
  /** % of incidents with a clear Life-Saving Rule mapping. */
  compliance: number
  mapped: number
  total: number
}

export interface Entity {
  type: 'SITE' | 'DATE' | 'EQUIPMENT' | 'PERSON_ROLE' | 'INJURY' | 'ACTIVITY'
  value: string
  score: number
}

export interface NlpResult {
  id: string
  name: string
  size: number
  status?: 'queued' | 'processing' | 'done' | 'error'
  progress?: number
  rawText: string
  entities: Entity[]
  keywords: { term: string; weight: number }[]
  confidence: number
  precursor: string
  rule: string
  ruleId: string
  mappingStatus: LsrStatus
  risk: RiskLevel
  pipeline: PipelineStage[]
  reportId: string
}

export interface SiteInsight {
  siteId: string
  radar: { category: string; score: number }[]
  leading: { name: string; value: number }[]
  riskTrend: { month: string; score: number }[]
}

/** Correction a human made in the extraction review pane. Feeds LSR badge counts. */
export interface ExtractionCorrection {
  nlpId: string
  field: 'entity' | 'keyword' | 'precursor' | 'ruleId' | 'confidence'
  before: string | number
  after: string | number
  at: number
}
