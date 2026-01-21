
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

  const exportAuditTrailCSV = () => {
    if (auditTrail.length === 0) return;
    const headers = ['Timestamp', 'User', 'Code Reference', 'Change Description', 'Reason'];
    const rows = auditTrail.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.user,
      `"${entry.codeReference.replace(/"/g, '""')}"`,
      `"${entry.changeDescription.replace(/"/g, '""')}"`,
      `"${entry.reason.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Clinical Abstract</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4 text-sm">"{analysis.summary}"</p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Medical Necessity</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-700 leading-relaxed text-sm font-medium">{analysis.medical_necessity}</p>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">CPC Audit Result</h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">
            {analysis.codes.length} Codes Included
          </span>
        </div>
        
        <div className="grid gap-6">
          {analysis.codes.map((code) => (
            <div 
              key={code.id} 
              onMouseEnter={() => setHoveredCodeId(code.id)}
              onMouseLeave={() => setHoveredCodeId(null)}
              className={`bg-white rounded-xl border transition-all group overflow-hidden ${
                hoveredCodeId === code.id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-indigo-300'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 w-full">
                    <div className={`px-2.5 py-1 rounded text-[10px] font-bold mono border ${
                      code.type === 'ICD-10' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {code.type}
                    </div>
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 mono tracking-tight">{code.code}</h3>
                        {code.modifier_applied && (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                            MODIFIER {code.modifier_applied}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mt-1">{code.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-3">
                    <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100/50">
                      <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">Inclusion Reasoning</label>
                      <p className="text-xs text-indigo-900 leading-relaxed font-medium">{code.reasoning}</p>
                    </div>
                    {code.modifier_reasoning && (
                      <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                        <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-1">Modifier Reasoning</label>
                        <p className="text-xs text-rose-900 leading-relaxed font-medium">{code.modifier_reasoning}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evidence from Note</label>
                    <p className={`text-[12px] italic p-3 rounded-lg border transition-all ${
                      hoveredCodeId === code.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      "{code.evidence}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {analysis.excluded_codes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Excluded Codes (Audit Logic)</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {analysis.excluded_codes.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row gap-4 items-start">
                <div className="shrink-0 font-bold text-slate-400 mono text-sm w-20">{item.code}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-600">{item.description}</p>
                  <p className="text-xs text-rose-600 italic mt-1 font-medium">Exclusion Reason: {item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {analysis.queries_for_physician.length > 0 && (
        <section className="bg-rose-50 rounded-xl border border-rose-100 p-6">
          <h2 className="text-sm font-bold text-rose-900 uppercase tracking-widest mb-4">Compliance Queries</h2>
          <ul className="space-y-3">
            {analysis.queries_for_physician.map((query, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-rose-800 bg-white/50 p-3 rounded-lg border border-rose-200/50 italic">
                <span className="text-rose-400 font-black">Q:</span> {query}
              </li>
            ))}
          </ul>
        </section>
      )}

      {auditTrail.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-[11px]">Session Audit History</h2>
            <button onClick={exportAuditTrailCSV} className="text-[10px] font-bold text-indigo-600 underline">Export Log</button>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
              {auditTrail.map((log) => (
                <div key={log.id} className="p-4 text-xs">
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()} - </span>
                  <span className="font-bold text-slate-700">{log.codeReference}: </span>
                  <span className="text-slate-600">{log.changeDescription}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ResultView;
