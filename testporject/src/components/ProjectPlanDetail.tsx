import React, { useState, useEffect, useRef } from "react";
import { projectPlansApi } from "../lib/api";
import type { ProjectPlan, ProjectPlanInput, TeamMember, PhaseTask } from "../lib/types";
import CmdBtn from "./shared/CmdBtn";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";
import CustomSelect from "./shared/CustomSelect";
import * as XLSX from "xlsx";

export default function ProjectPlanDetail({
  id,
  onBack,
  initialPhase,
  initialTaskId
}: {
  id: string | "new";
  onBack: () => void;
  initialPhase?: string | null;
  initialTaskId?: string | null;
}) {
  const [formData, setFormData] = useState<ProjectPlanInput>({
    name: "",
    status: "Draft",
    team_members: [],
    m0_start: "", m0_end: "", m0_tasks: [],
    m1_start: "", m1_end: "", m1_tasks: [],
    m2_start: "", m2_end: "", m2_tasks: [],
    m3_start: "", m3_end: "", m3_tasks: [],
    m4_start: "", m4_end: "", m4_tasks: [],
    owner: "Admin",
  });
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importState, setImportState] = useState<{
    file: File | null;
    status: 'idle' | 'importing' | 'done';
    progress: number;
    errors: string[];
    successCount: number;
  }>({ file: null, status: 'idle', progress: 0, errors: [], successCount: 0 });
  const [loading, setLoading] = useState(id !== "new");
  const [activeTab, setActiveTab] = useState("general");
  const [reminders, setReminders] = useState<{ message: string, type: 'warning' | 'alert' }[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({
    'm0': true, 'm1': true, 'm2': true, 'm3': true, 'm4': true
  });

  const togglePhase = (phaseId: string) => {
    setCollapsedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  useEffect(() => {
    if (initialPhase) {
      const phaseKey = initialPhase.toLowerCase();
      setActiveTab('phases');
      setCollapsedPhases(prev => ({ ...prev, [phaseKey]: false }));
      setTimeout(() => {
        const element = document.getElementById(`phase-section-${phaseKey}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('bg-blue-50/50');
          setTimeout(() => element.classList.remove('bg-blue-50/50'), 2000);
        }
      }, 500);
    }
  }, [initialPhase, loading]);

  useEffect(() => {
    if (id !== "new") {
      loadPlan();
    }
  }, [id]);

  useEffect(() => {
    generateReminders();
  }, [formData]);

  async function loadPlan() {
    setLoading(true);
    try {
      const data = await projectPlansApi.getById(id as string);
      if (data) {
        // 自动展开当前阶段
        if (data.current_phase) {
          setCollapsedPhases(prev => ({ ...prev, [data.current_phase!.toLowerCase()]: false }));
        }
        // Normalize data to handle legacy string data from DB
        const normalizedData = { ...data };

        const parseSubgrid = (val: any) => {
          if (Array.isArray(val)) return val.map((t: any) => ({ ...t, id: t.id || crypto.randomUUID() }));
          if (typeof val === 'string' && val.trim()) {
            return val.split(',').map(s => ({
              id: crypto.randomUUID(),
              name: s.trim(),
              task: s.trim(),
              role: 'Member',
              status: 'Not Started'
            }));
          }
          return [];
        };

        normalizedData.team_members = parseSubgrid(data.team_members);
        normalizedData.m0_tasks = parseSubgrid(data.m0_tasks);
        normalizedData.m1_tasks = parseSubgrid(data.m1_tasks);
        normalizedData.m2_tasks = parseSubgrid(data.m2_tasks);
        normalizedData.m3_tasks = parseSubgrid(data.m3_tasks);
        normalizedData.m4_tasks = parseSubgrid(data.m4_tasks);

        setFormData(normalizedData);
      }
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setLoading(false);
    }
  }

  const generateReminders = () => {
    const now = new Date();
    const newReminders: { message: string, type: 'warning' | 'alert' }[] = [];

    const phases = [
      { id: 'M0', start: formData.m0_start, end: formData.m0_end, label: '项目主备' },
      { id: 'M1', start: formData.m1_start, end: formData.m1_end, label: '方案设计' },
      { id: 'M2', start: formData.m2_start, end: formData.m2_end, label: '系统开发' },
      { id: 'M3', start: formData.m3_start, end: formData.m3_end, label: '系统上线' },
      { id: 'M4', start: formData.m4_start, end: formData.m4_end, label: '上线运维' },
    ];

    phases.forEach(p => {
      if (!p.end) return;
      const endDate = new Date(p.end);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        newReminders.push({ message: `Phase ${p.id} (${p.label}) is overdue!`, type: 'alert' });
      } else if (diffDays <= 7) {
        newReminders.push({ message: `Phase ${p.id} (${p.label}) is approaching deadline in ${diffDays} days.`, type: 'warning' });
      }
    });

    setReminders(newReminders);
  };

  const handleSave = async () => {
    try {
      if (id === "new") {
        await projectPlansApi.create(formData);
      } else {
        await projectPlansApi.update(id as string, formData);
      }
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      onBack();
    } catch (error) {
      console.error("Error saving plan:", error);
      setAlertTitle("Error");
      setAlertMessage("Failed to save project plan.");
      setShowAlertDialog(true);
    }
  };

  const handleExcelImport = () => {
    if (!importState.file) return;
    setImportState(prev => ({ ...prev, status: 'importing', progress: 0, errors: [], successCount: 0 }));

    const reader = new FileReader();
    reader.onload = (evt) => {
      setTimeout(() => { // Simulate progress for better UX
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          setImportState(prev => ({ ...prev, progress: 30 }));

          const newTasks: Record<string, PhaseTask[]> = {
            m0_tasks: [...(formData.m0_tasks || [])],
            m1_tasks: [...(formData.m1_tasks || [])],
            m2_tasks: [...(formData.m2_tasks || [])],
            m3_tasks: [...(formData.m3_tasks || [])],
            m4_tasks: [...(formData.m4_tasks || [])],
          };

          let successCount = 0;
          const errors: string[] = [];
          const validTeamMembers = (formData.team_members || []).map(m => m.name.toLowerCase());

          data.forEach((row: any, index: number) => {
            const rowIndex = index + 2; // +1 for 0-index, +1 for header
            const phaseRaw = row['Phase'] || row['阶段'];
            if (!phaseRaw) {
              errors.push(`Row ${rowIndex}: Missing "Phase" / "阶段".`);
              return;
            }
            
            const phase = String(phaseRaw).toLowerCase().trim();
            if (!['m0', 'm1', 'm2', 'm3', 'm4'].includes(phase)) {
               errors.push(`Row ${rowIndex}: Invalid Phase "${phaseRaw}". Must be M0-M4.`);
               return;
            }

            const owner = row['Owner'] || row['负责人'] || '';
            if (owner && !validTeamMembers.includes(owner.toLowerCase())) {
              errors.push(`Row ${rowIndex}: Owner "${owner}" does not exist in the Project Team.`);
              return; // Skip invalid row
            }

            if (newTasks[`${phase}_tasks`]) {
              newTasks[`${phase}_tasks`].push({
                task: row['Task Name'] || row['任务名称'] || row['Task'] || '',
                owner: owner,
                start_date: row['Start Date'] || row['开始时间'] || '',
                due_date: row['Due Date'] || row['结束时间'] || row['到期时间'] || '',
                status: row['Status'] || row['状态'] || 'Not Started',
                coordinating_resources: row['Coordinating Resources'] || row['协同资源'] || '',
                description: row['Description'] || row['描述'] || '',
                item_description: row['Item Description'] || row['事项描述'] || '',
                priority: row['Priority'] || row['优先级'] || 'Medium',
                reference_url: row['Reference URL'] || row['参考地址'] || ''
              });
              successCount++;
            }
          });

          setImportState(prev => ({ ...prev, progress: 80 }));

          setTimeout(() => {
            setFormData(prev => ({ ...prev, ...newTasks }));
            setImportState(prev => ({ ...prev, status: 'done', progress: 100, successCount, errors }));
          }, 500);

        } catch (err) {
          console.error("Error importing excel:", err);
          setImportState(prev => ({ ...prev, status: 'done', progress: 100, errors: ["Failed to parse Excel file. Invalid format."] }));
        }
      }, 500); // Simulate processing time
    };
    reader.readAsBinaryString(importState.file);
  };

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Phase', 'Task Name', 'Item Description', 'Description', 'Start Date', 'Due Date', 'Status', 'Owner', 'Coordinating Resources', 'Priority', 'Reference URL'],
      ['M0', 'Requirements Gathering', 'Detailed breakdown of items.', 'Gather initial requirements from stakeholders.', '2024-01-01', '2024-01-15', 'Not Started', 'John Doe', 'Team A, Team B', 'High', 'http://example.com/reqs'],
      ['M1', 'System Architecture', 'Server provisioning details.', 'Design the core architecture.', '2024-01-16', '2024-01-31', 'Not Started', 'Jane Smith', 'Dev Ops', 'Medium', 'http://example.com/arch']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks Template");
    XLSX.writeFile(wb, "Project_Plan_Tasks_Template.xlsx");
  };

  const handleDelete = async () => {
    try {
      if (id !== "new") {
        await projectPlansApi.delete([id]);
        onBack();
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Failed to delete project plan.");
      setShowAlertDialog(true);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="arrow_back" label="Back" onClick={onBack} />
        <CmdBtn icon="save" label="Save" onClick={handleSave} />
        <CmdBtn icon="refresh" label="Refresh" onClick={() => id !== "new" && loadPlan()} />
        <div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => setShowConfirmDialog(true)} />
        <div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="upload_file" label="Import Excel" onClick={() => setShowImportDialog(true)} />
        <CmdBtn icon="download" label="Download Template" onClick={downloadExcelTemplate} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
        <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
          <div className="flex flex-col self-stretch justify-between">
            <h1 className="text-xl font-normal text-slate-900 mb-5">{formData.name || "New Project Plan"}</h1>
            <div className="flex gap-6 mt-auto">
              <button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Plan Information</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 pb-[8px]">
            <HdrField label="Status" value={formData.status || "Draft"} />
            <HdrField label="Current Phase" value={formData.current_phase || "M0"} />
            <HdrField label="Active Reminders" value={reminders.length.toString()} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Owner</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-[#005a9e] flex items-center justify-center text-[10px] font-bold">AW</div>
                <span className="text-[13px] text-slate-900">{formData.owner || "Admin"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex px-1 mb-6 gap-8 overflow-x-auto no-scrollbar">
          <TabBtn label="General" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <TabBtn label="Phases & Timeline" active={activeTab === 'phases'} onClick={() => setActiveTab('phases')} />
          <TabBtn label={`Reminders (${reminders.length})`} active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} />
        </div>

        <div className="max-w-none">
          {activeTab === "general" && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                <FmField label="Project Name *" value={formData.name || ""} onChange={v => setFormData({ ...formData, name: v })} />
                <FmField label="Status" value={formData.status || "Draft"} isSelect options={['Draft', 'Active', 'On Hold', 'Completed']} onChange={v => setFormData({ ...formData, status: v })} />
              </div>

              <div className="space-y-4">
                <h2 className="text-[14px] font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#0072c6]">group</span>
                  Project Team
                </h2>
                <TeamSubgrid
                  data={formData.team_members || []}
                  onChange={team => setFormData({ ...formData, team_members: team })}
                />
              </div>
            </div>
          )}

          {activeTab === "phases" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100 mb-8">
                <div className="grid grid-cols-5 gap-4 relative">
                  {/* 连接线背景 */}
                  <div className="absolute top-4.5 left-[10%] right-[10%] h-0.5 bg-slate-200 z-0"></div>

                  {[
                    { id: 'M0', label: '项目准备', color: 'bg-blue-500', icon: 'flag' },
                    { id: 'M1', label: '方案设计', color: 'bg-indigo-500', icon: 'architecture' },
                    { id: 'M2', label: '系统开发', color: 'bg-purple-500', icon: 'code' },
                    { id: 'M3', label: '系统上线', color: 'bg-green-500', icon: 'rocket_launch' },
                    { id: 'M4', label: '上线运维', color: 'bg-orange-500', icon: 'support_agent' }
                  ].map((p, i) => {
                    const isActive = (formData.current_phase || 'M0') === p.id;
                    const isCompleted = ['M0', 'M1', 'M2', 'M3', 'M4'].indexOf(formData.current_phase || 'M0') > i;

                    return (
                      <div
                        key={p.id}
                        className="relative flex flex-col items-center group cursor-pointer z-10"
                        onClick={() => setFormData({ ...formData, current_phase: p.id })}
                      >
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md
                          ${isActive ? `${p.color} text-white scale-110 ring-4 ring-offset-2 ring-blue-100` :
                            isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-white text-slate-400 border-2 border-slate-200'}
                          group-hover:scale-105
                        `}>
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-[20px]">check</span>
                          ) : (
                            <span className="text-[13px] font-bold">{p.id}</span>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <div className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-[#0072c6]' : 'text-slate-500'}`}>{p.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{(formData as any)[`${p.id.toLowerCase()}_end`] || "TBD"}</div>
                        </div>

                        {/* 进度指示条 */}
                        {isActive && <div className="absolute -bottom-2 w-1.5 h-1.5 bg-[#0072c6] rounded-full animate-bounce"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {[
                  { id: 'm0', label: 'M0-项目准备' },
                  { id: 'm1', label: 'M1-方案设计' },
                  { id: 'm2', label: 'M2-系统开发' },
                  { id: 'm3', label: 'M3-系统上线' },
                  { id: 'm4', label: 'M4-上线运维' }
                ].map((phase) => {
                  const isCollapsed = collapsedPhases[phase.id];
                  return (
                    <div key={phase.id} id={`phase-section-${phase.id}`} className="space-y-4 p-2 rounded-lg transition-colors duration-500 bg-white">
                      <div
                        className="flex items-center justify-between border-b border-slate-200 pb-2 cursor-pointer group/phase"
                        onClick={() => togglePhase(phase.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180 text-[#0072c6]'}`}>expand_more</span>
                          <h3 className={`text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isCollapsed ? 'text-slate-600' : 'text-[#0072c6]'}`}>
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            {phase.label}
                          </h3>
                        </div>
                        <div className="flex gap-6 items-center">
                          {!isCollapsed && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Start:</span>
                                <input type="date" value={(formData as any)[`${phase.id}_start`] || ""} onClick={e => e.stopPropagation()} onChange={e => setFormData({ ...formData, [`${phase.id}_start`]: e.target.value })} className="text-[12px] outline-none border-b border-transparent focus:border-[#0072c6] bg-transparent" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">End:</span>
                                <input type="date" value={(formData as any)[`${phase.id}_end`] || ""} onClick={e => e.stopPropagation()} onChange={e => setFormData({ ...formData, [`${phase.id}_end`]: e.target.value })} className="text-[12px] outline-none border-b border-transparent focus:border-[#0072c6] bg-transparent" />
                              </div>
                            </>
                          )}
                          {isCollapsed && (
                            <span className="text-[11px] text-slate-400 italic">
                              {(formData as any)[`${phase.id}_start`] || "TBD"} — {(formData as any)[`${phase.id}_end`] || "TBD"}
                            </span>
                          )}
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <TaskSubgrid
                            data={(formData as any)[`${phase.id}_tasks`] || []}
                            onChange={tasks => setFormData({ ...formData, [`${phase.id}_tasks`]: tasks })}
                            teamOptions={(formData.team_members || []).map(m => m.name).filter(name => name)}
                            highlightTaskId={
                              initialPhase?.toLowerCase() === phase.id.toLowerCase()
                                ? (initialTaskId || null)
                                : null
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="space-y-4 max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              {reminders.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-lg border border-dashed border-slate-200 text-center">
                  <span className="material-symbols-outlined text-green-500 text-[40px] mb-3">verified</span>
                  <p className="text-slate-600 font-medium text-[14px]">All milestones are on track.</p>
                </div>
              ) : (
                reminders.map((r, i) => (
                  <div key={i} className={`p-4 rounded-lg border-l-4 shadow-sm flex items-start gap-4 ${r.type === 'alert' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-orange-50 border-orange-500 text-orange-800'}`}>
                    <span className="material-symbols-outlined mt-0.5">{r.type === 'alert' ? 'report' : 'notifications_active'}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold">{r.type === 'alert' ? 'OVERDUE' : 'UPCOMING'}</p>
                      <p className="text-[13px] mt-1 leading-relaxed">{r.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0">
        <span className="text-[#0072c6] font-medium">Project Plan ID: {id}</span>
        <span>Status: {formData.status}</span>
      </div>

      {/* Import Excel Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-[500px] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-[16px] font-semibold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0072c6]">upload_file</span>
                Import Tasks from Excel
              </h2>
              {importState.status !== 'importing' && (
                <button onClick={() => { setShowImportDialog(false); setImportState({ file: null, status: 'idle', progress: 0, errors: [], successCount: 0 }); }} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
            
            <div className="p-6 flex-1 min-h-[200px] max-h-[400px] overflow-y-auto">
              {importState.status === 'idle' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => setImportState(p => ({ ...p, file: e.target.files?.[0] || null }))} 
                    />
                    <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2">cloud_upload</span>
                    <p className="text-[13px] font-medium text-slate-700">
                      {importState.file ? importState.file.name : "Click or drag file to upload"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">.xlsx or .xls files only</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded text-[12px] text-slate-600 flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0072c6]">info</span>
                    <span>Validation: The 'Owner' in Excel must match a name in the Project Team exactly.</span>
                  </div>
                </div>
              )}

              {importState.status === 'importing' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0072c6] rounded-full animate-spin"></div>
                  <div className="text-[13px] font-medium text-slate-700">Validating and Importing Data...</div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-[#0072c6] h-2 rounded-full transition-all duration-300" style={{ width: `${importState.progress}%` }}></div>
                  </div>
                  <div className="text-[11px] text-slate-500 text-right w-full">{importState.progress}%</div>
                </div>
              )}

              {importState.status === 'done' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
                    <div className="w-10 h-10 bg-green-100 text-green-600 flex items-center justify-center rounded-full shrink-0">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-green-800">Import Completed</h3>
                      <p className="text-[12px] text-green-700">Successfully imported {importState.successCount} tasks.</p>
                    </div>
                  </div>

                  {importState.errors.length > 0 && (
                    <div className="mt-4 border border-red-200 rounded-lg overflow-hidden">
                      <div className="bg-red-50 px-4 py-2 border-b border-red-200 text-[12px] font-semibold text-red-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        {importState.errors.length} rows skipped due to errors
                      </div>
                      <div className="max-h-[150px] overflow-y-auto bg-white p-2">
                        <ul className="text-[11px] text-red-600 space-y-1 list-disc list-inside">
                          {importState.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
              {importState.status === 'idle' ? (
                <>
                  <button onClick={() => { setShowImportDialog(false); setImportState({ file: null, status: 'idle', progress: 0, errors: [], successCount: 0 }); }} className="px-4 py-1.5 border border-slate-300 rounded text-[12px] font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                  <button onClick={handleExcelImport} disabled={!importState.file} className="px-4 py-1.5 bg-[#0072c6] text-white rounded text-[12px] font-medium hover:bg-[#005a9e] disabled:opacity-50 disabled:cursor-not-allowed">Start Import</button>
                </>
              ) : importState.status === 'done' ? (
                <button onClick={() => { setShowImportDialog(false); setImportState({ file: null, status: 'idle', progress: 0, errors: [], successCount: 0 }); }} className="px-6 py-1.5 bg-[#0072c6] text-white rounded text-[12px] font-medium hover:bg-[#005a9e]">Close</button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete this project plan?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}

// --- Subgrid Components ---

function TeamSubgrid({ data, onChange }: { data: TeamMember[], onChange: (d: TeamMember[]) => void }) {
  const addRow = () => onChange([...data, { name: "", role: "", responsibility: "" }]);
  const updateRow = (i: number, field: keyof TeamMember, val: string) => {
    const newData = [...data];
    newData[i] = { ...newData[i], [field]: val };
    onChange(newData);
  };
  const removeRow = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="border border-slate-200 rounded">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Name</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Role</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase">Responsibility</th>
            <th className="w-10 px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 group">
              <td className="px-4 py-2">
                <input value={row.name || ""} onChange={e => updateRow(i, 'name', e.target.value)} className="w-full bg-transparent outline-none text-[13px]" placeholder="Enter name..." />
              </td>
              <td className="px-4 py-2">
                <input value={row.role || ""} onChange={e => updateRow(i, 'role', e.target.value)} className="w-full bg-transparent outline-none text-[13px]" placeholder="PM, Dev, etc." />
              </td>
              <td className="px-4 py-2">
                <input value={row.responsibility || ""} onChange={e => updateRow(i, 'responsibility', e.target.value)} className="w-full bg-transparent outline-none text-[13px]" placeholder="What they do..." />
              </td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-[13px] italic">No team members added yet.</td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={addRow} className="w-full py-2 bg-slate-50 text-[12px] text-[#0072c6] font-medium hover:bg-slate-100 flex items-center justify-center gap-1 border-t border-slate-200">
        <span className="material-symbols-outlined text-[16px]">add</span>
        Add Team Member
      </button>
    </div>
  );
}

function TaskSubgrid({ data, onChange, teamOptions, highlightTaskId }: {
  data: PhaseTask[];
  onChange: (d: PhaseTask[]) => void;
  teamOptions: string[];
  highlightTaskId?: string | null;
}) {
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const [flashRowIndex, setFlashRowIndex] = React.useState<number | null>(null);
  const rowRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);

  // Highlight & scroll: match strictly by unique task id
  React.useEffect(() => {
    if (!highlightTaskId || data.length === 0) return;
    const idx = data.findIndex(t => t.id === highlightTaskId);
    if (idx === -1) return;

    setSelectedRows([idx]);
    setFlashRowIndex(idx);
    setTimeout(() => {
      rowRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    setTimeout(() => setFlashRowIndex(null), 2500);
  }, [highlightTaskId, data.length]);

  const addRow = () => onChange([...data, { id: crypto.randomUUID(), task: "", owner: "", start_date: "", due_date: "", status: "Not Started", coordinating_resources: "", description: "", item_description: "", priority: "Medium", reference_url: "" }]);
  const updateRow = (i: number, field: keyof PhaseTask, val: string) => {
    const newData = [...data];
    newData[i] = { ...newData[i], [field]: val };
    onChange(newData);
  };
  const removeRow = (i: number) => {
    onChange(data.filter((_, idx) => idx !== i));
    setSelectedRows(prev => prev.filter(idx => idx !== i).map(idx => idx > i ? idx - 1 : idx));
  };
  const removeSelectedRows = () => {
    onChange(data.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  };

  const allChecked = data.length > 0 && selectedRows.length === data.length;
  const toggleAll = () => {
    if (allChecked) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, i) => i));
    }
  };
  const toggleRow = (i: number) => {
    if (selectedRows.includes(i)) {
      setSelectedRows(prev => prev.filter(idx => idx !== i));
    } else {
      setSelectedRows(prev => [...prev, i]);
    }
  };

  return (
    <div className="border border-slate-200 rounded overflow-x-auto">
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[12px] text-[#0072c6] font-medium">{selectedRows.length} item(s) selected</span>
          <button onClick={removeSelectedRows} className="flex items-center gap-1 text-[12px] text-red-600 hover:text-red-700 font-medium">
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Batch Delete
          </button>
        </div>
      )}
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 w-10 text-center cursor-pointer" onClick={toggleAll}>
              <span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>
                {allChecked ? "check_box" : "check_box_outline_blank"}
              </span>
            </th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-48">Task Name</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-48">Item Desc.</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-48">Description</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Start Date</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Due Date</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Status</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Owner</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Coord. Resources</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-24">Priority</th>
            <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase w-32">Ref URL</th>
            <th className="w-10 px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => {
            const isSelected = selectedRows.includes(i);
            const isFlashing = flashRowIndex === i;
            return (
            <tr
              key={i}
              ref={el => { rowRefs.current[i] = el; }}
              className={`group transition-colors duration-300 ${
                isFlashing
                  ? 'bg-amber-100 outline outline-2 outline-amber-400'
                  : isSelected
                  ? 'bg-blue-50/60'
                  : 'hover:bg-slate-50/50'
              }`}
            >
              <td className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleRow(i)}>
                <span className={`material-symbols-outlined text-[18px] ${isSelected ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>
                  {isSelected ? "check_box" : "check_box_outline_blank"}
                </span>
              </td>
              <td className="px-4 py-2">
                <input value={row.task || ""} onChange={e => updateRow(i, 'task', e.target.value)} className="w-full bg-transparent outline-none text-[13px]" placeholder="What needs to be done?" />
              </td>
              <td className="px-4 py-2">
                <input value={row.item_description || ""} title={row.item_description || "Enter item description"} onChange={e => updateRow(i, 'item_description', e.target.value)} className="w-full bg-transparent outline-none text-[13px] truncate" placeholder="Item Desc..." />
              </td>
              <td className="px-4 py-2">
                <input value={row.description || ""} title={row.description || "Enter description"} onChange={e => updateRow(i, 'description', e.target.value)} className="w-full bg-transparent outline-none text-[13px] truncate" placeholder="Description..." />
              </td>
              <td className="px-4 py-2">
                <input type="date" value={row.start_date || ""} onChange={e => updateRow(i, 'start_date', e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-slate-700 hover:text-slate-900 transition-colors" />
              </td>
              <td className="px-4 py-2">
                <input type="date" value={row.due_date || ""} onChange={e => updateRow(i, 'due_date', e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-slate-700 hover:text-slate-900 transition-colors" />
              </td>
              <td className="px-4 py-2">
                <CustomSelect
                  value={row.status || "Not Started"}
                  onChange={v => updateRow(i, 'status', v)}
                  options={['Not Started', 'In Progress', 'Completed', 'Delayed']}
                />
              </td>
              <td className="px-4 py-2">
                <CustomSelect
                  value={row.owner || ""}
                  onChange={v => updateRow(i, 'owner', v)}
                  options={teamOptions}
                  placeholder="Select Owner..."
                  showAvatar={true}
                />
              </td>
              <td className="px-4 py-2">
                <input value={row.coordinating_resources || ""} onChange={e => updateRow(i, 'coordinating_resources', e.target.value)} className="w-full bg-transparent outline-none text-[13px]" placeholder="Resources..." />
              </td>
              <td className="px-4 py-2">
                <CustomSelect
                  value={row.priority || "Medium"}
                  onChange={v => updateRow(i, 'priority', v)}
                  options={['High', 'Medium', 'Low']}
                />
              </td>
              <td className="px-4 py-2">
                <input value={row.reference_url || ""} onChange={e => updateRow(i, 'reference_url', e.target.value)} className="w-full bg-transparent outline-none text-[13px] text-[#0072c6] hover:underline" placeholder="URL..." />
              </td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </td>
            </tr>
          )})}
          {data.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-slate-400 text-[13px] italic">No tasks added for this phase.</td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={addRow} className="w-full py-2 bg-slate-50 text-[12px] text-[#0072c6] font-medium hover:bg-slate-100 flex items-center justify-center gap-1 border-t border-slate-200">
        <span className="material-symbols-outlined text-[16px]">add</span>
        Add Task
      </button>
    </div>
  );
}

// --- Helper Components ---

function HdrField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span>
      <span className="text-[13px] text-slate-900 font-medium">{value || '--'}</span>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-wider pb-2 relative transition-all ${active ? 'text-slate-800 border-b-[3px] border-[#0072c6] mb-[-2px]' : 'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'}`}>
      {label}
    </button>
  );
}

function FmField({ label, value, onChange, isDate, isSelect, options }: { label: string; value: string; onChange: (v: string) => void; isDate?: boolean; isSelect?: boolean; options?: string[] }) {
  return (
    <div className="flex flex-row items-center group py-1.5">
      <label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*') ? <>{label.replace(' *', '')}<span className="text-red-600"> *</span></> : label}</label>
      <div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">
        {isSelect ? (
          <CustomSelect value={value} onChange={onChange} options={options || []} />
        ) : (
          <input
            type={isDate ? "date" : "text"}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-transparent text-[13px] outline-none text-slate-900"
          />
        )}
      </div>
    </div>
  );
}
