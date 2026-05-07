import React, { useState, useEffect } from 'react';
import AlertDialog from './AlertDialog';
import ConfirmationDialog from './ConfirmationDialog';
import { leadsApi, timelineApi } from '../lib/api';
import type { Lead, TimelineEntry } from '../lib/types';
import CustomSelect from './shared/CustomSelect';

export default function LeadDetail({ id, profile, onSave, onBack }: { id: string | null; profile: any; onSave: () => void; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('info');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(!!id);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [form, setForm] = useState<Partial<Lead>>({ 
        first_name: '', last_name: '', topic: '', status: 'New', 
        source: 'Web', rating: 'Warm', job_title: '', phone: '', 
        email: '', company_name: '', website: '', 
        owner: profile?.full_name || 'System User', stage_index: 0 
    });

    useEffect(() => { if (id) { setLoading(true); leadsApi.getById(id).then(d => { if (d) setForm(d); setLoading(false); }).catch(() => setLoading(false)); timelineApi.listByEntity('lead', id).then(setTimeline).catch(() => {}); } }, [id]);
    
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const updateField = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const stages = ['Qualify', 'Develop', 'Propose', 'Close'];

    const handleCommand = async (action: string) => {
        if (action === 'Save') { 
            try { 
                const payload = { ...form };
                if (!id && (!form.owner || form.owner === 'System User')) {
                    payload.owner = profile?.full_name || 'System User';
                }
                if (id) await leadsApi.update(id, payload); else await leadsApi.create(payload); onSave(); 
            } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } 
        }
        else if (action === 'Delete') { if (id) setShowConfirmDialog(true); }
        else { setAlertTitle('Action Failed'); setAlertMessage(`"${action}" not implemented yet.`); setShowAlertDialog(true); }
    };
    const handleDelete = async () => { try { if (id) await leadsApi.delete([id]); setShowConfirmDialog(false); onBack(); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } };
    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <Cb icon="arrow_back" label="Back" onClick={onBack} /><Cb icon="save" label="Save" onClick={() => handleCommand('Save')} /><Cb icon="add" label="Save & New" onClick={() => handleCommand('Save & New')} /><div className="w-px h-4 bg-slate-300 mx-2" /><Cb icon="star" label="Qualify" onClick={() => handleCommand('Qualify')} /><Cb icon="star" label="Disqualify" onClick={() => handleCommand('Disqualify')} /><div className="w-px h-4 bg-slate-300 mx-2" /><Cb icon="refresh" label="Refresh" onClick={() => handleCommand('Refresh')} /><Cb icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
                    <div className="flex flex-col self-stretch justify-between"><h1 className="text-xl font-normal text-slate-900 mb-5">{form.first_name} {form.last_name} - {form.topic || 'New Lead'}</h1><div className="flex gap-6 mt-auto"><button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Lead</button></div></div>
                    <div className="flex flex-wrap gap-8 pb-[8px]"><Hf label="Lead Source" value={form.source || ''} /><Hf label="Rating" value={form.rating || ''} /><div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Owner</span><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-blue-100 text-[#005a9e] flex items-center justify-center text-[10px] font-bold">{getInitials(form.owner || '')}</div><span className="text-[13px] text-slate-900">{form.owner}</span></div></div></div>
                </div>
                <div className="flex h-10 w-full mb-8 border border-slate-300 rounded overflow-hidden text-[13px] select-none bg-white">
                    {stages.map((stage, i) => { const isActive = (form.stage_index ?? 0) === i; return (<div key={stage} onClick={() => { updateField('stage_index', i); }} className={`bpf-stage flex-1 flex items-center ${i === 0 ? 'pl-6 pr-6' : 'pl-10 pr-6'} ${isActive ? 'bg-[#00599d] text-white font-bold' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'} relative transition-colors`} style={{ zIndex: stages.length - i }}><div className="flex items-center gap-2"><div className={`w-[16px] h-[16px] rounded-full flex items-center justify-center ${isActive ? 'border-2 border-white' : 'border border-slate-400'}`}>{isActive && <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>}</div><span>{stage}</span></div></div>); })}
                </div>
                <div className="flex px-1 mb-6 gap-8 overflow-x-auto no-scrollbar"><Tb label="Contact Information" active={activeTab === 'info'} onClick={() => setActiveTab('info')} /><Tb label="Timeline" active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} /></div>
                <div className="max-w-none">
                    {activeTab === 'info' && (
                        <div className="flex flex-col">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                <Ff label="Topic *" value={form.topic||''} onChange={v=>updateField('topic',v)} />
                                <Ff label="First Name" value={form.first_name||''} onChange={v=>updateField('first_name',v)} />
                                <Ff label="Last Name *" value={form.last_name||''} onChange={v=>updateField('last_name',v)} />
                                <Ff label="Job Title" value={form.job_title||''} onChange={v=>updateField('job_title',v)} />
                                <Ff label="Business Phone" value={form.phone||''} onChange={v=>updateField('phone',v)} icon="call" />
                                <Ff label="Email" value={form.email||''} onChange={v=>updateField('email',v)} icon="mail" />
                                <Ff label="Status" value={form.status||'New'} isSelect options={['New', 'Contacted', 'Qualified', 'Lost']} onChange={v=>updateField('status',v)} />
                                <Ff label="Source" value={form.source||'Web'} isSelect options={['Web', 'Trade Show', 'Referral', 'Advertisement', 'Other']} onChange={v=>updateField('source',v)} />
                                <Ff label="Rating" value={form.rating||'Warm'} isSelect options={['Hot', 'Warm', 'Cold']} onChange={v=>updateField('rating',v)} />
                            </div>
                            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mt-8 mb-4">Company</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                <Ff label="Company Name" value={form.company_name||''} onChange={v=>updateField('company_name',v)} />
                                <Ff label="Website" value={form.website||''} onChange={v=>updateField('website',v)} icon="language" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'timeline' && (<div className="border border-slate-200 rounded flex flex-col h-[400px]"><div className="bg-slate-50 border-b border-slate-200 p-3"><div className="flex gap-4 mb-3"><button className="text-[13px] font-semibold text-[#0072c6] pb-1 border-b-2 border-[#0072c6]">Posts</button></div><div className="relative mt-1"><input type="text" placeholder="Enter a note..." className="w-full border border-slate-300 rounded bg-white py-1.5 pl-3 pr-8 text-[13px] outline-none" /><button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0072c6]"><span className="material-symbols-outlined text-[18px]">send</span></button></div></div><div className="flex-1 overflow-y-auto p-3 space-y-4 bg-white">{timeline.length === 0 ? <div className="text-[13px] text-slate-500 text-center mt-8">No entries yet.</div> : timeline.map(t=><Tl key={t.id} icon={t.icon} title={t.title} time={new Date(t.created_at).toLocaleDateString()} desc={t.description||''} tags={t.tags||undefined} />)}</div></div>)}
                </div>
            </div>
            <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0"><span className="text-[#0072c6] font-medium tracking-wide">Status: {form.status}</span><span>ID: {id||'New'}</span></div>
            <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Delete this lead?" onConfirm={handleDelete} onCancel={()=>setShowConfirmDialog(false)} />
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={()=>setShowAlertDialog(false)} />
        </div>
    );
}
function Cb({icon,label,onClick}:{icon:string;label:string;onClick?:()=>void}){return(<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span><span className="hidden sm:inline">{label}</span></button>);}
function Hf({label,value}:{label:string;value:string}){return(<div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span><span className="text-[13px] text-slate-900">{value}</span></div>);}
function Tb({label,active,onClick}:{label:string;active:boolean;onClick:void}){return(<button onClick={onClick} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-wider pb-2 relative ${active?'text-slate-800 border-b-[3px] border-[#0072c6] mb-[-2px]':'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'}`}>{label}</button>);}
function Ff({label,value,icon,onChange,isSelect,options}:{label:string;value:string;icon?:string;onChange?:(v:string)=>void;isSelect?:boolean;options?:string[]}){return(<div className="flex flex-row items-center group py-1.5"><label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*')?<>{label.replace(' *','')}<span className="text-red-600"> *</span></>:label}</label><div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">{icon&&<span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1">{icon}</span>}{isSelect?(<CustomSelect value={value} onChange={onChange||(()=>{})} options={options||[]}/>):(<input type="text" value={value} onChange={e=>onChange?.(e.target.value)} className="w-full bg-transparent text-[13px] outline-none text-slate-900"/>)}</div></div>);}
function Tl({icon,title,time,desc,tags}:{key?:React.Key;icon:string;title:string;time:string;desc:string;tags?:string[]}){return(<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span></div><div className="flex-1 border border-slate-200 rounded p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white"><div className="flex justify-between items-start mb-1"><div className="text-[13px] font-semibold text-slate-900">{title}</div><div className="text-[11px] text-slate-500">{time}</div></div><p className="text-[13px] text-slate-600 leading-relaxed mb-2 line-clamp-2">{desc}</p>{tags&&<div className="flex gap-2">{tags.map(t=><span key={t} className={`px-2 py-0.5 text-[11px] font-medium rounded ${t==='Completed'?'bg-green-100/50 text-green-700':'bg-slate-100 text-slate-700'}`}>{t}</span>)}</div>}</div></div>);}
