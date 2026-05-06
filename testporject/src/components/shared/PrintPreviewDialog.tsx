import React from 'react';

export interface PrintField {
  id: string;
  label: string;
  isCurrency?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: any[];
  titleField: string;
  fields: PrintField[];
  entityName: string;
  headerHighlightField?: string; // Field to show in the top right highlight (e.g. Est. Revenue)
}

export default function PrintPreviewDialog({ 
  isOpen, onClose, selectedItems, titleField, fields, entityName, headerHighlightField 
}: Props) {
  if (!isOpen) return null;

  const formatCurrency = (v: any) => `$${(parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 no-print font-sans">
      <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <h2 className="text-[16px] font-semibold text-slate-900">Print Preview - {entityName} ({selectedItems.length} items)</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-[#0072c6] text-white px-4 py-1.5 rounded text-[13px] hover:bg-[#005a9e] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Now
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
          {selectedItems.map((item, idx) => (
            <div key={item.id || idx} className="print-page bg-white p-10 shadow-sm border border-slate-200 mx-auto max-w-[800px]">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">{item[titleField] || 'Unnamed Record'}</h1>
                  <p className="text-slate-500 text-[14px]">{entityName} Detail Report</p>
                </div>
                {headerHighlightField && (
                  <div className="text-right">
                    <p className="font-bold text-[18px] text-[#0072c6]">{formatCurrency(item[headerHighlightField])}</p>
                    <p className="text-[12px] text-slate-500 uppercase tracking-widest">{headerHighlightField.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                {fields.map(f => (
                  <div key={f.id} className={f.id === 'description' || f.id === 'notes' ? 'col-span-2' : ''}>
                    <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">{f.label}</label>
                    <p className={`text-[14px] text-slate-900 ${f.id === 'description' || f.id === 'notes' ? 'leading-relaxed italic' : 'font-medium'}`}>
                      {f.isCurrency ? formatCurrency(item[f.id]) : (item[f.id] || 'N/A')}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Generated on {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                <span>Dynamics 365 Sales Hub</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hidden container for actual printing */}
      <div className="fixed inset-0 bg-white z-[-1] print-only p-0 m-0">
         {selectedItems.map((item, idx) => (
            <div key={item.id || idx} className="print-page p-10 m-0">
               <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">{item[titleField]}</h1>
                  <p className="text-slate-500 text-[14px]">{entityName} Detail Report</p>
                </div>
                {headerHighlightField && (
                  <div className="text-right">
                    <p className="font-bold text-[18px] text-black">{formatCurrency(item[headerHighlightField])}</p>
                    <p className="text-[12px] text-slate-500 uppercase tracking-widest">{headerHighlightField.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                {fields.map(f => (
                  <div key={f.id} className={f.id === 'description' || f.id === 'notes' ? 'col-span-2' : ''}>
                    <label className="text-[11px] uppercase font-bold text-slate-500 block mb-1">{f.label}</label>
                    <p className={`text-[14px] text-black ${f.id === 'description' || f.id === 'notes' ? 'leading-relaxed italic' : 'font-medium'}`}>
                      {f.isCurrency ? formatCurrency(item[f.id]) : (item[f.id] || 'N/A')}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Generated on {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                <span>Dynamics 365 Sales Hub</span>
              </div>
            </div>
         ))}
      </div>
    </div>
  );
}
