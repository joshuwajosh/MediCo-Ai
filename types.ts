
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  codeReference: string; // The code identifier like 'J45.31'
  changeDescription: string;
  reason: string;
}

export interface CodeEntry {
  id: string; // Added unique ID for tracking changes
  entity: string;
  type: "ICD-10" | "CPT";
  code: string;
  description: string;
  confidence_score: string;
  evidence: string;
  hierarchical_logic: string[];
}

export interface CodingAnalysis {
  summary: string;
  codes: CodeEntry[];
  queries_for_physician: string[];
}

export interface AppState {
  clinicalNote: string;
  isAnalyzing: boolean;
  result: CodingAnalysis | null;
  error: string | null;
  auditTrail: AuditEntry[];
  hoveredCodeId: string | null; // Track currently hovered code for highlighting
}
