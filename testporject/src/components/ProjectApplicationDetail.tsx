import React, { useState, useEffect } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import AlertDialog from './AlertDialog';
import { projectApplicationsApi, timelineApi } from '../lib/api';
import type { ProjectApplication, ProjectApplicationInput, TimelineEntry } from '../lib/types';

export default function ProjectApplicationDetail({ id, onSave, onBack }: { id: string | null; onSave: () => void; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('info');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(!!id);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [form, setForm] = useState<ProjectApplicationInput>({ 
        name: '', 
        application_name: '', 
        segment: '', 
        segment_cn: '', 
        owner: 'Alan White', 
        status: 'Active' 
    });

    useEffect(() => {
        if (id) {
            setLoading(true);
            projectApplicationsApi.getById(id).then(data => { if (data) setForm(data); setLoading(false); }).catch(() => setLoading(false));
            timelineApi.listByEntity('project_application', id).then(setTimeline).catch(() => {});
        }
    }, [id]);

    const updateField = (field: keyof ProjectApplicationInput, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const handleCommand = async (action: string) => {
        if (action === 'Save' || action === 'Save & Close') {
            try {
                if (id) await projectApplicationsApi.update(id, form); else await projectApplicationsApi.create(form);
                onSave();
            } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); }
        } else if (action === 'Delete') {
            if (id) { setShowConfirmDialog(true); } else { setAlertTitle('Info'); setAlertMessage('Record not yet saved.'); setShowAlertDialog(true); }
        } else { setAlertTitle('Action Failed'); setAlertMessage(`Action "${action}" is not fully implemented yet.`); setShowAlertDialog(true); }
    };

    const handleDelete = async () => { try { if (id) await projectApplicationsApi.delete([id]); setShowConfirmDialog(false); onBack(); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <CmdBtn icon="arrow_back" label="Back" onClick={onBack} />
                <CmdBtn icon="save" label="Save" onClick={() => handleCommand('Save')} />
                <CmdBtn icon="add" label="Save & New" onClick={() => handleCommand('Save & New')} />
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <CmdBtn icon="refresh" label="Refresh" onClick={() => handleCommand('Refresh')} />
                <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
                    <div className="flex flex-col self-stretch justify-between">
                        <h1 className="text-xl font-normal text-slate-900 mb-5">{form.name || 'New Project Application'}</h1>
                        <div className="flex gap-6 mt-auto">
                            <button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Project Application</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-8 pb-[8px]">
                        <HdrField label="Segment" value={form.segment || '--'} />
                        <HdrField label="Segment CN" value={form.segment_cn || '--'} />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Owner</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-[#005a9e] flex items-center justify-center text-[10px] font-bold">AW</div>
                                <span className="text-[13px] text-slate-900">{form.owner}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex px-1 mb-6 gap-8 overflow-x-auto no-scrollbar">
                    <TabBtn label="Summary" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                    <TabBtn label="Timeline" active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} />
                </div>
                <div className="max-w-4xl">
                    {activeTab === 'info' && (
                        <div className="flex flex-col">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                <FmField label="Name *" value={form.name || ''} onChange={v => updateField('name', v)} />
                                <FmField label="Application Name" value={form.application_name || ''} onChange={v => updateField('application_name', v)} />
                                <FmField label="Segment" value={form.segment || ''} onChange={v => updateField('segment', v)} />
                                <FmField label="Segment CN" value={form.segment_cn || ''} onChange={v => updateField('segment_cn', v)} />
                                <FmField label="Owner" value={form.owner || ''} onChange={v => updateField('owner', v)} icon="person" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'timeline' && (
                        <div className="border border-slate-200 rounded flex flex-col h-[400px]">
                            <div className="bg-slate-50 border-b border-slate-200 p-3">
                                <div className="flex gap-4 mb-3">
                                    <button className="text-[13px] font-semibold text-[#0072c6] pb-1 border-b-2 border-[#0072c6]">Posts</button>
                                    <button className="text-[13px] text-slate-600 hover:text-slate-900 pb-1 border-b-2 border-transparent transition-colors">Activities</button>
                                </div>
                                <div className="relative mt-1">
                                    <input type="text" placeholder="Enter a note..." className="w-full border border-slate-300 rounded bg-white py-1.5 pl-3 pr-8 text-[13px] outline-none hover:border-slate-400 focus:border-[#0072c6] transition-colors shadow-sm" />
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0072c6]"><span className="material-symbols-outlined text-[18px]">send</span></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-white text-center text-slate-500 text-[13px] pt-12">
                                No timeline entries yet for this application.
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0">
                <span className="text-[#0072c6] font-medium tracking-wide">Status: {form.status || 'Active'}</span>
                <span>ID: {id || 'New'}</span>
            </div>
            <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure you want to delete this record?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
        </div>
    );
}

function CmdBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) { return (<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span><span className="hidden sm:inline">{label}</span></button>); }
function HdrField({ label, value }: { label: string; value: string }) { return (<div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span><span className="text-[13px] text-slate-900">{value}</span></div>); }
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return (<button onClick={onClick} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-wider pb-2 relative ${active ? 'text-slate-800 border-b-[3px] border-[#0072c6] mb-[-2px]' : 'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'}`}>{label}</button>); }
function FmField({ label, value, icon, onChange }: { label: string; value: string; icon?: string; onChange?: (v: string) => void }) { return (<div className="flex flex-row items-center group py-1.5"><label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*') ? <>{label.replace(' *','')}<span className="text-red-600"> *</span></> : label}</label><div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">{icon && <span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1">{icon}</span>}<input type="text" value={value} onChange={e => onChange?.(e.target.value)} className="w-full bg-transparent text-[13px] outline-none text-slate-900" /></div></div>); }
