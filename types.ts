
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  codeReference: string;
  changeDescription: string;
  reason: string;
}

export interface CodeEntry {
  id: string;
  type: "ICD-10" | "CPT";
  code: string;
  description: string;
  reasoning: string;
  hierarchical_logic: string[];
  entity: string;
  confidence_score: string;
  evidence: string;
  modifier_applied?: string;
  modifier_reasoning?: string;
}

export interface ExcludedCode {
  code: string;
  description: string;
  reason: string;
}

export interface CodingAnalysis {
  summary: string;
  medical_necessity: string;
  codes: CodeEntry[];
  excluded_codes: ExcludedCode[];
  queries_for_physician: string[];
}

export interface AppState {
  clinicalNote: string;
  isAnalyzing: boolean;
  result: CodingAnalysis | null;
  error: string | null;
  auditTrail: AuditEntry[];
  hoveredCodeId: string | null;
}
