import React, { useState, useEffect } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import AlertDialog from './AlertDialog';
import { opportunitiesApi, timelineApi } from '../lib/api';
import type { Opportunity, TimelineEntry } from '../lib/types';

export default function OpportunityDetail({ id, onSave, onBack }: { id: string | null; onSave: () => void; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('info');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(!!id);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [form, setForm] = useState<Partial<Opportunity>>({ topic: '', opportunity_code: '', sales_group: '', application: '', business_unit: '', est_revenue: 0, currency: 'USD' });

    useEffect(() => {
        if (id) {
            setLoading(true);
            opportunitiesApi.getById(id).then(data => { if (data) setForm(data); setLoading(false); }).catch(() => setLoading(false));
            timelineApi.listByEntity('opportunity', id).then(setTimeline).catch(() => {});
        }
    }, [id]);

    const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const handleCommand = async (action: string) => {
        if (action === 'Save') {
            try { if (id) await opportunitiesApi.update(id, form); else await opportunitiesApi.create(form); onSave(); } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); }
        } else if (action === 'Delete') { if (id) setShowConfirmDialog(true); else { setAlertTitle('Info'); setAlertMessage('Record not yet saved.'); setShowAlertDialog(true); }
        } else { setAlertTitle('Action Failed'); setAlertMessage(`Action "${action}" is not fully implemented yet.`); setShowAlertDialog(true); }
    };
    const handleDelete = async () => { try { if (id) await opportunitiesApi.delete([id]); setShowConfirmDialog(false); onBack(); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <CmdBtn icon="arrow_back" label="Back" onClick={onBack} /><CmdBtn icon="save" label="Save" onClick={() => handleCommand('Save')} /><CmdBtn icon="add" label="Save & New" onClick={() => handleCommand('Save & New')} /><div className="w-px h-4 bg-slate-300 mx-2" /><CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand('Refresh')} /><CmdBtn icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
                    <div className="flex flex-col self-stretch justify-between"><h1 className="text-xl font-normal text-slate-900 mb-5">{form.topic || 'New Opportunity'}</h1><div className="flex gap-6 mt-auto"><button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Opportunity</button></div></div>
                    <div className="flex flex-wrap gap-8 pb-[8px]">
                        <HdrField label="Est. Revenue" value={`${form.currency || '$'}${(form.est_revenue || 0).toLocaleString('en-US', {minimumFractionDigits:2})}`} />
                        <HdrField label="Opportunity Finish Time" value={form.opportunity_finish_time || ''} />
                    </div>
                </div>
                <div className="flex px-1 mb-6 gap-8 overflow-x-auto no-scrollbar">
                    <TabBtn label="Opportunity Information" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                    <TabBtn label="Timeline" active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} />
                </div>
                <div className="max-w-4xl">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                            <FmField label="Opportunity Code" value={form.opportunity_code || ''} onChange={v => updateField('opportunity_code', v)} />
                            <FmField label="Topic *" value={form.topic || ''} onChange={v => updateField('topic', v)} />
                            <FmField label="SalesGroup" value={form.sales_group || ''} onChange={v => updateField('sales_group', v)} />
                            <FmField label="application" value={form.application || ''} onChange={v => updateField('application', v)} />
                            <FmField label="BusinessUnit" value={form.business_unit || ''} onChange={v => updateField('business_unit', v)} />
                            <FmField label="OpportunityStartTime" value={form.opportunity_start_time || ''} onChange={v => updateField('opportunity_start_time', v)} type="date" />
                            <FmField label="OpportunityFinishtime" value={form.opportunity_finish_time || ''} onChange={v => updateField('opportunity_finish_time', v)} type="date" />
                            <FmField label="Est. Revenue" value={String(form.est_revenue || 0)} onChange={v => updateField('est_revenue', parseFloat(v) || 0)} type="number" icon="payments" />
                            <FmField label="Currency" value={form.currency || ''} onChange={v => updateField('currency', v)} />
                        </div>
                    )}
                    {activeTab === 'timeline' && (
                        <div className="border border-slate-200 rounded flex flex-col h-[400px]">
                            <div className="bg-slate-50 border-b border-slate-200 p-3">
                                <div className="flex gap-4 mb-3"><button className="text-[13px] font-semibold text-[#0072c6] pb-1 border-b-2 border-[#0072c6]">Posts</button><button className="text-[13px] text-slate-600 pb-1 border-b-2 border-transparent">Activities</button></div>
                                <div className="relative mt-1"><input type="text" placeholder="Enter a note..." className="w-full border border-slate-300 rounded bg-white py-1.5 pl-3 pr-8 text-[13px] outline-none" /><button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0072c6]"><span className="material-symbols-outlined text-[18px]">send</span></button></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-white">{timeline.length === 0 ? <div className="text-[13px] text-slate-500 text-center mt-8">No timeline entries yet.</div> : timeline.map(t => <TlItem key={t.id} icon={t.icon} title={t.title} time={new Date(t.created_at).toLocaleDateString()} desc={t.description || ''} tags={t.tags || undefined} />)}</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0"><span className="text-[#0072c6] font-medium tracking-wide">ID: {id || 'New'}</span><span></span></div>
            <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Delete this opportunity?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
        </div>
    );
}

function LookupField({ label, value, options, onSelect, icon }: { label: string; value: string; options: string[]; onSelect: (v: string) => void; icon: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-row items-center group py-1.5 relative" ref={containerRef}>
            <label className="text-[12px] text-slate-500 w-32 shrink-0">{label}</label>
            <div className="flex-1 relative">
                <div 
                    className={`relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors cursor-text`}
                    onClick={() => setIsOpen(true)}
                >
                    {icon && <span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1.5">{icon}</span>}
                    <input 
                        type="text" 
                        value={isOpen ? search : value}
                        placeholder={isOpen ? "Search..." : ""}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        className={`w-full bg-transparent text-[13px] outline-none ${!isOpen && value ? 'text-[#0072c6] font-medium hover:underline cursor-pointer' : 'text-slate-900'}`}
                    />
                    <span className="material-symbols-outlined text-[18px] text-slate-400 ml-1">search</span>
                </div>
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl z-50 rounded py-1 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-[13px] text-slate-400 italic">No records found</div>
                        ) : (
                            filtered.map(opt => (
                                <div 
                                    key={opt}
                                    onClick={() => { onSelect(opt); setIsOpen(false); setSearch(''); }}
                                    className="px-3 py-2 hover:bg-slate-50 text-[13px] text-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-[#0072c6]">{icon}</span>
                                    {opt}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function CmdBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) { return (<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span><span className="hidden sm:inline">{label}</span></button>); }
function HdrField({ label, value }: { label: string; value: string }) { return (<div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span><span className="text-[13px] text-slate-900">{value}</span></div>); }
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return (<button onClick={onClick} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-wider pb-2 relative ${active ? 'text-slate-800 border-b-[3px] border-[#0072c6] mb-[-2px]' : 'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'}`}>{label}</button>); }
function FmField({ label, value, icon, onChange, type = "text" }: { label: string; value: string; icon?: string; onChange?: (v: string) => void; type?: string }) { return (<div className="flex flex-row items-center group py-1.5"><label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*') ? <>{label.replace(' *','')}<span className="text-red-600"> *</span></> : label}</label><div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">{icon && <span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1">{icon}</span>}<input type={type} value={value} onChange={e => onChange?.(e.target.value)} className="w-full bg-transparent text-[13px] outline-none text-slate-900" /></div></div>); }
function TlItem({ icon, title, time, desc, tags }: { key?: React.Key; icon: string; title: string; time: string; desc: string; tags?: string[] }) { return (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span></div><div className="flex-1 border border-slate-200 rounded p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white"><div className="flex justify-between items-start mb-1"><div className="text-[13px] font-semibold text-slate-900">{title}</div><div className="text-[11px] text-slate-500">{time}</div></div><p className="text-[13px] text-slate-600 leading-relaxed mb-2 line-clamp-2">{desc}</p>{tags && <div className="flex gap-2">{tags.map(t => <span key={t} className={`px-2 py-0.5 text-[11px] font-medium rounded ${t === 'Completed' ? 'bg-green-100/50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{t}</span>)}</div>}</div></div>); }
