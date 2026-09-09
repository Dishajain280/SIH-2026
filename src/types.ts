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
