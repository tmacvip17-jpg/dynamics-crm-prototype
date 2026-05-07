import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { projectPlansApi } from "../lib/api";
import type { ProjectPlan } from "../lib/types";
import CmdBtn from "./shared/CmdBtn";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";

export default function ProjectPlanList({
  onSelect,
  onNew,
}: {
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await projectPlansApi.list();
      setPlans(data);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCommand = (action: string) => {
    if (action === "New") onNew();
    else if (action === "Delete") {
      if (selectedIds.length === 0) {
        setAlertTitle("Warning");
        setAlertMessage("Please select at least one item to delete.");
        setShowAlertDialog(true);
      } else {
        setShowConfirmDialog(true);
      }
    }
    else if (action === "Refresh") loadPlans();
    else if (action === "Import") setShowImportModal(true);
    else if (action === "Download Template") downloadTemplate();
  };

  const downloadTemplate = () => {
    const templateData = [{ 
      "Project Name": "Sample ERP Project", 
      "Status": "Active", 
      "Team Members": "John Doe, Jane Smith",
      "M0开始时间": "2024-01-01", "M0结束时间": "2024-01-15", "M0具体事项": "Project Setup",
      "M1开始时间": "2024-01-16", "M1结束时间": "2024-02-15", "M1具体事项": "Solution Design",
      "M2开始时间": "2024-02-16", "M2结束时间": "2024-05-15", "M2具体事项": "System Development",
      "M3开始时间": "2024-05-16", "M3结束时间": "2024-06-01", "M3具体事项": "UAT & Go-live",
      "M4开始时间": "2024-06-02", "M4结束时间": "2024-12-31", "M4具体事项": "Maintenance"
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Project_Plan_Template.xlsx");
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length > 0) {
          setImportProgress({ current: 0, total: data.length });
          const newPlans = data.map(row => {
            const teamStr = row["Team Members"] || row["项目团队成员"] || "";
            const team = teamStr.split(",").map((s: string) => ({ name: s.trim(), role: "Member", responsibility: "" })).filter((m: any) => m.name);

            const mapTasks = (val: any) => {
              if (!val) return [];
              return val.split(",").map((s: string) => ({ task: s.trim(), owner: "", due_date: "", status: "Not Started" })).filter((t: any) => t.task);
            };

            return {
              name: row["Project Name"] || row["项目名称"] || "New Project",
              status: row["Status"] || row["状态"] || "Draft",
              team_members: team,
              m0_start: row["M0开始时间"] || row["M0 Start"] || null,
              m0_end: row["M0结束时间"] || row["M0 End"] || null,
              m0_tasks: mapTasks(row["M0具体事项"] || row["M0 Tasks"]),
              m1_start: row["M1开始时间"] || row["M1 Start"] || null,
              m1_end: row["M1结束时间"] || row["M1 End"] || null,
              m1_tasks: mapTasks(row["M1具体事项"] || row["M1 Tasks"]),
              m2_start: row["M2开始时间"] || row["M2 Start"] || null,
              m2_end: row["M2结束时间"] || row["M2 End"] || null,
              m2_tasks: mapTasks(row["M2具体事项"] || row["M2 Tasks"]),
              m3_start: row["M3开始时间"] || row["M3 Start"] || null,
              m3_end: row["M3结束时间"] || row["M3 End"] || null,
              m3_tasks: mapTasks(row["M3具体事项"] || row["M3 Tasks"]),
              m4_start: row["M4开始时间"] || row["M4 Start"] || null,
              m4_end: row["M4结束时间"] || row["M4 End"] || null,
              m4_tasks: mapTasks(row["M4具体事项"] || row["M4 Tasks"]),
              owner: "Admin",
            };
          });

          const chunkSize = 10;
          for (let i = 0; i < newPlans.length; i += chunkSize) {
            const chunk = newPlans.slice(i, i + chunkSize);
            await projectPlansApi.createMany(chunk);
            setImportProgress({ current: Math.min(i + chunkSize, newPlans.length), total: newPlans.length });
          }
          
          await loadPlans();
          setShowImportModal(false);
          setSelectedFile(null);
          setAlertTitle("Success");
          setAlertMessage(`Successfully imported ${newPlans.length} project plans.`);
          setShowAlertDialog(true);
        }
      } catch (error) {
        console.error("Import failed:", error);
        setAlertTitle("Error");
        setAlertMessage("Import failed. Please check the Excel format.");
        setShowAlertDialog(true);
      } finally {
        setLoading(false);
        setImportProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await projectPlansApi.delete(selectedIds);
      setPlans(plans.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error deleting plans:", error);
      setAlertTitle("Error");
      setAlertMessage("Failed to delete project plans.");
      setShowAlertDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = plans.filter(plan => {
    const nameMatch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    let teamMatch = false;
    if (Array.isArray(plan.team_members)) {
      teamMatch = plan.team_members.some(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (typeof plan.team_members === 'string') {
      teamMatch = (plan.team_members as string).toLowerCase().includes(searchTerm.toLowerCase());
    }
    return nameMatch || teamMatch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allChecked = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

  const getPhaseStatus = (plan: ProjectPlan) => {
    const phaseLabels: Record<string, string> = {
      'M0': 'M0-项目准备',
      'M1': 'M1-方案设计',
      'M2': 'M2-系统开发',
      'M3': 'M3-系统上线',
      'M4': 'M4-上线运维'
    };
    
    const current = plan.current_phase || 'M0';
    return { 
      label: phaseLabels[current] || current, 
      status: plan.status, 
      color: current === 'M4' ? 'text-slate-500' : 'text-[#0072c6]' 
    };
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); }} />
      
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="add" label="New" onClick={() => handleCommand("New")} />
        <div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand("Delete")} />
        <CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand("Refresh")} />
        <div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="download" label="Download Template" onClick={() => handleCommand("Download Template")} />
        <CmdBtn icon="upload" label="Import from Excel" onClick={() => handleCommand("Import")} />
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-normal text-slate-900">Software Project Plans</h1>
          <span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <input type="text" placeholder="Filter by keyword" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border border-slate-300 rounded py-1 pl-3 pr-8 text-[13px] focus:border-[#0072c6] focus:ring-1 focus:ring-[#0072c6] outline-none transition-colors" />
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 no-scrollbar">
        {loading && !importProgress ? <div className="flex items-center justify-center h-32 text-slate-500 text-[13px]">Loading...</div> : (
          <table className="w-full text-left border-collapse text-[13px] table-fixed">
            <thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full"><tr>
              <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(prev => allChecked ? prev.filter(id => !paginatedData.some(i => i.id === id)) : [...prev, ...paginatedData.map(i => i.id).filter(id => !prev.includes(id))])}><span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>{allChecked ? "check_box" : "check_box_outline_blank"}</span></th>
              <th className="py-2.5 px-3 w-1/4 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Project Name</th>
              <th className="py-2.5 px-3 w-32 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Status</th>
              <th className="py-2.5 px-3 w-40 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Current Phase</th>
              <th className="py-2.5 px-3 w-1/4 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Team Members</th>
              <th className="py-2.5 px-3 w-32 font-semibold text-slate-600 uppercase tracking-widest text-[11px]">Owner</th>
            </tr></thead>
            <tbody>{paginatedData.map((item, i) => {
              const phaseInfo = getPhaseStatus(item);
              return (
                <tr key={item.id} onClick={() => onSelect(item.id)} className={`border-b border-slate-100 cursor-pointer ${selectedIds.includes(item.id) ? "bg-blue-50/50 hover:bg-blue-50" : `hover:bg-slate-50 ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`} group`}>
                  <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id]); }}><span className={`material-symbols-outlined text-[18px] cursor-pointer ${selectedIds.includes(item.id) ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>{selectedIds.includes(item.id) ? "check_box" : "check_box_outline_blank"}</span></td>
                  <td className="py-3 px-3 text-[#0072c6] font-medium truncate">{item.name}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                  <td className="py-3 px-3"><span className={`font-medium ${phaseInfo.color}`}>{phaseInfo.label}</span></td>
                  <td className="py-3 px-3 text-slate-600 truncate">
                    {Array.isArray(item.team_members) 
                      ? item.team_members.map(m => m.name).join(", ") 
                      : (item.team_members || "")}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{item.owner}</td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>

      <div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-[12px] text-slate-500 bg-white shrink-0 mt-auto">
        <div>{filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}</div>
        <div className="flex items-center gap-4">
          <span>Page {currentPage} of {totalPages || 1}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className={`p-1 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-[#0072c6]">upload_file</span>Import Project Plans</h2>
              {!importProgress && <button onClick={() => { setShowImportModal(false); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>}
            </div>
            <div className="px-8 py-10 flex flex-col items-center gap-6">
              {!importProgress ? (
                <>
                  <div className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'border-[#0072c6] bg-blue-50/30' : 'border-slate-200 hover:border-[#0072c6] hover:bg-slate-50/50'}`} onClick={() => fileInputRef.current?.click()}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedFile ? 'bg-[#0072c6] text-white' : 'bg-slate-100 text-slate-400'}`}><span className="material-symbols-outlined text-[32px]">{selectedFile ? 'description' : 'cloud_upload'}</span></div>
                    <div className="text-center"><p className="text-[15px] font-medium text-slate-700">{selectedFile ? selectedFile.name : 'Click to select Excel file'}</p><p className="text-[12px] text-slate-500 mt-1">Supports .xlsx and .xls formats</p></div>
                  </div>
                  <p className="text-[12px] text-slate-500 text-center px-4 leading-relaxed">Make sure your file matches the system template. <br/><button onClick={downloadTemplate} className="text-[#0072c6] hover:underline font-medium">Download Template</button></p>
                </>
              ) : (
                <div className="w-full flex flex-col gap-5 py-6">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1.5"><span className="text-[14px] font-semibold text-slate-800">Processing Import...</span><span className="text-[12px] text-slate-500 font-medium">Step {importProgress.current} of {importProgress.total} records</span></div>
                    <span className="text-[24px] font-bold text-[#0072c6] tabular-nums">{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div className="h-full bg-[#0072c6] transition-all duration-300 relative" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}>
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress_2s_linear_infinite]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b border-t border-slate-100">
              {!importProgress && (
                <>
                  <button onClick={() => { setShowImportModal(false); setSelectedFile(null); }} className="px-5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded transition-colors">Cancel</button>
                  <button onClick={() => selectedFile && handleImport(selectedFile)} disabled={!selectedFile || loading} className={`px-6 py-2 text-[13px] font-medium text-white rounded transition-all shadow-sm ${!selectedFile || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#0072c6] hover:bg-[#005a9e] active:scale-95'}`}>Start Import</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete the selected items?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}
