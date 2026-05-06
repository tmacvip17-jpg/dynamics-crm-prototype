import React, { useState, useEffect } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";
import { competitorsApi } from "../lib/api";
import type { Competitor } from "../lib/types";

export default function CompetitorList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const fetchData = async () => { try { setLoading(true); setCompetitors(await competitorsApi.list()); } catch (e: any) { setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCompetitors = [...competitors].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = (a as any)[key] || '';
    const valB = (b as any)[key] || '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCommand = (action: string) => {
    if (action === "New") onNew();
    else if (action === "Delete") { if (selectedIds.length === 0) { setAlertTitle("Warning"); setAlertMessage("Please select at least one item to delete."); setShowAlertDialog(true); } else setShowConfirmDialog(true); }
    else if (action === "Refresh") fetchData();
    else { setAlertTitle("Action Failed"); setAlertMessage(`Action "${action}" is not fully implemented yet.`); setShowAlertDialog(true); }
  };

  const handleDelete = async () => { try { await competitorsApi.delete(selectedIds); setCompetitors(competitors.filter(i => !selectedIds.includes(i.id))); setSelectedIds([]); setShowConfirmDialog(false); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } };
  const allChecked = competitors.length > 0 && selectedIds.length === competitors.length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="add" label="New" onClick={() => handleCommand("New")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand("Delete")} /><CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand("Refresh")} />
        <CmdBtn icon="mail" label="Email a link" onClick={() => handleCommand("Email a link")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="upload" label="Import from Excel" onClick={() => handleCommand("Import from Excel")} /><CmdBtn icon="download" label="Export to Excel" onClick={() => handleCommand("Export to Excel")} />
      </div>
      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex items-center gap-2"><h1 className="text-[20px] font-normal text-slate-900">Active Competitors</h1><span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span></div>
        <div className="flex items-center gap-2"><button className="flex items-center justify-center p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"><span className="material-symbols-outlined text-[18px]">filter_list</span></button>
          <div className="relative w-64"><input type="text" placeholder="Filter by keyword" className="w-full border border-slate-300 rounded py-1 pl-3 pr-8 text-[13px] focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none transition-colors" /><span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span></div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white px-2">
        {loading ? <div className="flex items-center justify-center h-32 text-slate-500 text-[13px]">Loading...</div> : (
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full"><tr>
              <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(allChecked ? [] : competitors.map(i => i.id))}><span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>{allChecked ? "check_box" : "check_box_outline_blank"}</span></th>
              <th 
                className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name 
                  {sortConfig?.key === 'name' && (
                    <span className="material-symbols-outlined text-[14px] text-[#0072c6]">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Website</th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Strengths</th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Weaknesses</th>
            </tr></thead>
            <tbody>{sortedCompetitors.map((item, i) => (
              <tr key={item.id} onClick={() => onSelect(item.id)} className={`border-b border-slate-100 cursor-pointer ${selectedIds.includes(item.id) ? "bg-blue-50/50 hover:bg-blue-50" : `hover:bg-slate-50 ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`} group`}>
                <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id]); }}><span className={`material-symbols-outlined text-[18px] cursor-pointer ${selectedIds.includes(item.id) ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>{selectedIds.includes(item.id) ? "check_box" : "check_box_outline_blank"}</span></td>
                <td className="py-3 px-3 text-[#0072c6] font-medium">{item.name}</td>
                <td className="py-3 px-3 text-[#0072c6] hover:underline hover:cursor-pointer">{item.website}</td>
                <td className="py-3 px-3 text-slate-800">{item.strengths}</td>
                <td className="py-3 px-3 text-slate-800">{item.weaknesses}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-[12px] text-slate-500 bg-white shrink-0 mt-auto">
        <div>1 - {competitors.length} of {competitors.length}</div>
        <div className="flex items-center gap-4"><span>Page 1</span><div className="flex items-center gap-1"><button className="p-1 text-slate-300 pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button><button className="p-1 text-slate-300 pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button></div></div>
      </div>
      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete the selected items?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}

function CmdBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span>{label}</button>);
}
