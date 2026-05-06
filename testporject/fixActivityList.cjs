const fs = require('fs');

let c = fs.readFileSync('src/components/ActivityList.tsx', 'utf8');

const newHeader = `{/* Command Bar */}
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CommandButton icon="add" label="New" onClick={() => handleCommand('New')} />
        <div className="w-px h-4 bg-slate-300 mx-2"></div>
        <CommandButton icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
        <CommandButton icon="refresh" label="Refresh" onClick={() => handleCommand('Refresh')} />
        <CommandButton icon="mail" label="Email a link" onClick={() => handleCommand('Email a link')} />
        <div className="w-px h-4 bg-slate-300 mx-2"></div>
        <CommandButton icon="download" label="Export to Excel" onClick={() => handleCommand('Export to Excel')} />
        <CommandButton icon="star" label="Show Chart" onClick={() => handleCommand('Show Chart')} />
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
         <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-normal text-slate-900">My Activities</h1>
            <span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span>
         </div>
         <div className="flex items-center gap-2">
             <button className="flex items-center justify-center p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Advanced Search">
                 <span className="material-symbols-outlined text-[18px]">filter_list</span>
             </button>
             <div className="relative w-64">
                 <input type="text" placeholder="Filter by keyword" className="w-full border border-slate-300 rounded py-1 pl-3 pr-8 text-[13px] focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none transition-colors" />
                 <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
             </div>
         </div>
      </div>`;

c = c.replace(/\{\/\* Header \/ Command Bar \*\/\}[\s\S]*?\{\/\* Data Grid \*\/\}/, newHeader + '\n\n      {/* Data Grid */}');

// We also need to add CommandButton function at the end
const cmdBtn = `
function CommandButton({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span>
            {label}
        </button>
    );
}
`;

if (!c.includes('function CommandButton')) {
    c += cmdBtn;
}

// Make sure the table matches OpportunityList 
c = c.replace(/<thead[\s\S]*?<\/thead>/, `<thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full">
                        <tr>
                            <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(allCheckedCond ? [] : activities.map(item => item.id))}>
                                <span className={\`material-symbols-outlined text-[18px] \${allCheckedCond ? 'text-[#0072c6]' : 'text-slate-400'}\`}>
                                    {allCheckedCond ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Subject <span className="material-symbols-outlined text-[14px] align-middle">arrow_downward</span></th>
                            <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Activity Type</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Regarding</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Priority</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Due Date</th>
                        </tr>
                    </thead>`);

// Replace pagination
c = c.replace(/\{\/\* Pagination \*\/\}[\s\S]*?<ConfirmationDialog/g, `<div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-[12px] text-slate-500 bg-white shrink-0 mt-auto">
        <div>1 - {activities.length} of {activities.length}</div>
        <div className="flex items-center gap-4">
          <span>Page 1</span>
          <div className="flex items-center gap-1">
            <button className="p-1 text-slate-300 pointer-events-none">
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <button className="p-1 text-slate-300 pointer-events-none">
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
         </div>
      </div>
      
      <ConfirmationDialog`);

// replace the outer table container "flex-1 overflow-auto" to "flex-1 overflow-auto bg-white px-2"
c = c.replace(/<div className="flex-1 overflow-auto">/, '<div className="flex-1 overflow-auto bg-white px-2">');

// remove min-w-[800px]
c = c.replace(/<div className="min-w-\[800px\]">\s*<table className="w-full text-left border-collapse">/, '<table className="w-full text-left border-collapse text-[13px]">');
c = c.replace(/<\/table>\s*<\/div>/, '</table>');

fs.writeFileSync('src/components/ActivityList.tsx', c, 'utf8');
