
import React, { useState } from 'react';
import { CodingAnalysis, CodeEntry, AuditEntry } from '../types';

interface ResultViewProps {
  analysis: CodingAnalysis;
  auditTrail: AuditEntry[];
  onUpdateCode: (codeId: string, updatedFields: Partial<CodeEntry>, reason: string) => void;
  setHoveredCodeId: (id: string | null) => void;
  hoveredCodeId: string | null;
}

const ResultView: React.FC<ResultViewProps> = ({ analysis, auditTrail, onUpdateCode, setHoveredCodeId, hoveredCodeId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ code: '', description: '', reason: '' });

  const startEdit = (code: CodeEntry) => {
    setEditingId(code.id);
    setEditForm({ code: code.code, description: code.description, reason: '' });
  };

  const handleSave = () => {
    if (editingId && editForm.reason.trim()) {
      onUpdateCode(editingId, { code: editForm.code, description: editForm.description }, editForm.reason);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Summary Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Clinical Summary</h2>
          <span className="text-[10px] text-slate-400 font-mono font-bold">STAGE 01: ENTITY EXTRACTION</span>
        </div>
        <div className="p-6">
          <p className="text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4">
            "{analysis.summary}"
          </p>
        </div>
      </section>

      {/* Codes Table/Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Refined Coding Audit</h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">{analysis.codes.length} Specific Results</span>
        </div>
        
        <div className="grid gap-6">
          {analysis.codes.map((code) => (
            <div 
              key={code.id} 
              onMouseEnter={() => setHoveredCodeId(code.id)}
              onMouseLeave={() => setHoveredCodeId(null)}
              className={`bg-white rounded-xl border transition-all group overflow-hidden ${
                hoveredCodeId === code.id 
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-50' 
                  : 'border-slate-200 shadow-sm hover:border-indigo-300'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4 w-full">
                    <div className={`px-3 py-1.5 rounded text-[10px] font-bold mono border shadow-sm h-fit shrink-0 ${
                      code.type === 'ICD-10' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {code.type}
                    </div>
                    
                    {editingId === code.id ? (
                      <div className="w-full space-y-3">
                        <input 
                          className="w-full px-3 py-2 text-xl font-bold text-slate-900 mono border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={editForm.code}
                          onChange={e => setEditForm({...editForm, code: e.target.value})}
                        />
                        <textarea 
                          className="w-full px-3 py-2 text-sm font-semibold text-slate-600 border rounded-lg focus:ring-2 focus:ring-indigo-500 h-20"
                          value={editForm.description}
                          onChange={e => setEditForm({...editForm, description: e.target.value})}
                        />
                        <div className="pt-2">
                          <label className="block text-[10px] font-bold text-rose-500 uppercase mb-1">Reason for Adjustment (Required)</label>
                          <input 
                            placeholder="e.g. Clinical documentation implies deeper laterality..."
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-rose-500"
                            value={editForm.reason}
                            onChange={e => setEditForm({...editForm, reason: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">Save Audit</button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900 mono tracking-tight">{code.code}</h3>
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 uppercase tracking-tighter">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Hierarchical Match
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(code); }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Code
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mt-1">{code.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {editingId !== code.id && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full shrink-0 h-fit">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Reliability</span>
                      <span className={`text-xs font-bold ${
                        parseInt(code.confidence_score) > 90 ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {code.confidence_score}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="bg-indigo-50/30 rounded-xl p-5 border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-[0.15em]">Hierarchical Refinement Logic</label>
                    </div>
                    <ul className="space-y-3">
                      {code.hierarchical_logic.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-3 group/step">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 group-hover/step:bg-indigo-500 transition-colors shrink-0"></div>
                          <span className="text-sm text-indigo-900 font-medium leading-tight">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1 h-3 bg-slate-200 rounded-full"></div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source Entity</label>
                      </div>
                      <p className="text-sm text-slate-800 font-bold ml-2.5">{code.entity}</p>
                    </div>
                    <div className={hoveredCodeId === code.id ? 'animate-pulse' : ''}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-1 h-3 rounded-full transition-colors ${hoveredCodeId === code.id ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                        <label className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${hoveredCodeId === code.id ? 'text-indigo-600' : 'text-slate-400'}`}>Clinical Evidence</label>
                      </div>
                      <p className={`text-sm italic p-4 rounded-xl border ml-2.5 transition-all ${
                        hoveredCodeId === code.id 
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-200 shadow-sm' 
                          : 'text-slate-600 bg-slate-50 border-slate-100'
                      }`}>
                        "{code.evidence}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Physician Queries */}
      {analysis.queries_for_physician.length > 0 && (
        <section className="bg-rose-50 rounded-2xl border border-rose-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 rounded-lg">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-rose-900 uppercase tracking-[0.2em]">Documentation Gaps</h2>
              <p className="text-xs text-rose-600 font-medium italic">Incomplete paths detected in the hierarchical audit</p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {analysis.queries_for_physician.map((query, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-rose-800 leading-relaxed bg-white/60 p-4 rounded-xl border border-rose-200/50 shadow-sm">
                <span className="text-rose-400 font-bold text-lg leading-none">?</span>
                {query}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Audit Trail Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Audit Trail (Compliance)</h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">Historical Log</span>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {auditTrail.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400 italic">No modifications recorded. Coding results match initial AI output.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditTrail.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">MODIFICATION</span>
                      <span className="text-xs font-bold text-slate-900 mono">{log.codeReference}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">{log.user}:</span> {log.changeDescription}
                    </p>
                    <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                      <p className="text-[11px] text-amber-800 font-medium">
                        <span className="font-bold uppercase tracking-wider text-[9px] mr-2">Reason for Audit:</span>
                        {log.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResultView;
