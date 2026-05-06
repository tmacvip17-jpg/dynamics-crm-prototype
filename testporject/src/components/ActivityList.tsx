import React, { useState, useEffect } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";
import { activitiesApi } from "../lib/api";
import type { Activity } from "../lib/types";
import CmdBtn from "./shared/CmdBtn";
import AdvancedSearchDialog from "./shared/AdvancedSearchDialog";
import PrintPreviewDialog from "./shared/PrintPreviewDialog";

export default function ActivityList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'subject', direction: 'asc' });

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<any[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => { try { setLoading(true); setActivities(await activitiesApi.list()); } catch (e: any) { setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCommand = (action: string) => {
    if (action === "New") onNew();
    else if (action === "Delete") { if (selectedIds.length === 0) { setAlertTitle("Warning"); setAlertMessage("Please select at least one item to delete."); setShowAlertDialog(true); } else setShowConfirmDialog(true); }
    else if (action === "Refresh") fetchData();
    else if (action === "Print") { if (selectedIds.length === 0) { setAlertTitle("Print"); setAlertMessage("Please select at least one activity to print."); setShowAlertDialog(true); } else setShowPrintPreview(true); }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedActivities = [...activities].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = (a as any)[key] || '';
    const valB = (b as any)[key] || '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredActivities = sortedActivities.filter(item => {
    // Keyword Search
    const matchesSearch = !searchTerm || 
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.regarding?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.activity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Advanced Filters
    if (filters.length === 0) return true;
    
    const checkRow = (f: any) => {
      const val = ((item as any)[f.field] || "").toString().toLowerCase();
      const target = (f.value || "").toLowerCase();
      switch (f.operator) {
        case 'eq': return val === target;
        case 'ne': return val !== target;
        case 'contains': return val.includes(target);
        case 'not_contains': return !val.includes(target);
        case 'gt': return parseFloat(val) > parseFloat(target);
        case 'lt': return parseFloat(val) < parseFloat(target);
        default: return true;
      }
    };

    return filterLogic === 'AND' ? filters.every(checkRow) : filters.some(checkRow);
  });

  const handleDelete = async () => { try { await activitiesApi.delete(selectedIds); setActivities(activities.filter(i => !selectedIds.includes(i.id))); setSelectedIds([]); setShowConfirmDialog(false); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } };
  const allChecked = filteredActivities.length > 0 && selectedIds.length === filteredActivities.length;
  const formatDate = (d: string | null) => { if (!d) return ''; const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`; };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="add" label="New" onClick={() => handleCommand("New")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand("Delete")} /><CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand("Refresh")} />
        <CmdBtn icon="mail" label="Email a link" onClick={() => handleCommand("Email a link")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="print" label="Print" onClick={() => handleCommand("Print")} />
      </div>

      <PrintPreviewDialog 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        selectedItems={activities.filter(o => selectedIds.includes(o.id))} 
        titleField="subject"
        entityName="Activities"
        fields={[
          { id: 'subject', label: 'Subject' },
          { id: 'activity_type', label: 'Activity Type' },
          { id: 'regarding', label: 'Regarding' },
          { id: 'priority', label: 'Priority' },
          { id: 'due_date', label: 'Due Date' },
          { id: 'owner', label: 'Owner' },
          { id: 'description', label: 'Description' }
        ]}
      />

      <AdvancedSearchDialog
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApply={setFilters}
        currentFilters={filters}
        logic={filterLogic}
        onLogicChange={setFilterLogic}
        entityName="Activities"
        fields={[
          { id: 'subject', label: 'Subject' },
          { id: 'activity_type', label: 'Activity Type' },
          { id: 'regarding', label: 'Regarding' },
          { id: 'priority', label: 'Priority' }
        ]}
      />

      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex items-center gap-2"><h1 className="text-[20px] font-normal text-slate-900">My Activities</h1><span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span></div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAdvancedSearch(true)}
            className={`flex items-center justify-center p-1 rounded transition-colors ${filters.length > 0 ? 'bg-blue-100 text-[#0072c6]' : 'text-slate-600 hover:bg-slate-100'}`} 
            title="Advanced Search"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          </button>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Filter by keyword" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-slate-300 rounded py-1 pl-3 pr-8 text-[13px] focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none transition-colors" 
            />
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white px-2">
        {loading ? <div className="flex items-center justify-center h-32 text-slate-500 text-[13px]">Loading...</div> : (
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full"><tr>
              <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(allChecked ? [] : filteredActivities.map(i => i.id))}><span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>{allChecked ? "check_box" : "check_box_outline_blank"}</span></th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('subject')}>
                <div className="flex items-center gap-1">Subject {sortConfig?.key === 'subject' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Activity Type</th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Regarding</th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Priority</th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Due Date</th>
            </tr></thead>
            <tbody>{filteredActivities.map((act, i) => (
              <tr key={act.id} onClick={() => onSelect(act.id)} className={`border-b border-slate-100 cursor-pointer ${selectedIds.includes(act.id) ? "bg-blue-50/50 hover:bg-blue-50" : `hover:bg-slate-50 ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`} group`}>
                <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(p => p.includes(act.id) ? p.filter(id => id !== act.id) : [...p, act.id]); }}><span className={`material-symbols-outlined text-[18px] cursor-pointer ${selectedIds.includes(act.id) ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>{selectedIds.includes(act.id) ? "check_box" : "check_box_outline_blank"}</span></td>
                <td className="py-3 px-3 text-[#0072c6] font-medium">{act.subject}</td>
                <td className="py-3 px-3 text-slate-800">{act.activity_type}</td>
                <td className="py-3 px-3 text-[#0072c6]">{act.regarding}</td>
                <td className="py-3 px-3 text-slate-800">{act.priority}</td>
                <td className="py-3 px-3 text-slate-800">{formatDate(act.due_date)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-[12px] text-slate-500 bg-white shrink-0 mt-auto">
        <div>1 - {filteredActivities.length} of {filteredActivities.length} (Filtered)</div>
        <div className="flex items-center gap-4"><span>Page 1</span><div className="flex items-center gap-1"><button className="p-1 text-slate-300 pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button><button className="p-1 text-slate-300 pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button></div></div>
      </div>
      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete the selected items?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}
