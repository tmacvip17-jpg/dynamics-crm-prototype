import React from 'react';

interface Props {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function CmdBtn({ icon, label, onClick, disabled }: Props) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors whitespace-nowrap text-[13px] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700'}`}
    >
      <span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span>
      {label}
    </button>
  );
}
