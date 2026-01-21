
import React, { useMemo, useEffect, useRef } from 'react';

interface NoteViewerProps {
  text: string;
  highlightText: string | null;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ text, highlightText }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeHighlightRef = useRef<HTMLElement>(null);

  const parts = useMemo(() => {
    if (!highlightText || !highlightText.trim() || !text.includes(highlightText)) {
      return [text];
    }

    // Escape special characters in the highlight text for regex
    const escapedHighlight = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    return text.split(regex);
  }, [text, highlightText]);

  // Handle automatic scrolling when highlight changes
  useEffect(() => {
    if (highlightText && activeHighlightRef.current) {
      activeHighlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightText]);

  return (
    <div 
      ref={scrollContainerRef}
      className="w-full h-[400px] p-6 rounded-2xl border border-slate-200 bg-white shadow-inner overflow-y-auto text-slate-800 leading-relaxed font-medium text-base whitespace-pre-wrap scroll-smooth custom-scrollbar"
    >
      {parts.map((part, i) => {
        const isMatch = highlightText && part.toLowerCase() === highlightText.toLowerCase();
        
        return isMatch ? (
          <mark 
            key={i} 
            ref={i === parts.findIndex(p => highlightText && p.toLowerCase() === highlightText.toLowerCase()) ? activeHighlightRef : null}
            className="evidence-highlight text-white rounded px-0.5 py-0 shadow-sm transition-all duration-300"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </div>
  );
};

export default NoteViewer;
