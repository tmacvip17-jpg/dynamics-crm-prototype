import React, { useState, useEffect } from 'react';
import AlertDialog from './AlertDialog';
import ConfirmationDialog from './ConfirmationDialog';
import { activitiesApi } from '../lib/api';
import type { Activity } from '../lib/types';
import CustomSelect from './shared/CustomSelect';

export default function ActivityDetail({ id, profile, onSave, onBack }: { id: string | null; profile: any; onSave: () => void; onBack: () => void }) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(!!id);
    const [form, setForm] = useState<Partial<Activity>>({ 
        subject: '', activity_type: 'Task', regarding: '', priority: 'Normal', 
        status: 'Open', due_date: '', description: '', 
        assignee: profile?.full_name || 'System User', 
        owner: profile?.full_name || 'System User' 
    });

    useEffect(() => { if (id) { setLoading(true); activitiesApi.getById(id).then(d => { if (d) setForm(d); setLoading(false); }).catch(() => setLoading(false)); } }, [id]);
    
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const updateField = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleCommand = async (action: string) => {
        if (action === 'Save & Close' || action === 'Save') { 
            try { 
                const payload = { ...form };
                if (!id && (!form.owner || form.owner === 'System User')) {
                    payload.owner = profile?.full_name || 'System User';
                    payload.assignee = profile?.full_name || 'System User';
                }
                if (id) await activitiesApi.update(id, payload); else await activitiesApi.create(payload); onSave(); 
            } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } 
        }
        else if (action === 'Delete') { if (id) setShowConfirmDialog(true); }
        else { setAlertTitle('Action Failed'); setAlertMessage(`"${action}" not implemented yet.`); setShowAlertDialog(true); }
    };
    const handleDelete = async () => { try { if (id) await activitiesApi.delete([id]); setShowConfirmDialog(false); onBack(); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } };
    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <Cb icon="arrow_back" label="Back" onClick={onBack} />
                <Cb icon="save" label="Save" onClick={() => handleCommand('Save')} />
                <Cb icon="save_as" label="Save & Close" onClick={() => handleCommand('Save & Close')} />
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <Cb icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
                    <div className="flex flex-col self-stretch justify-between">
                        <h1 className="text-xl font-normal text-slate-900 mb-5">{form.subject || 'New Activity'}</h1>
                        <div className="flex gap-6 mt-auto">
                            <button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Activity Information</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-8 pb-[8px]">
                        <HdrField label="Priority" value={form.priority || 'Normal'} />
                        <HdrField label="Status" value={form.status || 'Open'} />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Owner</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-[#005a9e] flex items-center justify-center text-[10px] font-bold">{getInitials(form.owner || '')}</div>
                                <span className="text-[13px] text-slate-900">{form.owner}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="max-w-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                    <Ff label="Subject *" value={form.subject||''} onChange={v=>updateField('subject',v)} />
                    <Ff label="Regarding" value={form.regarding||''} onChange={v=>updateField('regarding',v)} icon="computer" />
                    <Ff label="Priority" value={form.priority||'Normal'} isSelect options={['High', 'Normal', 'Low']} onChange={v=>updateField('priority',v)} />
                    <Ff label="Task Status" value={form.status||'Open'} isSelect options={['Open', 'Completed', 'Canceled']} onChange={v=>updateField('status',v)} />
                    <Ff label="Due Date" value={form.due_date||''} onChange={v=>updateField('due_date',v)} type="date" />
                    <Ff label="Assignee" value={form.assignee||''} onChange={v=>updateField('assignee',v)} icon="person" />
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-row items-start group mt-4">
                        <label className="text-[12px] text-slate-500 w-32 shrink-0 mt-2">Description</label>
                        <textarea value={form.description||''} onChange={e=>updateField('description',e.target.value)} className="flex-1 border border-slate-200 group-hover:border-slate-400 rounded p-2 text-[13px] text-slate-900 outline-none focus:border-[#0072c6] transition-colors resize-y min-h-[120px]" />
                    </div>
                </div>
            </div>
            <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0">
                <span className="text-[#0072c6] font-medium tracking-wide">Status: {form.status}</span>
                <span>Page loaded at {new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span>
            </div>
            <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Delete this activity?" onConfirm={handleDelete} onCancel={()=>setShowConfirmDialog(false)} />
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={()=>setShowAlertDialog(false)} />
        </div>
    );
}
function Cb({icon,label,onClick}:{icon:string;label:string;onClick?:()=>void}){return(<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span>{label}</button>);}
function HdrField({ label, value }: { label: string; value: string }) { return (<div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span><span className="text-[13px] text-slate-900">{value}</span></div>); }
function Ff({label,value,icon,onChange,type="text",isSelect,options}:{label:string;value:string;icon?:string;onChange?:(v:string)=>void;type?:string;isSelect?:boolean;options?:string[]}){return(<div className="flex flex-row items-center group py-1.5"><label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*')?<>{label.replace(' *','')}<span className="text-red-600"> *</span></>:label}</label><div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">{icon&&<span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1">{icon}</span>}{isSelect?(<CustomSelect value={value} onChange={onChange||(()=>{})} options={options||[]}/>):(<input type={type} value={value} onChange={e=>onChange?.(e.target.value)} className={`w-full bg-transparent text-[13px] outline-none ${icon?'text-[#0072c6] cursor-pointer hover:underline':'text-slate-900'}`}/>)}</div></div>);}
