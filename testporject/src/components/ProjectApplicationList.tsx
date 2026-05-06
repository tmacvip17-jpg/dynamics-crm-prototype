import React, { useState, useEffect, useRef } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";
import { projectApplicationsApi } from "../lib/api";
import type { ProjectApplication } from "../lib/types";
import CmdBtn from "./shared/CmdBtn";
import AdvancedSearchDialog from "./shared/AdvancedSearchDialog";
import PrintPreviewDialog from "./shared/PrintPreviewDialog";
import * as XLSX from "xlsx";

export default function ProjectApplicationList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<any[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column Resizing Logic
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    name: 200,
    application_name: 250,
    segment: 150,
    segment_cn: 150,
    created_at: 180
  });

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    resizingRef.current = {
      key,
      startX: e.pageX,
      startWidth: columnWidths[key]
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { key, startX, startWidth } = resizingRef.current;
    const delta = e.pageX - startX;
    const newWidth = Math.max(50, startWidth + delta);
    setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
  };

  const onMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
  };

  const fetchData = async () => { try { setLoading(true); setApplications(await projectApplicationsApi.list()); } catch (e: any) { setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCommand = (action: string) => {
    if (action === "New") onNew();
    else if (action === "Delete") { if (selectedIds.length === 0) { setAlertTitle("Warning"); setAlertMessage("Please select at least one item to delete."); setShowAlertDialog(true); } else setShowConfirmDialog(true); }
    else if (action === "Refresh") fetchData();
    else if (action === "Print") { if (selectedIds.length === 0) { setAlertTitle("Print"); setAlertMessage("Please select at least one item to print."); setShowAlertDialog(true); } else setShowPrintPreview(true); }
    else if (action === "Import from Excel") setShowImportModal(true);
    else if (action === "Download Template") downloadTemplate();
  };

  const downloadTemplate = () => {
    const templateData = [{ "Name": "App A", "Application Name": "CRM System", "Segment": "Enterprise", "Segment CN": "企业级", "Owner": "Alan White" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Project_Application_Import_Template.xlsx");
  };

  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const newApps = jsonData.map(row => ({
        name: row.Name || row.name || 'Imported App',
        application_name: row['Application Name'] || row.application_name || '',
        segment: row.Segment || row.segment || '',
        segment_cn: row['Segment CN'] || row.segment_cn || '',
        owner: row.Owner || row.owner || 'Alan White',
        status: 'Active'
      }));

      if (newApps.length > 0) {
        setImportProgress({ current: 0, total: newApps.length });
        const chunkSize = 20;
        for (let i = 0; i < newApps.length; i += chunkSize) {
          const chunk = newApps.slice(i, i + chunkSize);
          await projectApplicationsApi.createMany(chunk);
          setImportProgress({ current: Math.min(i + chunkSize, newApps.length), total: newApps.length });
        }
        setShowImportModal(false);
        setSelectedFile(null);
        setAlertTitle("Success");
        setAlertMessage(`Successfully imported ${newApps.length} project applications.`);
        setShowAlertDialog(true);
        fetchData();
      }
    } catch (err: any) {
      setAlertTitle("Error");
      setAlertMessage("Failed to import Excel file: " + err.message);
      setShowAlertDialog(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
      setImportProgress(null);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...applications].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = (a as any)[key] || '';
    const valB = (b as any)[key] || '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.application_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.segment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.segment_cn?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters, filterLogic]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async () => { try { await projectApplicationsApi.delete(selectedIds); setApplications(applications.filter(i => !selectedIds.includes(i.id))); setSelectedIds([]); setShowConfirmDialog(false); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } };
  const allChecked = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));
  const formatDate = (d: string) => { if (!d) return ''; const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`; };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); }} />
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="add" label="New" onClick={() => handleCommand("New")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand("Delete")} /><CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand("Refresh")} />
        <CmdBtn icon="mail" label="Email a link" onClick={() => handleCommand("Email a link")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="download" label="Download Template" onClick={() => handleCommand("Download Template")} />
        <CmdBtn icon="upload" label="Import from Excel" onClick={() => handleCommand("Import from Excel")} />
        <CmdBtn icon="print" label="Print" onClick={() => handleCommand("Print")} />
      </div>

      <PrintPreviewDialog 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        selectedItems={applications.filter(o => selectedIds.includes(o.id))} 
        titleField="name"
        entityName="Project Applications"
        fields={[
          { id: 'name', label: 'Name' },
          { id: 'application_name', label: 'Application Name' },
          { id: 'segment', label: 'Segment' },
          { id: 'segment_cn', label: 'Segment CN' },
          { id: 'owner', label: 'Owner' },
          { id: 'created_at', label: 'Created On' }
        ]}
      />

      <AdvancedSearchDialog
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApply={setFilters}
        currentFilters={filters}
        logic={filterLogic}
        onLogicChange={setFilterLogic}
        entityName="Project Applications"
        fields={[
          { id: 'name', label: 'Name' },
          { id: 'application_name', label: 'Application Name' },
          { id: 'segment', label: 'Segment' },
          { id: 'segment_cn', label: 'Segment CN' }
        ]}
      />

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0072c6]">upload_file</span>
                Import Project Applications
              </h2>
              {!importProgress && (
                <button onClick={() => { setShowImportModal(false); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
            
            <div className="px-8 py-10 flex flex-col items-center gap-6">
              {!importProgress ? (
                <>
                  <div 
                    className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'border-[#0072c6] bg-blue-50/30' : 'border-slate-200 hover:border-[#0072c6] hover:bg-slate-50/50'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedFile ? 'bg-[#0072c6] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[32px]">
                        {selectedFile ? 'description' : 'cloud_upload'}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-medium text-slate-700">
                        {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-1">Supports .xlsx and .xls formats</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-500 text-center px-4 leading-relaxed">
                    Make sure your file matches the system template. <br/>
                    <button onClick={downloadTemplate} className="text-[#0072c6] hover:underline font-medium">Download Template</button>
                  </p>
                </>
              ) : (
                <div className="w-full flex flex-col gap-5 py-6">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-semibold text-slate-800">Processing Import...</span>
                      <span className="text-[12px] text-slate-500 font-medium">Step {importProgress.current} of {importProgress.total} records</span>
                    </div>
                    <span className="text-[24px] font-bold text-[#0072c6] tabular-nums">
                      {Math.round((importProgress.current / importProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div 
                      className="h-full bg-[#0072c6] transition-all duration-300 relative" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    >
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
                  <button 
                    onClick={() => selectedFile && handleImport(selectedFile)}
                    disabled={!selectedFile || loading}
                    className={`px-6 py-2 text-[13px] font-medium text-white rounded transition-all shadow-sm ${!selectedFile || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#0072c6] hover:bg-[#005a9e] active:scale-95'}`}
                  >
                    Start Import
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex items-center gap-2"><h1 className="text-[20px] font-normal text-slate-900">Project Applications</h1><span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span></div>
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
        {loading && !importProgress ? <div className="flex items-center justify-center h-32 text-slate-500 text-[13px]">Loading...</div> : (
          <table className="w-full text-left border-collapse text-[13px] table-fixed">
            <thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full"><tr>
              <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(prev => allChecked ? prev.filter(id => !paginatedData.some(i => i.id === id)) : [...prev, ...paginatedData.map(i => i.id).filter(id => !prev.includes(id))])}><span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>{allChecked ? "check_box" : "check_box_outline_blank"}</span></th>
              <th style={{ width: columnWidths.name }} className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors relative group" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Name {sortConfig?.key === 'name' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                <div onMouseDown={(e) => onMouseDown(e, 'name')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0072c6] transition-colors" onClick={(e) => e.stopPropagation()} />
              </th>
              <th style={{ width: columnWidths.application_name }} className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] relative group">
                Application Name
                <div onMouseDown={(e) => onMouseDown(e, 'application_name')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0072c6] transition-colors" />
              </th>
              <th style={{ width: columnWidths.segment }} className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] relative group">
                Segment
                <div onMouseDown={(e) => onMouseDown(e, 'segment')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0072c6] transition-colors" />
              </th>
              <th style={{ width: columnWidths.segment_cn }} className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] relative group">
                Segment CN
                <div onMouseDown={(e) => onMouseDown(e, 'segment_cn')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0072c6] transition-colors" />
              </th>
              <th style={{ width: columnWidths.created_at }} className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] relative group">
                Created On
                <div onMouseDown={(e) => onMouseDown(e, 'created_at')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#0072c6] transition-colors" />
              </th>
            </tr></thead>
            <tbody>{paginatedData.map((item, i) => (
              <tr key={item.id} onClick={() => onSelect(item.id)} className={`border-b border-slate-100 cursor-pointer ${selectedIds.includes(item.id) ? "bg-blue-50/50 hover:bg-blue-50" : `hover:bg-slate-50 ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`} group`}>
                <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id]); }}><span className={`material-symbols-outlined text-[18px] cursor-pointer ${selectedIds.includes(item.id) ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>{selectedIds.includes(item.id) ? "check_box" : "check_box_outline_blank"}</span></td>
                <td className="py-3 px-3 text-[#0072c6] font-medium truncate" style={{ width: columnWidths.name }}>{item.name}</td>
                <td className="py-3 px-3 text-slate-800 truncate" style={{ width: columnWidths.application_name }}>{item.application_name}</td>
                <td className="py-3 px-3 text-slate-800 truncate" style={{ width: columnWidths.segment }}>{item.segment}</td>
                <td className="py-3 px-3 text-slate-800 truncate" style={{ width: columnWidths.segment_cn }}>{item.segment_cn}</td>
                <td className="py-3 px-3 text-slate-800 truncate" style={{ width: columnWidths.created_at }}>{formatDate(item.created_at)}</td>
              </tr>
            ))}</tbody>
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
      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete the selected items?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}
