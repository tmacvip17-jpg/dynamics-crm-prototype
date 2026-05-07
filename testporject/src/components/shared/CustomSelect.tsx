import React, { useState, useEffect, useRef } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  showAvatar?: boolean;
  displayValue?: string;
}

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  showAvatar = false,
  displayValue
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return "";
    const parts = name.split(' ').filter(p => p.trim());
    if (parts.length === 0) return "";
    return parts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full cursor-pointer py-1.5 px-1 group/sel border-b border-transparent hover:border-slate-300 focus-within:border-[#0072c6] transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          {showAvatar && value ? (
            <div className="w-5 h-5 rounded-full bg-blue-100 text-[#005a9e] flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm">{getInitials(value)}</div>
          ) : showAvatar && !value ? (
            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] shrink-0"><span className="material-symbols-outlined text-[14px]">person</span></div>
          ) : null}
          <span className={`text-[13px] truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-400 font-normal'}`}>
            {displayValue || value || placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-all duration-200 ${isOpen ? 'rotate-180 text-[#0072c6]' : 'group-hover/sel:text-[#0072c6]'}`}>expand_more</span>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 min-w-full bg-white border border-slate-200 rounded-md shadow-2xl z-[999] py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {options.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-slate-400 italic bg-slate-50/30">No options available</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              {options.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer flex items-center gap-2.5 transition-all relative ${value === opt ? 'bg-blue-50 text-[#0072c6] font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:pl-5'}`}
                >
                  {value === opt && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0072c6]"></div>
                  )}
                  {showAvatar && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm ${value === opt ? 'bg-blue-200 text-[#005a9e]' : 'bg-slate-100 text-slate-500'}`}>{getInitials(opt)}</div>
                  )}
                  <span className="truncate flex-1">{opt}</span>
                  {value === opt && <span className="material-symbols-outlined text-[16px] ml-auto text-[#0072c6] animate-in fade-in scale-in-90 duration-300">check</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
