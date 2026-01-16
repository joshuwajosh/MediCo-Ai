
import React, { useMemo } from 'react';

interface NoteViewerProps {
  text: string;
  highlightText: string | null;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ text, highlightText }) => {
  const parts = useMemo(() => {
    if (!highlightText || !highlightText.trim() || !text.includes(highlightText)) {
      return [text];
    }

    const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex);
  }, [text, highlightText]);

  return (
    <div className="w-full h-[400px] p-6 rounded-2xl border border-slate-200 bg-white shadow-inner overflow-y-auto text-slate-800 leading-relaxed font-medium text-base whitespace-pre-wrap">
      {parts.map((part, i) => (
        highlightText && part.toLowerCase() === highlightText.toLowerCase() ? (
          <mark 
            key={i} 
            className="bg-indigo-600 text-white rounded px-0.5 py-0 shadow-sm transition-all duration-300 animate-pulse ring-2 ring-indigo-200"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </div>
  );
};

export default NoteViewer;
