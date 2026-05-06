const fs = require('fs');
let c = fs.readFileSync('src/components/ActivityDetail.tsx', 'utf8');

const newToolbar = `      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white sticky top-0 z-10">
          <CommandButton icon="save" label="Save" onClick={() => handleCommand("Save")} />
          <CommandButton icon="save_as" label="Save & Close" onClick={() => handleCommand("Save & Close")} />
          <div className="w-px h-4 bg-slate-300 mx-2"></div>
          <CommandButton icon="delete" label="Delete" onClick={() => handleCommand("Delete")} />
      </div>`;

c = c.replace(/<div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-white sticky top-0 z-10">[\s\S]*?<\/div>\s*<\/div>/, newToolbar);

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

// Ensure header layout matches others just slightly since it has different tabs
c = c.replace(/<div className="px-6 py-4 border-b border-slate-100">[\s\S]*?<\/div>/, `<div className="px-6 py-4 flex items-end justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm gap-4">
        <div className="flex flex-col self-stretch justify-between">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">TASK</div>
            <h1 className="text-xl font-normal text-slate-900 mb-5">Follow up on proposal</h1>
        </div>
      </div>`);

// Also change the Tab link part
c = c.replace(/<div className="flex px-6 pt-4 border-b border-slate-200">[\s\S]*?<\/div>/, `<div className="flex gap-6 mt-[-10px] px-6 border-b border-slate-200">
          <button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">
            Activity Information
          </button>
      </div>`);

// Also use slightly different content layout
c = c.replace(/<div className="flex-1 overflow-y-auto px-6 py-6 pb-24">/, '<div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-white pb-24">');


fs.writeFileSync('src/components/ActivityDetail.tsx', c, 'utf8');
