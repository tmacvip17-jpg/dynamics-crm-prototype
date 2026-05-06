import React, { useState, useEffect } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import AlertDialog from "./AlertDialog";
import { opportunitiesApi } from "../lib/api";
import type { Opportunity } from "../lib/types";
import * as XLSX from "xlsx";
import CmdBtn from "./shared/CmdBtn";
import AdvancedSearchDialog from "./shared/AdvancedSearchDialog";
import PrintPreviewDialog from "./shared/PrintPreviewDialog";

export default function OpportunityList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Information");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'topic', direction: 'asc' });
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>(["Opportunity Code", "Topic", "SalesGroup", "application", "BusinessUnit", "OpportunityStartTime", "OpportunityFinishtime", "EstRevenue", "Currency"]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const AVAILABLE_FIELDS = ["Opportunity Code", "Topic", "SalesGroup", "application", "BusinessUnit", "OpportunityStartTime", "OpportunityFinishtime", "EstRevenue", "Currency"];

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<any[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');

  const fetchData = async () => { try { setLoading(true); setOpportunities(await opportunitiesApi.list()); } catch (e: any) { setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCommand = (action: string) => {
    if (action === "New") onNew();
    else if (action === "Delete") { if (selectedIds.length === 0) { setAlertTitle("Warning"); setAlertMessage("Please select at least one item to delete."); setShowAlertDialog(true); } else setShowConfirmDialog(true); }
    else if (action === "Refresh") fetchData();
    else if (action === "Import from Excel") setShowImportModal(true);
    else if (action === "Export to Excel") setShowExportModal(true);
    else if (action === "Download Template") downloadTemplate();
    else if (action === "Print") { if (selectedIds.length === 0) { setAlertTitle("Print"); setAlertMessage("Please select at least one opportunity to print."); setShowAlertDialog(true); } else setShowPrintPreview(true); }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = (a as any)[key] || '';
    const valB = (b as any)[key] || '';
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filteredOpportunities = sortedOpportunities.filter(opp => {
    // Keyword Search
    const matchesSearch = !searchTerm || 
      opp.topic?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      opp.opportunity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.sales_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.application?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.business_unit?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Advanced Filters
    if (filters.length === 0) return true;
    
    const checkRow = (f: any) => {
      const val = ((opp as any)[f.field] || "").toString().toLowerCase();
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

  const totalPages = Math.ceil(filteredOpportunities.length / pageSize);
  const paginatedOpportunities = filteredOpportunities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async () => { try { await opportunitiesApi.delete(selectedIds); setOpportunities(opportunities.filter(i => !selectedIds.includes(i.id))); setSelectedIds([]); setShowConfirmDialog(false); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle("Error"); setAlertMessage(e.message); setShowAlertDialog(true); } };
  const allChecked = paginatedOpportunities.length > 0 && paginatedOpportunities.every(opp => selectedIds.includes(opp.id));
  const formatCurrency = (v: number | null | undefined) => `$${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string | null) => { if (!d) return ''; const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}/${dt.getFullYear()}`; };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); };
  const handleImport = async (file: File) => {
    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const newOpps = jsonData.map(row => ({
        opportunity_code: row["Opportunity Code"] || row.opportunity_code || '',
        topic: row.Topic || row.topic || 'Imported Opportunity',
        sales_group: row.SalesGroup || row.sales_group || '',
        application: row.application || '',
        business_unit: row.BusinessUnit || row.business_unit || '',
        opportunity_start_time: row.OpportunityStartTime || row.opportunity_start_time || null,
        opportunity_finish_time: row.OpportunityFinishtime || row.opportunity_finish_time || null,
        est_revenue: parseFloat(row.EstRevenue || row.est_revenue) || null,
        currency: row.Currency || row.currency || ''
      }));

      if (newOpps.length > 0) {
        setImportProgress({ current: 0, total: newOpps.length });
        const chunkSize = 20; 
        for (let i = 0; i < newOpps.length; i += chunkSize) {
          const chunk = newOpps.slice(i, i + chunkSize);
          await opportunitiesApi.createMany(chunk);
          setImportProgress({ current: Math.min(i + chunkSize, newOpps.length), total: newOpps.length });
        }
        setShowImportModal(false);
        setSelectedFile(null);
        setAlertTitle("Success");
        setAlertMessage(`Successfully imported ${newOpps.length} opportunities.`);
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

  const handleExport = () => {
    const dataToExport = filteredOpportunities.map(opp => {
      const row: any = {};
      if (selectedFields.includes("Opportunity Code")) row["Opportunity Code"] = opp.opportunity_code;
      if (selectedFields.includes("Topic")) row.Topic = opp.topic;
      if (selectedFields.includes("SalesGroup")) row.SalesGroup = opp.sales_group;
      if (selectedFields.includes("application")) row.application = opp.application;
      if (selectedFields.includes("BusinessUnit")) row.BusinessUnit = opp.business_unit;
      if (selectedFields.includes("OpportunityStartTime")) row.OpportunityStartTime = opp.opportunity_start_time;
      if (selectedFields.includes("OpportunityFinishtime")) row.OpportunityFinishtime = opp.opportunity_finish_time;
      if (selectedFields.includes("EstRevenue")) row.EstRevenue = opp.est_revenue;
      if (selectedFields.includes("Currency")) row.Currency = opp.currency;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Opportunities");
    XLSX.writeFile(workbook, "Opportunities_Export.xlsx");
    setShowExportModal(false);
  };

  const downloadTemplate = () => {
    const templateData = [{ "Opportunity Code": "OPP-001", "Topic": "Sample Deal", "SalesGroup": "Group A", "application": "App 1", "BusinessUnit": "BU 1", "OpportunityStartTime": "2024-01-01", "OpportunityFinishtime": "2024-12-31", "EstRevenue": 50000, "Currency": "USD" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Opportunity_Import_Template.xlsx");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={onFileChange} />
      <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
        <CmdBtn icon="add" label="New" onClick={() => handleCommand("New")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand("Delete")} /><CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand("Refresh")} />
        <CmdBtn icon="mail" label="Email a link" onClick={() => handleCommand("Email a link")} /><div className="w-px h-4 bg-slate-300 mx-2" />
        <CmdBtn icon="download" label="Download Template" onClick={() => handleCommand("Download Template")} />
        <CmdBtn icon="upload" label="Import from Excel" onClick={() => handleCommand("Import from Excel")} /><CmdBtn icon="download" label="Export to Excel" onClick={() => handleCommand("Export to Excel")} />
        <CmdBtn icon="print" label="Print" onClick={() => handleCommand("Print")} />
        <CmdBtn icon="star" label="Show Chart" onClick={() => handleCommand("Show Chart")} />
      </div>

      <PrintPreviewDialog 
        isOpen={showPrintPreview} 
        onClose={() => setShowPrintPreview(false)} 
        selectedItems={opportunities.filter(o => selectedIds.includes(o.id))} 
        titleField="topic"
        entityName="Opportunities"
        headerHighlightField="opportunity_code"
        fields={[
          { id: 'opportunity_code', label: 'Opportunity Code' },
          { id: 'topic', label: 'Topic' },
          { id: 'sales_group', label: 'SalesGroup' },
          { id: 'application', label: 'application' },
          { id: 'business_unit', label: 'BusinessUnit' },
          { id: 'opportunity_start_time', label: 'OpportunityStartTime' },
          { id: 'opportunity_finish_time', label: 'OpportunityFinishtime' },
          { id: 'est_revenue', label: 'EstRevenue' },
          { id: 'currency', label: 'Currency' }
        ]}
      />

      <AdvancedSearchDialog
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApply={setFilters}
        currentFilters={filters}
        logic={filterLogic}
        onLogicChange={setFilterLogic}
        entityName="Opportunities"
        fields={[
          { id: 'opportunity_code', label: 'Opportunity Code' },
          { id: 'topic', label: 'Topic' },
          { id: 'sales_group', label: 'SalesGroup' },
          { id: 'application', label: 'application' },
          { id: 'business_unit', label: 'BusinessUnit' },
          { id: 'est_revenue', label: 'EstRevenue' },
          { id: 'currency', label: 'Currency' }
        ]}
      />

      <div className="px-6 py-4 flex items-center justify-between border-b border-white z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex items-center gap-2"><h1 className="text-[20px] font-normal text-slate-900">My Open Opportunities</h1><span className="material-symbols-outlined text-slate-500 text-[18px] cursor-pointer">expand_more</span></div>
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
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 w-full"><tr>
              <th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(prev => allChecked ? prev.filter(id => !paginatedOpportunities.some(o => o.id === id)) : [...prev, ...paginatedOpportunities.map(o => o.id).filter(id => !prev.includes(id))])}><span className={`material-symbols-outlined text-[18px] ${allChecked ? "text-[#0072c6]" : "text-slate-400"}`}>{allChecked ? "check_box" : "check_box_outline_blank"}</span></th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('opportunity_code')}>
                <div className="flex items-center gap-1">Opportunity Code {sortConfig?.key === 'opportunity_code' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('topic')}>
                <div className="flex items-center gap-1">Topic {sortConfig?.key === 'topic' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('sales_group')}>
                <div className="flex items-center gap-1">SalesGroup {sortConfig?.key === 'sales_group' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('application')}>
                <div className="flex items-center gap-1">application {sortConfig?.key === 'application' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('business_unit')}>
                <div className="flex items-center gap-1">BusinessUnit {sortConfig?.key === 'business_unit' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('opportunity_start_time')}>
                <div className="flex items-center gap-1">OpportunityStartTime {sortConfig?.key === 'opportunity_start_time' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('opportunity_finish_time')}>
                <div className="flex items-center gap-1">OpportunityFinishtime {sortConfig?.key === 'opportunity_finish_time' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('est_revenue')}>
                <div className="flex items-center gap-1">EstRevenue {sortConfig?.key === 'est_revenue' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-600 uppercase tracking-widest text-[11px] cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleSort('currency')}>
                <div className="flex items-center gap-1">Currency {sortConfig?.key === 'currency' && <span className="material-symbols-outlined text-[14px] text-[#0072c6]">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
              </th>
            </tr></thead>
            <tbody>{paginatedOpportunities.map((opp, i) => (
              <tr key={opp.id} onClick={() => onSelect(opp.id)} className={`border-b border-slate-100 cursor-pointer ${selectedIds.includes(opp.id) ? "bg-blue-50/50 hover:bg-blue-50" : `hover:bg-slate-50 ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`} group`}>
                <td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(p => p.includes(opp.id) ? p.filter(id => id !== opp.id) : [...p, opp.id]); }}><span className={`material-symbols-outlined text-[18px] cursor-pointer ${selectedIds.includes(opp.id) ? "text-[#0072c6]" : "text-slate-300 group-hover:text-slate-400"}`}>{selectedIds.includes(opp.id) ? "check_box" : "check_box_outline_blank"}</span></td>
                <td className="py-3 px-3 text-[#0072c6] font-medium">{opp.opportunity_code}</td>
                <td className="py-3 px-3 text-slate-800">{opp.topic}</td>
                <td className="py-3 px-3 text-slate-800">{opp.sales_group}</td>
                <td className="py-3 px-3 text-slate-800">{opp.application}</td>
                <td className="py-3 px-3 text-slate-800">{opp.business_unit}</td>
                <td className="py-3 px-3 text-slate-800">{formatDate(opp.opportunity_start_time)}</td>
                <td className="py-3 px-3 text-slate-800">{formatDate(opp.opportunity_finish_time)}</td>
                <td className="py-3 px-3 text-slate-800 font-medium">{formatCurrency(opp.est_revenue)}</td>
                <td className="py-3 px-3 text-slate-800">{opp.currency}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-[12px] text-slate-500 bg-white shrink-0 mt-auto">
        <div>{filteredOpportunities.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredOpportunities.length)} of {filteredOpportunities.length} (Filtered)</div>
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
              <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0072c6]">upload_file</span>
                Import Opportunities
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
                    {selectedFile && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-[12px] text-red-600 hover:text-red-700 font-medium mt-1 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span> Remove
                      </button>
                    )}
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
                  <div className="flex items-center justify-center gap-2 text-slate-400 italic">
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span className="text-[12px]">Integrating data with CRM...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b border-t border-slate-100">
              {!importProgress && (
                <>
                  <button 
                    onClick={() => { setShowImportModal(false); setSelectedFile(null); }} 
                    className="px-5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
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

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-[450px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0072c6]">settings_suggest</span>
                Export Configuration
              </h2>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="px-8 py-6">
              <p className="text-[13px] text-slate-600 mb-4">Select the fields you want to include in the Excel export:</p>
              
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">Field Name</span>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedFields(AVAILABLE_FIELDS)} className="text-[12px] text-[#0072c6] hover:underline">Select All</button>
                  <button onClick={() => setSelectedFields([])} className="text-[12px] text-slate-500 hover:underline">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {AVAILABLE_FIELDS.map(field => (
                  <label key={field} className="flex items-center gap-3 p-2.5 rounded hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedFields.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedFields(prev => [...prev, field]);
                          else setSelectedFields(prev => prev.filter(f => f !== field));
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:border-[#0072c6] checked:bg-[#0072c6] transition-all"
                      />
                      <span className="material-symbols-outlined absolute text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                    </div>
                    <span className={`text-[14px] transition-colors ${selectedFields.includes(field) ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex justify-between items-center rounded-b border-t border-slate-100">
              <span className="text-[12px] text-slate-500">{selectedFields.length} of {AVAILABLE_FIELDS.length} fields selected</span>
              <div className="flex gap-3">
                <button onClick={() => setShowExportModal(false)} className="px-5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded transition-colors">Cancel</button>
                <button onClick={handleExport} disabled={selectedFields.length === 0} className={`px-6 py-2 text-[13px] font-medium text-white rounded transition-all shadow-sm ${selectedFields.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#0072c6] hover:bg-[#005a9e] active:scale-95'}`}>Export Excel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete the selected items?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
      <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
    </div>
  );
}
