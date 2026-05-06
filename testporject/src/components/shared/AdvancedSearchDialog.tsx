import React, { useState, useEffect } from 'react';

export interface SearchField {
  id: string;
  label: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterCondition[]) => void;
  currentFilters: FilterCondition[];
  logic: 'AND' | 'OR';
  onLogicChange: (l: 'AND' | 'OR') => void;
  fields: SearchField[];
  entityName: string;
}

export default function AdvancedSearchDialog({ 
  isOpen, onClose, onApply, currentFilters, logic, onLogicChange, fields, entityName 
}: Props) {
  const [localFilters, setLocalFilters] = useState<FilterCondition[]>(
    currentFilters.length > 0 ? currentFilters : [{ field: fields[0]?.id || '', operator: 'contains', value: '' }]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLocalFilters(currentFilters.length > 0 ? currentFilters : [{ field: fields[0]?.id || '', operator: 'contains', value: '' }]);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, currentFilters, fields]);

  if (!isOpen) return null;

  const addRow = () => setLocalFilters([...localFilters, { field: fields[0]?.id || '', operator: 'contains', value: '' }]);
  const removeRow = (index: number) => setLocalFilters(localFilters.filter((_, i) => i !== index));
  const updateRow = (index: number, key: string, val: any) => {
    const next = [...localFilters];
    (next[index] as any)[key] = val;
    setLocalFilters(next);
  };

  const operators = [
    { id: 'eq', label: 'Equals' },
    { id: 'ne', label: 'Does not equal' },
    { id: 'contains', label: 'Contains' },
    { id: 'not_contains', label: 'Does not contain' },
    { id: 'gt', label: 'Greater than' },
    { id: 'lt', label: 'Less than' }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex justify-end font-sans">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-[500px] h-full bg-white shadow-[-8px_0_24px_-4px_rgba(0,0,0,0.1)] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0072c6] text-[24px]">filter_alt</span>
            <h2 className="text-[17px] font-semibold text-slate-800">Advanced Filters - {entityName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Filter Logic</h3>
            <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
              <button 
                onClick={() => onLogicChange('AND')}
                className={`px-6 py-2 rounded-md text-[13px] font-medium transition-all ${logic === 'AND' ? 'bg-white text-[#0072c6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Match ALL (AND)
              </button>
              <button 
                onClick={() => onLogicChange('OR')}
                className={`px-6 py-2 rounded-md text-[13px] font-medium transition-all ${logic === 'OR' ? 'bg-white text-[#0072c6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Match ANY (OR)
              </button>
            </div>
            <p className="text-[12px] text-slate-500 italic">
              {logic === 'AND' ? 'Show records that match every filter below.' : 'Show records that match at least one filter below.'}
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Conditions</h3>
              <button 
                onClick={addRow}
                className="flex items-center gap-1 text-[13px] text-[#0072c6] font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Add condition
              </button>
            </div>
            
            <div className="space-y-4">
              {localFilters.map((f, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3 relative group">
                  <div className="flex items-center gap-2">
                    <select 
                      value={f.field} 
                      onChange={e => updateRow(i, 'field', e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-[13px] bg-white outline-none focus:border-[#0072c6] transition-colors"
                    >
                      {fields.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
                    </select>
                    <button 
                      onClick={() => removeRow(i)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={f.operator} 
                      onChange={e => updateRow(i, 'operator', e.target.value)}
                      className="w-40 border border-slate-300 rounded px-3 py-1.5 text-[13px] bg-white outline-none focus:border-[#0072c6] transition-colors"
                    >
                      {operators.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                    </select>
                    <input 
                      type="text" 
                      value={f.value} 
                      onChange={e => updateRow(i, 'value', e.target.value)}
                      placeholder="Value..."
                      className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-[13px] bg-white outline-none focus:border-[#0072c6] transition-colors"
                    />
                  </div>
                </div>
              ))}
              {localFilters.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-400 text-[13px]">No conditions added. Showing all records.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <button 
            onClick={() => { setLocalFilters([]); onApply([]); onClose(); }}
            className="text-[13px] text-slate-600 hover:text-slate-900 px-4 py-2 font-medium transition-colors"
          >
            Reset All
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded text-[13px] text-slate-700 hover:bg-white transition-colors bg-white font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => { onApply(localFilters.filter(f => f.value !== '')); onClose(); }}
              className="px-8 py-2 bg-[#0072c6] text-white rounded text-[13px] font-semibold hover:bg-[#005a9e] transition-all shadow-md active:scale-95"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
