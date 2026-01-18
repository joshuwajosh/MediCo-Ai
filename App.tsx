
import React, { useState, useMemo } from 'react';
import { AppState, CodingAnalysis, CodeEntry, AuditEntry } from './types';
import { analyzeClinicalNote } from './services/geminiService';
import Header from './components/Header';
import ResultView from './components/ResultView';
import NoteViewer from './components/NoteViewer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    clinicalNote: '',
    isAnalyzing: false,
    result: null,
    error: null,
    auditTrail: [],
    hoveredCodeId: null,
  });

  const activeHighlightText = useMemo(() => {
    if (!state.hoveredCodeId || !state.result) return null;
    const hoveredCode = state.result.codes.find(c => c.id === state.hoveredCodeId);
    return hoveredCode?.evidence || null;
  }, [state.hoveredCodeId, state.result]);

  const handleAnalyze = async () => {
    if (!state.clinicalNote.trim()) {
      setState(prev => ({ ...prev, error: "Please enter or upload a clinical note to begin the audit." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null, auditTrail: [] }));
    try {
      const result = await analyzeClinicalNote(state.clinicalNote);
      setState(prev => ({ ...prev, result, isAnalyzing: false }));
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err.message || "An unexpected system error occurred. Our coding engine might be temporarily unavailable."
      }));
    }
  };

  const onUpdateCode = (codeId: string, updatedFields: Partial<CodeEntry>, reason: string) => {
    if (!state.result) return;

    const oldCode = state.result.codes.find(c => c.id === codeId);
    if (!oldCode) return;

    const changes: string[] = [];
    if (updatedFields.code && updatedFields.code !== oldCode.code) {
      changes.push(`Updated code from '${oldCode.code}' to '${updatedFields.code}'`);
    }
    if (updatedFields.description && updatedFields.description !== oldCode.description) {
      changes.push(`Updated description`);
    }

    if (changes.length === 0) return;

    const newAuditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "Current CPC Professional",
      codeReference: updatedFields.code || oldCode.code,
      changeDescription: changes.join(", "),
      reason: reason
    };

    setState(prev => {
      if (!prev.result) return prev;
      return {
        ...prev,
        result: {
          ...prev.result,
          codes: prev.result.codes.map(c => c.id === codeId ? { ...c, ...updatedFields } : c)
        },
        auditTrail: [newAuditEntry, ...prev.auditTrail]
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setState(prev => ({ ...prev, error: "Invalid file type. Please upload a plain text (.txt) clinical note." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setState(prev => ({ ...prev, clinicalNote: content, error: null }));
    };
    reader.onerror = () => {
      setState(prev => ({ ...prev, error: "Failed to read the file. Please check file permissions." }));
    };
    reader.readAsText(file);
  };

  const clearNote = () => {
    setState({
      clinicalNote: '',
      isAnalyzing: false,
      result: null,
      error: null,
      auditTrail: [],
      hoveredCodeId: null,
    });
  };

  const setHoveredCodeId = (id: string | null) => {
    setState(prev => ({ ...prev, hoveredCodeId: id }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Input Side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Clinical Documentation</h2>
              <p className="text-slate-500 text-sm">
                {state.result ? "Review clinical evidence matches highlighted below." : "Paste the provider's notes below or upload a .txt file."}
              </p>
            </div>

            <div className="relative group">
              {state.result ? (
                <NoteViewer text={state.clinicalNote} highlightText={activeHighlightText} />
              ) : (
                <textarea
                  value={state.clinicalNote}
                  onChange={(e) => setState(prev => ({ ...prev, clinicalNote: e.target.value, error: null }))}
                  placeholder="Chief Complaint: 56 y/o male presents with..."
                  className={`w-full h-[400px] p-6 rounded-2xl border shadow-sm focus:ring-4 transition-all text-slate-800 leading-relaxed resize-none font-medium text-base ${
                    state.error ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
                  }`}
                />
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                {(state.clinicalNote || state.result) && !state.isAnalyzing && (
                  <button 
                    onClick={clearNote}
                    className="p-2 bg-white/80 backdrop-blur hover:bg-white rounded-lg text-slate-400 hover:text-rose-500 transition-colors shadow-sm border border-slate-100"
                    title={state.result ? "New Document" : "Clear text"}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {!state.result && (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label className="w-full sm:w-auto flex-1 cursor-pointer">
                  <input 
                    type="file" 
                    accept=".txt" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Note
                  </div>
                </label>
                
                <button
                  disabled={state.isAnalyzing || !state.clinicalNote.trim()}
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  {state.isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Run Coding Audit
                    </>
                  )}
                </button>
              </div>
            )}

            <div className={`rounded-xl p-4 border transition-colors ${state.error ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex gap-3">
                <svg className={`w-5 h-5 shrink-0 ${state.error ? 'text-rose-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {state.error ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className={`text-xs leading-relaxed ${state.error ? 'text-rose-800' : 'text-blue-800'}`}>
                  {state.error ? (
                    <span className="font-bold">Error Detected: {state.error}</span>
                  ) : (
                    <>
                      <span className="font-bold">Pro Tip:</span> {state.result ? "Hover over code cards in the results to highlight exact clinical evidence in the note above." : "For best results, include physical exam findings, assessments, and plan sections."}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7">
            {state.isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center px-6">
                  <h3 className="text-lg font-bold text-slate-900">Identifying Clinical Entities</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Gemini 3 Pro is traversing the medical hierarchy to find the most specific codes...</p>
                </div>
              </div>
            ) : state.error ? (
              <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center shadow-sm">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-rose-900 mb-2">Audit Interrupted</h3>
                <p className="text-rose-700 text-sm mb-6 max-w-md mx-auto leading-relaxed">{state.error}</p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={handleAnalyze}
                    className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 transition-colors shadow-md shadow-rose-100"
                  >
                    Retry Audit
                  </button>
                  <button 
                    onClick={clearNote}
                    className="px-6 py-2 bg-white border border-rose-200 text-rose-700 rounded-lg font-bold text-sm hover:bg-rose-50 transition-colors"
                  >
                    Clear Note
                  </button>
                </div>
              </div>
            ) : state.result ? (
              <ResultView 
                analysis={state.result} 
                auditTrail={state.auditTrail}
                onUpdateCode={onUpdateCode}
                setHoveredCodeId={setHoveredCodeId}
                hoveredCodeId={state.hoveredCodeId}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Awaiting Documentation</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Upload a clinical note to see the AI's hierarchical coding suggestions and audit trails.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            © 2024 MEDI-CODE AI. FOR PROFESSIONAL CODING ASSISTANCE ONLY.
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ICD-10-CM</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">CPT-4</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">HIPAA READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
