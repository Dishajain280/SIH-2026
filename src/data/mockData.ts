import type {
  HeatCell,
  LsrMappingRow,
  Metric,
  NlpResult,
  SeriesPoint,
  SifAlert,
  Site,
  SiteGeo,
  SiteInsight,
  TimeRange,
  TrendPoint,
} from '../types'

// ---------------------------------------------------------------- sites ----
export const SITES: Site[] = [
  {
    id: 'SBG-01',
    name: 'Serilingampally Steel Works',
    region: 'South',
    city: 'Hyderabad',
    headcount: 3120,
    riskLevel: 'Critical',
    riskScore: 91,
    openPrecursors: 38,
    unmapped: 6,
    reports: 812,
    trend: [61, 63, 60, 66, 70, 74, 78, 84, 88, 91],
    lastAudit: '2026-08-14',
    interventions: [
      'Crane hand-signal refresher for all riggers',
      'Blind-zone radar survey for EOT cranes',
      'Seatbelt interlock retrofit on heavy duty vehicles',
    ],
    incidentTypes: { 'Struck-By': 34, Fall: 21, 'Caught-In/Between': 14, 'Energy Release': 11, 'Slip/Trip': 8 },
  },
  {
    id: 'VSKP-02',
    name: 'Visakhapatnam Port Terminal',
    region: 'East Coast',
    city: 'Visakhapatnam',
    headcount: 1840,
    riskLevel: 'High',
    riskScore: 78,
    openPrecursors: 27,
    unmapped: 4,
    reports: 590,
    trend: [52, 50, 55, 53, 58, 62, 60, 66, 71, 78],
    lastAudit: '2026-08-29',
    interventions: [
      'Mandatory tag-line use on suspended loads',
      'Dropped-object exclusion zones under luffing cranes',
      'Mooring-line snap-back hazard briefing',
    ],
    incidentTypes: { 'Struck-By': 26, Fall: 12, 'Caught-In/Between': 9, 'Energy Release': 8, 'Slip/Trip': 7 },
  },
  {
    id: 'JAM-03',
    name: 'Jamnagar Refinery Block 7',
    region: 'West',
    city: 'Jamnagar',
    headcount: 2560,
    riskLevel: 'High',
    riskScore: 74,
    openPrecursors: 24,
    unmapped: 5,
    reports: 640,
    trend: [58, 57, 59, 61, 63, 65, 67, 70, 72, 74],
    lastAudit: '2026-07-30',
    interventions: [
      'LOTO verification audits twice per shift',
      'H2S detector bump-test discipline program',
      'Scaffold tag re-verification campaign',
    ],
    incidentTypes: { 'Struck-By': 14, Fall: 17, 'Caught-In/Between': 12, 'Energy Release': 19, 'Slip/Trip': 6 },
  },
  {
    id: 'NGP-04',
    name: 'Nagpur Cement Plant',
    region: 'Central',
    city: 'Nagpur',
    headcount: 1210,
    riskLevel: 'Medium',
    riskScore: 58,
    openPrecursors: 15,
    unmapped: 2,
    reports: 342,
    trend: [46, 45, 47, 44, 49, 51, 50, 54, 56, 58],
    lastAudit: '2026-08-05',
    interventions: ['Kiln entry permit rehearsals', 'Conveyor pull-cord testing cadence'],
    incidentTypes: { 'Struck-By': 8, Fall: 7, 'Caught-In/Between': 9, 'Energy Release': 6, 'Slip/Trip': 9 },
  },
  {
    id: 'KLK-05',
    name: 'Kolkata Fabrication Yard',
    region: 'East',
    city: 'Kolkata',
    headcount: 980,
    riskLevel: 'Medium',
    riskScore: 52,
    openPrecursors: 11,
    unmapped: 3,
    reports: 276,
    trend: [40, 42, 41, 44, 46, 45, 48, 50, 51, 52],
    lastAudit: '2026-08-21',
    interventions: ['Welding screens and hot-work spotters', 'Gas-test before confined-space entry'],
    incidentTypes: { 'Struck-By': 6, Fall: 5, 'Caught-In/Between': 5, 'Energy Release': 4, 'Slip/Trip': 8 },
  },
  {
    id: 'PNE-06',
    name: 'Pune Auto Components',
    region: 'West',
    city: 'Pune',
    headcount: 760,
    riskLevel: 'Medium',
    riskScore: 47,
    openPrecursors: 9,
    unmapped: 1,
    reports: 198,
    trend: [36, 35, 37, 38, 40, 41, 43, 44, 46, 47],
    lastAudit: '2026-08-11',
    interventions: ['Robot-cell light-curtain checks', 'Forklift pedestrian segregation plan'],
    incidentTypes: { 'Struck-By': 5, Fall: 3, 'Caught-In/Between': 6, 'Energy Release': 4, 'Slip/Trip': 5 },
  },
  {
    id: 'GWN-07',
    name: 'Guwahati LPG Terminal',
    region: 'Northeast',
    city: 'Guwahati',
    headcount: 430,
    riskLevel: 'Low',
    riskScore: 31,
    openPrecursors: 5,
    unmapped: 0,
    reports: 122,
    trend: [28, 27, 29, 28, 30, 29, 31, 30, 31, 31],
    lastAudit: '2026-08-27',
    interventions: ['Unloading supervisor certification drive'],
    incidentTypes: { 'Struck-By': 2, Fall: 2, 'Caught-In/Between': 1, 'Energy Release': 3, 'Slip/Trip': 1 },
  },
  {
    id: 'KCH-08',
    name: 'Kochi Chemicals Unit 2',
    region: 'South',
    city: 'Kochi',
    headcount: 690,
    riskLevel: 'Low',
    riskScore: 26,
    openPrecursors: 4,
    unmapped: 1,
    reports: 97,
    trend: [22, 21, 23, 22, 24, 23, 25, 24, 26, 26],
    lastAudit: '2026-08-18',
    interventions: ['Chlorine scrubber maintenance drill'],
    incidentTypes: { 'Struck-By': 1, Fall: 2, 'Caught-In/Between': 1, 'Energy Release': 2, 'Slip/Trip': 2 },
  },
]

export const SITE_BY_ID = new Map(SITES.map((s) => [s.id, s]))

// ------------------------------------------------------------ LSR rules ----
export const LSR_RULES: { id: string; name: string; category: string }[] = [
  { id: 'LSR-01', name: 'Work at Height — 100% Tie-Off', category: 'Fall Prevention' },
  { id: 'LSR-02', name: 'Barricade Line-of-Fire Exclusion Zones', category: 'Line of Fire' },
  { id: 'LSR-03', name: 'Verify Isolation Before Work (LOTO)', category: 'Energy Isolation' },
  { id: 'LSR-04', name: 'Confined Space Entry Permit', category: 'Permit to Work' },
  { id: 'LSR-05', name: 'Hot Work Permit & Fire Watch', category: 'Permit to Work' },
  { id: 'LSR-06', name: 'Vehicle Speed & Seatbelt Compliance', category: 'Driving Safety' },
  { id: 'LSR-07', name: 'Stay Out of Exclusion Zones Under Suspended Loads', category: 'Lifting Operations' },
  { id: 'LSR-08', name: 'Gas Testing Before Hot Work', category: 'Atmospheric Control' },
  { id: 'LSR-09', name: 'Machine Guarding — Guards In Place Before Start', category: 'Machine Safety' },
]

export const RULE_BY_ID = new Map(LSR_RULES.map((r) => [r.id, r]))

/** Default mapping cutoff. Overridable so the UI can demo confidence-threshold behavior. */
export const DEFAULT_LSR_THRESHOLD = 75

export function statusForConfidence(c: number, threshold: number = DEFAULT_LSR_THRESHOLD): 'Mapped' | 'Manual Review' {
  return c >= threshold ? 'Mapped' : 'Manual Review'
}

// --------------------------------------------------------- LSR mapping rows
export const LSR_ROWS: LsrMappingRow[] = [
  { id: 'SR-2481', date: '2026-09-06', siteId: 'SBG-01', reportText: 'Rigger worked at 14 m on EOT crane gantry without anchor point during beam replacement.', precursor: 'Work at height without fall arrest', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', confidence: 96, status: 'Mapped' },
  { id: 'SR-2479', date: '2026-09-05', siteId: 'VSKP-02', reportText: 'Deck fitter crossed barricade to retrieve wrench while container was being lowered by STS crane.', precursor: 'Entered suspended-load drop zone', rule: 'Stay Out of Exclusion Zones Under Suspended Loads', ruleId: 'LSR-07', confidence: 93, status: 'Mapped' },
  { id: 'SR-2477', date: '2026-09-05', siteId: 'JAM-03', reportText: 'Technician opened flange on naphtha line though upstream valve indicated locked-open in P&ID mismatch.', precursor: 'Residual pressure behind opened flange', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', confidence: 88, status: 'Mapped' },
  { id: 'SR-2475', date: '2026-09-04', siteId: 'SBG-01', reportText: 'Hot work sparks observed near cable tray beyond permit boundary; fire watch on tea break.', precursor: 'Hot work without continuous fire watch', rule: 'Hot Work Permit & Fire Watch', ruleId: 'LSR-05', confidence: 91, status: 'Mapped' },
  { id: 'SR-2473', date: '2026-09-04', siteId: 'JAM-03', reportText: 'Operator entered kiln shell for inspection while ID fan damper chain remained unaccounted in lockbox log.', precursor: 'Stored energy not fully isolated at entry', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', confidence: 84, status: 'Mapped' },
  { id: 'SR-2471', date: '2026-09-03', siteId: 'NGP-04', reportText: 'Belt conveyor restarted after jam while cleaner was brushing spillage at tail pulley guard gap.', precursor: 'Conveyor restarted on trapped worker', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', confidence: 86, status: 'Mapped' },
  { id: 'SR-2469', date: '2026-09-03', siteId: 'KLK-05', reportText: 'Fabricator used grinding wheel without guard to cut back-gear strip inside hull block.', precursor: 'Unguarded portable grinder operation', rule: 'Machine Guarding — Guards In Place Before Start', ruleId: 'LSR-09', confidence: 82, status: 'Mapped' },
  { id: 'SR-2466', date: '2026-09-02', siteId: 'SBG-01', reportText: 'Pickup reversed with reversed proximity sensor disabled to save cycle time near casting bay gate.', precursor: 'Vehicle reverse alarm bypassed', rule: 'Vehicle Speed & Seatbelt Compliance', ruleId: 'LSR-06', confidence: 68, status: 'Manual Review' },
  { id: 'SR-2464', date: '2026-09-02', siteId: 'VSKP-02', reportText: 'AB climbed pilot ladder without tether to free tangled rope guard during mooring operations.', precursor: 'Unprotected climb over water at height', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', confidence: 72, status: 'Manual Review' },
  { id: 'SR-2461', date: '2026-09-01', siteId: 'JAM-03', reportText: 'Sample collector descended API separator chamber using site-made ladder; gas test record page torn.', precursor: 'Confined space entry without verified gas test', rule: 'Confined Space Entry Permit', ruleId: 'LSR-04', confidence: 89, status: 'Mapped' },
  { id: 'SR-2458', date: '2026-09-01', siteId: 'KLK-05', reportText: 'Crew cut pipeline plug with oxy-acetylene though line tag indicated residual product inside.', precursor: 'Hot work on line with unknown contents', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', confidence: 74, status: 'Manual Review' },
  { id: 'SR-2455', date: '2026-08-31', siteId: 'PNE-06', reportText: 'Maintenance tech reached into running pick-place robot cell to clear jam while light curtain muted.', precursor: 'Reach into operating robot cell', rule: 'Machine Guarding — Guards In Place Before Start', ruleId: 'LSR-09', confidence: 87, status: 'Mapped' },
  // Reports that also appear in the NLP analyzer — corrections made there flow into these rows.
  { id: 'SR-2483', date: '2026-09-06', siteId: 'SBG-01', reportText: 'Rigger climbed the EOT crane gantry at ~14 m to replace a worn beam clamp; harness not attached to any anchor point while a 3.2 t lift was in progress over the adjacent aisle.', precursor: 'Work at height without fall arrest near suspended load', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', confidence: 96, status: 'Mapped' },
  { id: 'SR-2484', date: '2026-09-06', siteId: 'VSKP-02', reportText: 'AB stepped inside the snap-back zone to free a tangled mooring rope while the line was still under tension; barricade tape had fallen earlier and was not re-hung.', precursor: 'Line-of-fire exposure to mooring snap-back', rule: 'Barricade Line-of-Fire Exclusion Zones', ruleId: 'LSR-02', confidence: 88, status: 'Mapped' },
  { id: 'SR-2485', date: '2026-09-07', siteId: 'JAM-03', reportText: 'Recycle line flange opened for gasket change though the blind list still showed the spade as not yet fitted. Gasket replaced without event.', precursor: 'Possible isolation verification gap (low narrative clarity)', rule: '—', ruleId: '—', confidence: 58, status: 'Manual Review' },
]

// ----------------------------------------------------------------- alerts --
export const ALERT_SEED: SifAlert[] = [
  { id: 'AL-3312', siteId: 'SBG-01', site: 'Serilingampally Steel Works', precursor: 'Crane load swung over walkway with two workers exposed', rule: 'Exclusion Zones Under Suspended Loads', ruleId: 'LSR-07', severity: 'Critical', confidence: 94, time: 'just now' },
  { id: 'AL-3311', siteId: 'JAM-03', site: 'Jamnagar Refinery Block 7', precursor: 'H2S alarm bypass reported at desulphurization unit', rule: 'Gas Testing Before Hot Work', ruleId: 'LSR-08', severity: 'Critical', confidence: 91, time: '2 min ago' },
  { id: 'AL-3310', siteId: 'VSKP-02', site: 'Visakhapatnam Port Terminal', precursor: 'Worker under suspended container during re-hitch', rule: 'Exclusion Zones Under Suspended Loads', ruleId: 'LSR-07', severity: 'High', confidence: 88, time: '11 min ago' },
  { id: 'AL-3309', siteId: 'SBG-01', site: 'Serilingampally Steel Works', precursor: 'Ladder tie-off missing at 12 m gantry platform', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', severity: 'High', confidence: 83, time: '26 min ago' },
  { id: 'AL-3308', siteId: 'NGP-04', site: 'Nagpur Cement Plant', precursor: 'Conveyor guard removed while belt energized', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', severity: 'High', confidence: 79, time: '44 min ago' },
  { id: 'AL-3307', siteId: 'KLK-05', site: 'Kolkata Fabrication Yard', precursor: 'Gas test skipped before tank entry', rule: 'Confined Space Entry Permit', ruleId: 'LSR-04', severity: 'Medium', confidence: 71, time: '1 hr ago' },
]

export const ALERT_STREAM_EXTRA: Omit<SifAlert, 'id' | 'time'>[] = [
  { siteId: 'VSKP-02', site: 'Visakhapatnam Port Terminal', precursor: 'Snap-back zone crossed during mooring tension', rule: 'Barricade Line-of-Fire Exclusion Zones', ruleId: 'LSR-02', severity: 'Critical', confidence: 92 },
  { siteId: 'JAM-03', site: 'Jamnagar Refinery Block 7', precursor: 'Scaffold tag missing on tier 3 access bay', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', severity: 'High', confidence: 81 },
  { siteId: 'PNE-06', site: 'Pune Auto Components', precursor: 'Light curtain muted during robot teach mode', rule: 'Machine Guarding — Guards In Place Before Start', ruleId: 'LSR-09', severity: 'High', confidence: 86 },
  { siteId: 'SBG-01', site: 'Serilingampally Steel Works', precursor: 'Ladle transfer car moved with spotter in path', rule: 'Vehicle Speed & Seatbelt Compliance', ruleId: 'LSR-06', severity: 'Critical', confidence: 95 },
  { siteId: 'KCH-08', site: 'Kochi Chemicals Unit 2', precursor: 'Scrubber bypass opened without permit', rule: 'Verify Isolation Before Work (LOTO)', ruleId: 'LSR-03', severity: 'Medium', confidence: 66 },
]

// ---------------------------------------------------------------- metrics --
export const METRICS: Metric[] = [
  { label: 'Total Reports Processed', value: 3227, delta: 12.4, sublabel: '+354 this month across 8 sites', icon: 'file' },
  { label: 'Hidden SIF Precursors Detected', value: 384, delta: 9.1, sublabel: '136 flagged Critical / High', icon: 'shield' },
  { label: 'Unmapped Incidents', value: 22, delta: -18.2, sublabel: 'Awaiting manual LSR review', icon: 'alert' },
  { label: 'Active High-Risk Sites', value: 3, delta: 2, sublabel: '1 Critical · 2 High priority', icon: 'map' },
]

// ---------------------------------------------------------------- heatmap --
export const HEAT_CELLS: HeatCell[] = SITES.map((s) => ({
  siteId: s.id,
  site: s.name,
  zone: `${s.city} · ${s.region}`,
  score: s.riskScore,
  level: s.riskLevel,
}))

// ------------------------------------------------------------ trend series -
export const TREND_SERIES: TrendPoint[] = [
  { month: 'Dec', reports: 186, precursors: 21, sifEvents: 3 },
  { month: 'Jan', reports: 204, precursors: 24, sifEvents: 2 },
  { month: 'Feb', reports: 232, precursors: 26, sifEvents: 3 },
  { month: 'Mar', reports: 258, precursors: 31, sifEvents: 2 },
  { month: 'Apr', reports: 246, precursors: 29, sifEvents: 1 },
  { month: 'May', reports: 271, precursors: 33, sifEvents: 2 },
  { month: 'Jun', reports: 298, precursors: 36, sifEvents: 2 },
  { month: 'Jul', reports: 322, precursors: 38, sifEvents: 1 },
  { month: 'Aug', reports: 354, precursors: 41, sifEvents: 1 },
  { month: 'Sep', reports: 127, precursors: 18, sifEvents: 0 },
]

// ------------------------------------------------------------- nlp results -
export const NLP_RESULTS: NlpResult[] = [
  {
    id: 'up-1',
    name: 'incident_report_sbg0119.pdf',
    size: 412_644,
    status: 'done',
    progress: 100,
    reportId: 'SR-2483',
    rawText:
      'Near-miss report — Casting Bay 2, 06 Sep 2026.\nDuring the afternoon shift, a rigger climbed the EOT crane gantry at approximately 14 meters to replace a worn beam clamp. The harness he carried was not attached to any anchor point; the lanyard remained hooked on the dorsal D-ring only. A crane lift of 3.2 t was simultaneously in progress over the adjacent aisle. The spotter on the floor noticed the unsecured lanyard and halted the lift via emergency stop. No injury occurred. Supervisor intervention: work was stopped for 40 minutes while a certified anchor sling was rigged. The crew had skipped pre-task briefing because the previous shift overran.',
    entities: [
      { type: 'SITE', value: 'Casting Bay 2', score: 0.97 },
      { type: 'DATE', value: '06 Sep 2026', score: 0.98 },
      { type: 'EQUIPMENT', value: 'EOT crane gantry', score: 0.93 },
      { type: 'EQUIPMENT', value: 'beam clamp', score: 0.88 },
      { type: 'PERSON_ROLE', value: 'rigger', score: 0.95 },
      { type: 'PERSON_ROLE', value: 'spotter', score: 0.9 },
      { type: 'INJURY', value: 'no injury (near miss)', score: 0.92 },
      { type: 'ACTIVITY', value: 'crane lift 3.2 t', score: 0.87 },
    ],
    keywords: [
      { term: 'height', weight: 0.94 },
      { term: 'harness not attached', weight: 0.91 },
      { term: 'anchor point', weight: 0.89 },
      { term: 'suspended load', weight: 0.85 },
      { term: 'pre-task briefing skipped', weight: 0.74 },
      { term: 'emergency stop', weight: 0.62 },
    ],
    confidence: 96,
    precursor: 'Work at height without fall arrest near suspended load',
    rule: 'Work at Height — 100% Tie-Off',
    ruleId: 'LSR-01',
    mappingStatus: 'Mapped',
    risk: 'Critical',
    pipeline: [
      { stage: 'OCR / Text Extraction', count: 1 },
      { stage: 'Entity Recognition', count: 8 },
      { stage: 'Precursor Classification', count: 1 },
      { stage: 'LSR Rule Mapping', count: 1 },
    ],
  },
  {
    id: 'up-2',
    name: 'vskp_mooring_note.txt',
    size: 18_432,
    status: 'done',
    progress: 100,
    reportId: 'SR-2484',
    rawText:
      'Berth 4, night shift. AB Ramesh stepped inside the snap-back zone to free a tangled mooring rope while the line was still under tension. The deck supervisor shouted a warning and the line was slackened. The area barricade tape had fallen earlier and was not re-hung. Incident logged as high potential. Recommend retension of exclusion-zone briefing at shift start and re-verification of barricade integrity after rain.',
    entities: [
      { type: 'SITE', value: 'Berth 4', score: 0.94 },
      { type: 'PERSON_ROLE', value: 'AB (able seaman)', score: 0.9 },
      { type: 'EQUIPMENT', value: 'mooring rope', score: 0.96 },
      { type: 'ACTIVITY', value: 'mooring tension release', score: 0.85 },
      { type: 'INJURY', value: 'no injury (high potential)', score: 0.9 },
    ],
    keywords: [
      { term: 'snap-back zone', weight: 0.95 },
      { term: 'line under tension', weight: 0.9 },
      { term: 'barricade fallen', weight: 0.8 },
      { term: 'high potential', weight: 0.77 },
    ],
    confidence: 88,
    precursor: 'Line-of-fire exposure to mooring snap-back',
    rule: 'Barricade Line-of-Fire Exclusion Zones',
    ruleId: 'LSR-02',
    mappingStatus: 'Mapped',
    risk: 'High',
    pipeline: [
      { stage: 'OCR / Text Extraction', count: 1 },
      { stage: 'Entity Recognition', count: 5 },
      { stage: 'Precursor Classification', count: 1 },
      { stage: 'LSR Rule Mapping', count: 1 },
    ],
  },
  {
    id: 'up-3',
    name: 'jamnagar_shift_log.csv',
    size: 96_256,
    status: 'done',
    progress: 100,
    reportId: 'SR-2485',
    rawText:
      'Unit 7 stack area: technician reported unusual vibration on cooling water pump P-204; check-valve replaced on the spot. Later the same shift, a flange on the recycle line was opened for gasket change though the blind list still showed the spade as not yet fitted. Gasket was replaced without event. Shift log entry ends.',
    entities: [
      { type: 'SITE', value: 'Unit 7 stack area', score: 0.91 },
      { type: 'EQUIPMENT', value: 'cooling water pump P-204', score: 0.89 },
      { type: 'EQUIPMENT', value: 'recycle line flange', score: 0.84 },
      { type: 'ACTIVITY', value: 'gasket change', score: 0.83 },
      { type: 'INJURY', value: 'none reported', score: 0.9 },
    ],
    keywords: [
      { term: 'flange opened', weight: 0.82 },
      { term: 'blind list mismatch', weight: 0.79 },
      { term: 'spade not fitted', weight: 0.76 },
    ],
    confidence: 58,
    precursor: 'Possible isolation verification gap (low narrative clarity)',
    rule: '—',
    ruleId: '—',
    mappingStatus: 'Manual Review',
    risk: 'Medium',
    pipeline: [
      { stage: 'OCR / Text Extraction', count: 1 },
      { stage: 'Entity Recognition', count: 5 },
      { stage: 'Precursor Classification', count: 1 },
      { stage: 'LSR Rule Mapping', count: 0 },
    ],
  },
]

// ----------------------------------------------------------- site insights -
export const SITE_INSIGHTS: Record<string, SiteInsight> = {
  'SBG-01': {
    siteId: 'SBG-01',
    radar: [
      { category: 'Fall Prevention', score: 42 },
      { category: 'Energy Isolation', score: 58 },
      { category: 'Lifting Ops', score: 36 },
      { category: 'Driving Safety', score: 71 },
      { category: 'Machine Safety', score: 64 },
      { category: 'Permit Discipline', score: 55 },
    ],
    leading: [
      { name: 'Height work w/o tie-off', value: 21 },
      { name: 'Load path exposure', value: 17 },
      { name: 'Blind-zone reverse', value: 9 },
      { name: 'Guard removed', value: 7 },
    ],
    riskTrend: [
      { month: 'Apr', score: 62 },
      { month: 'May', score: 66 },
      { month: 'Jun', score: 70 },
      { month: 'Jul', score: 76 },
      { month: 'Aug', score: 84 },
      { month: 'Sep', score: 91 },
    ],
  },
  'VSKP-02': {
    siteId: 'VSKP-02',
    radar: [
      { category: 'Fall Prevention', score: 55 },
      { category: 'Energy Isolation', score: 62 },
      { category: 'Lifting Ops', score: 38 },
      { category: 'Driving Safety', score: 66 },
      { category: 'Machine Safety', score: 70 },
      { category: 'Permit Discipline', score: 51 },
    ],
    leading: [
      { name: 'Suspended-load zone entry', value: 14 },
      { name: 'Snap-back exposure', value: 8 },
      { name: 'Unprotected climb', value: 5 },
    ],
    riskTrend: [
      { month: 'Apr', score: 50 },
      { month: 'May', score: 54 },
      { month: 'Jun', score: 57 },
      { month: 'Jul', score: 63 },
      { month: 'Aug', score: 70 },
      { month: 'Sep', score: 78 },
    ],
  },
  'JAM-03': {
    siteId: 'JAM-03',
    radar: [
      { category: 'Fall Prevention', score: 60 },
      { category: 'Energy Isolation', score: 41 },
      { category: 'Lifting Ops', score: 68 },
      { category: 'Driving Safety', score: 74 },
      { category: 'Machine Safety', score: 61 },
      { category: 'Permit Discipline', score: 47 },
    ],
    leading: [
      { name: 'Isolation not verified', value: 18 },
      { name: 'Gas test skipped', value: 7 },
      { name: 'Scaffold tag missing', value: 6 },
    ],
    riskTrend: [
      { month: 'Apr', score: 58 },
      { month: 'May', score: 60 },
      { month: 'Jun', score: 63 },
      { month: 'Jul', score: 66 },
      { month: 'Aug', score: 70 },
      { month: 'Sep', score: 74 },
    ],
  },
}

export function insightsForSite(siteId: string): SiteInsight {
  return (
    SITE_INSIGHTS[siteId] ?? {
      siteId,
      radar: [
        { category: 'Fall Prevention', score: 70 },
        { category: 'Energy Isolation', score: 72 },
        { category: 'Lifting Ops', score: 66 },
        { category: 'Driving Safety', score: 78 },
        { category: 'Machine Safety', score: 74 },
        { category: 'Permit Discipline', score: 69 },
      ],
      leading: [
        { name: 'Housekeeping gaps', value: 4 },
        { name: 'Permit shortfalls', value: 3 },
      ],
      riskTrend: [
        { month: 'Apr', score: 30 },
        { month: 'May', score: 28 },
        { month: 'Jun', score: 29 },
        { month: 'Jul', score: 31 },
        { month: 'Aug', score: 30 },
        { month: 'Sep', score: SITE_BY_ID.get(siteId)?.riskScore ?? 30 },
      ],
    }
  )
}

// helper used by the dashboard hero
export function totalReports(): number {
  return SITES.reduce((a, s) => a + s.reports, 0)
}

// ------------------------------------------------------------ geolocation --
/** Approximate plant coordinates, used to place pins on the India map. */
export const SITE_COORDS: Record<string, { lon: number; lat: number }> = {
  'SBG-01': { lon: 78.39, lat: 17.49 }, // Hyderabad
  'VSKP-02': { lon: 83.22, lat: 17.69 }, // Visakhapatnam
  'JAM-03': { lon: 70.07, lat: 22.47 }, // Jamnagar
  'NGP-04': { lon: 79.09, lat: 21.15 }, // Nagpur
  'KLK-05': { lon: 88.36, lat: 22.57 }, // Kolkata
  'PNE-06': { lon: 73.86, lat: 18.52 }, // Pune
  'GWN-07': { lon: 91.74, lat: 26.14 }, // Guwahati
  'KCH-08': { lon: 76.27, lat: 9.93 }, // Kochi
}

/**
 * Simplified India outline as [lon, lat] pairs (clockwise from the Kutch coast).
 * Stylised for legibility at dashboard size — not survey-accurate.
 */
export const INDIA_OUTLINE: [number, number][] = [
  [68.2, 23.8], [68.9, 23.9], [70.0, 22.6], [69.6, 21.4], [70.4, 20.9],
  [72.6, 21.6], [72.9, 19.9], [73.3, 18.1], [73.9, 16.0], [74.5, 13.0],
  [75.8, 11.3], [76.5, 9.0], [77.5, 8.1], [78.3, 8.9], [79.5, 10.3],
  [80.3, 13.5], [80.5, 15.8], [82.3, 17.0], [84.5, 19.0], [86.9, 20.7],
  [87.5, 21.6], [88.9, 21.7], [89.1, 22.6], [89.0, 25.3], [89.8, 26.0],
  [92.0, 25.2], [92.5, 24.0], [93.4, 24.0], [94.5, 25.5], [95.5, 26.7],
  [97.4, 27.5], [96.0, 29.3], [94.0, 29.0], [92.0, 28.2], [90.0, 28.0],
  [88.9, 27.3], [88.0, 26.8], [85.0, 27.5], [81.0, 28.5], [80.0, 28.8],
  [78.0, 30.5], [76.0, 32.0], [74.5, 34.0], [76.5, 35.5], [78.5, 34.5],
  [79.5, 33.0], [78.5, 31.0], [76.5, 29.7], [75.0, 27.5], [72.5, 24.5],
  [71.0, 24.3], [70.0, 25.0], [70.5, 26.5], [72.3, 28.6], [73.5, 29.9],
  [74.5, 31.2], [74.2, 32.5], [73.9, 34.4], [74.6, 35.0], [75.2, 34.0],
  [74.3, 32.0], [73.4, 30.0], [71.9, 28.0], [70.6, 26.0], [69.4, 25.0],
  [68.7, 24.2],
]

// ------------------------------------------------------------ LSR compliance
/**
 * Percentage of logged incidents that carry a clear Life-Saving Rule mapping.
 * Derived from each site's incident mix and its unmapped count — the KPI a
 * safety officer actually reports on.
 */
export function lsrComplianceBySite(): SiteGeo[] {
  return SITES.map((s) => {
    const total = Object.values(s.incidentTypes).reduce((a, n) => a + n, 0)
    const mapped = Math.max(0, total - s.unmapped)
    const coords = SITE_COORDS[s.id] ?? { lon: 78, lat: 22 }
    return {
      id: s.id,
      name: s.name,
      city: s.city,
      region: s.region,
      lon: coords.lon,
      lat: coords.lat,
      level: s.riskLevel,
      score: s.riskScore,
      reports: s.reports,
      mapped,
      total,
      compliance: total > 0 ? Math.round((mapped / total) * 1000) / 10 : 100,
    }
  })
}

export const SITE_GEO: SiteGeo[] = lsrComplianceBySite()

/** Fleet-wide compliance across every site. */
export function fleetCompliance(): number {
  const mapped = SITE_GEO.reduce((a, g) => a + g.mapped, 0)
  const total = SITE_GEO.reduce((a, g) => a + g.total, 0)
  return total > 0 ? Math.round((mapped / total) * 1000) / 10 : 0
}

// ---------------------------------------------------------------- time series
export const TIME_RANGES: { id: TimeRange; label: string; hint: string }[] = [
  { id: '24h', label: '24H', hint: 'Last 24 hours' },
  { id: '7d', label: '7D', hint: 'Last 7 days' },
  { id: '30d', label: '30D', hint: 'Last 30 days' },
  { id: '90d', label: '90D', hint: 'Last 90 days' },
  { id: 'all', label: 'All', hint: 'All 10 recorded months' },
]

/** Deterministic PRNG so the generated series is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function linearFit(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 }
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((a, v) => a + v, 0)
  const sumXY = values.reduce((a, v, i) => a + i * v, 0)
  const sumXX = values.reduce((a, _v, i) => a + i * i, 0)
  const denom = n * sumXX - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  return { slope, intercept: (sumY - slope * sumX) / n }
}

/**
 * Months shown in the forward projection. September 2026 is the current,
 * in-progress month and is excluded from the fit so a partial month never
 * drags the projection down.
 */
const PROJECTION_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

/**
 * Build a time series for the selected window, plus a forward projection with
 * widening confidence bounds. Historical points carry null projection values and
 * vice versa, so each artist draws only its own span.
 */
export function buildSeries(range: TimeRange): SeriesPoint[] {
  if (range === 'all') {
    // Drop the trailing in-progress month before fitting.
    const complete = TREND_SERIES.slice(0, -1)
    const hist: SeriesPoint[] = complete.map((p) => ({
      label: p.month,
      reports: p.reports,
      precursors: p.precursors,
      sifEvents: p.sifEvents,
    }))
    const recent = hist.slice(-6).map((p) => p.precursors ?? 0)
    const { slope } = linearFit(recent)
    const last = recent[recent.length - 1] ?? 0
    // Bridge: the last actual point starts the projection so the dashed line connects.
    hist[hist.length - 1] = { ...hist[hist.length - 1], projected: last, projLower: last, projUpper: last }
    // Only project upward — a safety programme that degrades is not the expected trend.
    const drift = Math.max(0.4, slope)
    let prev = last
    PROJECTION_MONTHS.forEach((label, i) => {
      const val = Math.max(1, Math.round(prev + drift))
      const spread = Math.round(2 + i * 1.8)
      hist.push({
        label,
        reports: null,
        precursors: null,
        sifEvents: null,
        projected: val,
        projLower: Math.max(0, val - spread),
        projUpper: val + spread,
      })
      prev = val
    })
    return hist
  }

  const cfg =
    range === '24h'
      ? { points: 12, stepHours: 2, perDay: { reports: 26, precursors: 3.2 }, horizon: 6, horizonStepHours: 2, seed: 7 }
      : range === '7d'
        ? { points: 7, stepHours: 24, perDay: { reports: 26, precursors: 3.2 }, horizon: 7, horizonStepHours: 24, seed: 11 }
        : range === '30d'
          ? { points: 30, stepHours: 24, perDay: { reports: 26, precursors: 3.2 }, horizon: 14, horizonStepHours: 24, seed: 13 }
          : { points: 90, stepHours: 24, perDay: { reports: 26, precursors: 3.2 }, horizon: 30, horizonStepHours: 24, seed: 17 }

  const rand = mulberry32(cfg.seed)
  const now = new Date('2026-09-11T12:00:00')
  const stepMs = cfg.stepHours * 3600_000
  const start = now.getTime() - (cfg.points - 1) * stepMs

  const fmt = (t: number): string => {
    const d = new Date(t)
    if (cfg.stepHours < 24) return `${String(d.getHours()).padStart(2, '0')}:00`
    return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
  }

  const out: SeriesPoint[] = []
  let prevPrec = cfg.perDay.precursors
  for (let i = 0; i < cfg.points; i++) {
    const t = start + i * stepMs
    const dow = new Date(t).getDay()
    const weekend = dow === 0 || dow === 6 ? 0.55 : 1
    const drift = 1 + (i / cfg.points) * 0.28
    const noise = 0.78 + rand() * 0.44
    const share = cfg.stepHours / 24
    const reports = Math.max(0, Math.round(cfg.perDay.reports * share * weekend * drift * noise))
    const precursors = Math.max(0, Math.round(cfg.perDay.precursors * share * weekend * drift * (0.7 + rand() * 0.7)))
    prevPrec = precursors
    out.push({
      label: fmt(t),
      reports,
      precursors,
      sifEvents: rand() > 0.86 ? 1 : 0,
      projected: null,
      projLower: null,
      projUpper: null,
    })
  }

  // Project forward from a linear fit on the most recent third of the window.
  const tail = out.slice(-Math.max(3, Math.round(cfg.points / 3))).map((p) => p.precursors ?? 0)
  const { slope } = linearFit(tail)
  const lastPrec = out[out.length - 1].precursors ?? prevPrec
  const lastT = start + (cfg.points - 1) * stepMs
  const hStepMs = cfg.horizonStepHours * 3600_000

  out[out.length - 1] = { ...out[out.length - 1], projected: lastPrec, projLower: lastPrec, projUpper: lastPrec }

  let prev = lastPrec
  for (let i = 1; i <= cfg.horizon; i++) {
    const val = Math.max(0, Math.round(prev + slope * 0.85))
    const spread = 0.6 + i * 0.55
    out.push({
      label: fmt(lastT + i * hStepMs),
      reports: null,
      precursors: null,
      sifEvents: null,
      projected: val,
      projLower: Math.max(0, Math.round(val - spread)),
      projUpper: Math.round(val + spread),
    })
    prev = val
  }

  return out
}

/**
 * Risk-score trajectory for one site over the selected window, ending at the
 * site's current composite score. 'all' returns the recorded monthly history.
 */
export function siteRiskSeries(siteId: string, range: TimeRange): { label: string; score: number }[] {
  if (range === 'all') {
    return insightsForSite(siteId).riskTrend.map((p) => ({ label: p.month, score: p.score }))
  }

  const site = SITE_BY_ID.get(siteId)
  const target = site?.riskScore ?? 50
  const cfg =
    range === '24h'
      ? { points: 12, stepHours: 2 }
      : range === '7d'
        ? { points: 7, stepHours: 24 }
        : range === '30d'
          ? { points: 30, stepHours: 24 }
          : { points: 90, stepHours: 24 }

  const seed = siteId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7 + 3
  const rand = mulberry32(seed)
  const now = new Date('2026-09-11T12:00:00').getTime()
  const stepMs = cfg.stepHours * 3600_000
  const start = now - (cfg.points - 1) * stepMs

  const out: { label: string; score: number }[] = []
  for (let i = 0; i < cfg.points; i++) {
    const d = new Date(start + i * stepMs)
    const label =
      cfg.stepHours < 24
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
    // Drift up toward the current score so the series reads as an escalation.
    const progress = i / Math.max(1, cfg.points - 1)
    const base = target - (1 - progress) * (7 + (target % 6))
    const noise = (rand() - 0.5) * 4
    out.push({ label, score: Math.max(1, Math.min(100, Math.round(base + noise))) })
  }
  // Pin the final point to the real current score.
  out[out.length - 1] = { ...out[out.length - 1], score: target }
  return out
}

/** Projected precursor level at the end of the forecast horizon, with its unit. */
export function projectedHeadline(
  series: SeriesPoint[],
  range: TimeRange
): { value: number; label: string; unit: 'month' | 'day' } | null {
  const future = series.filter((p) => p.projected != null && p.reports == null)
  if (future.length === 0) return null
  const last = future[future.length - 1]
  return { value: last.projected ?? 0, label: last.label, unit: range === 'all' ? 'month' : 'day' }
}
