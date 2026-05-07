import React, { useState, useEffect } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import AlertDialog from './AlertDialog';
import { projectVehicleModelsApi, timelineApi } from '../lib/api';
import type { ProjectVehicleModel, ProjectVehicleModelInput, TimelineEntry } from '../lib/types';
import CustomSelect from './shared/CustomSelect';

export default function ProjectVehicleModelDetail({ id, onSave, onBack }: { id: string | null; onSave: () => void; onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('info');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(!!id);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [form, setForm] = useState<ProjectVehicleModelInput>({ 
        name: '', 
        name_cn: '', 
        oes_full_name: '', 
        internal_code: '', 
        external_code: '', 
        in_out_code: '', 
        brand: '', 
        parent_oem: '', 
        oem_text: '', 
        oem_full_name_parent: '', 
        crm_project_oem: '', 
        body_type: '', 
        energy_type: '', 
        sop: '', 
        eop: '', 
        first_data_source: '', 
        data_source_list: '', 
        matches_prod_sales: 'No', 
        data_mod_status: 'Original', 
        owner: 'Alan White', 
        status: 'Active' 
    });

    useEffect(() => {
        if (id) {
            setLoading(true);
            projectVehicleModelsApi.getById(id).then(data => { if (data) setForm(data); setLoading(false); }).catch(() => setLoading(false));
            timelineApi.listByEntity('vehicle_model', id).then(setTimeline).catch(() => {});
        }
    }, [id]);

    const updateField = (field: keyof ProjectVehicleModelInput, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const handleCommand = async (action: string) => {
        if (action === 'Save' || action === 'Save & Close') {
            try {
                if (id) await projectVehicleModelsApi.update(id, form); else await projectVehicleModelsApi.create(form);
                onSave();
            } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); }
        } else if (action === 'Delete') {
            if (id) setShowConfirmDialog(true); else { setAlertTitle('Info'); setAlertMessage('Record not yet saved.'); setShowAlertDialog(true); }
        }
    };

    const handleDelete = async () => { try { if (id) await projectVehicleModelsApi.delete([id]); setShowConfirmDialog(false); onBack(); } catch (e: any) { setShowConfirmDialog(false); setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <CmdBtn icon="arrow_back" label="Back" onClick={onBack} />
                <CmdBtn icon="save" label="Save" onClick={() => handleCommand('Save')} />
                <CmdBtn icon="add" label="Save & New" onClick={() => handleCommand('Save & New')} />
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <CmdBtn icon="refresh" label="Refresh" onClick={() => { if(id) { setLoading(true); projectVehicleModelsApi.getById(id).then(d => {if(d) setForm(d); setLoading(false);}); } }} />
                <CmdBtn icon="delete" label="Delete" onClick={() => handleCommand('Delete')} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-200 gap-4 mb-6 mt-1">
                    <div className="flex flex-col self-stretch justify-between">
                        <h1 className="text-xl font-normal text-slate-900 mb-5">{form.name || 'New Vehicle Model'}</h1>
                        <div className="flex gap-6 mt-auto">
                            <button className="text-[14px] font-semibold text-[#0072c6] pb-[7px] border-b-2 border-[#0072c6] mb-[-1px]">Model Information</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-8 pb-[8px]">
                        <HdrField label="Brand" value={form.brand || '--'} />
                        <HdrField label="Energy" value={form.energy_type || '--'} />
                        <HdrField label="SOP" value={form.sop || '--'} />
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
                    <TabBtn label="General" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                    <TabBtn label="OEM Details" active={activeTab === 'oem'} onClick={() => setActiveTab('oem')} />
                    <TabBtn label="Timeline" active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} />
                </div>
                <div className="max-w-none">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                            <FmField label="Name *" value={form.name || ''} onChange={v => updateField('name', v)} />
                            <FmField label="Chinese Name" value={form.name_cn || ''} onChange={v => updateField('name_cn', v)} />
                            <FmField label="OES Full Name" value={form.oes_full_name || ''} onChange={v => updateField('oes_full_name', v)} />
                            <FmField label="Internal Code" value={form.internal_code || ''} onChange={v => updateField('internal_code', v)} />
                            <FmField label="External Code" value={form.external_code || ''} onChange={v => updateField('external_code', v)} />
                            <FmField label="In/Out Code" value={form.in_out_code || ''} onChange={v => updateField('in_out_code', v)} />
                            <FmField label="Brand" value={form.brand || ''} onChange={v => updateField('brand', v)} />
                            <FmField label="Body Type" value={form.body_type || ''} isSelect options={['Sedan', 'SUV', 'MPV', 'Hatchback', 'Coupe']} onChange={v => updateField('body_type', v)} />
                            <FmField label="Energy Type" value={form.energy_type || ''} isSelect options={['ICE', 'BEV', 'PHEV', 'HEV', 'FCEV']} onChange={v => updateField('energy_type', v)} />
                            <FmField label="SOP" value={form.sop || ''} onChange={v => updateField('sop', v)} />
                            <FmField label="EOP" value={form.eop || ''} onChange={v => updateField('eop', v)} />
                            <FmField label="Match Prod/Sales" value={form.matches_prod_sales || ''} isSelect options={['Yes', 'No']} onChange={v => updateField('matches_prod_sales', v as any)} />
                            <FmField label="Status" value={form.status || 'Active'} isSelect options={['Active', 'Inactive']} onChange={v => updateField('status', v as any)} />
                        </div>
                    )}
                    {activeTab === 'oem' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                            <FmField label="Parent OEM" value={form.parent_oem || ''} onChange={v => updateField('parent_oem', v)} icon="business" />
                            <FmField label="OEM Text" value={form.oem_text || ''} onChange={v => updateField('oem_text', v)} />
                            <FmField label="OEM Full Name (Parent)" value={form.oem_full_name_parent || ''} onChange={v => updateField('oem_full_name_parent', v)} />
                            <FmField label="CRM Project OEM" value={form.crm_project_oem || ''} onChange={v => updateField('crm_project_oem', v)} />
                        </div>
                    )}
                    {activeTab === 'timeline' && <div className="border border-slate-200 rounded p-12 text-center text-slate-500 text-[13px] bg-white">No timeline entries yet.</div>}
                </div>
            </div>
            <div className="h-6 border-t border-slate-200 flex items-center justify-between px-4 bg-white text-[11px] text-slate-500 shrink-0">
                <span className="text-[#0072c6] font-medium tracking-wide">Status: {form.status || 'Active'}</span>
                <span>Modified: {form.updated_at ? new Date(form.updated_at).toLocaleString() : '--'}</span>
            </div>
            <ConfirmationDialog isOpen={showConfirmDialog} title="Confirm Delete" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
        </div>
    );
}

function CmdBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) { return (<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-[16px] text-slate-500">{icon}</span><span className="hidden sm:inline">{label}</span></button>); }
function HdrField({ label, value }: { label: string; value: string }) { return (<div className="flex flex-col"><span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{label}</span><span className="text-[13px] text-slate-900">{value}</span></div>); }
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return (<button onClick={onClick} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-wider pb-2 relative ${active ? 'text-slate-800 border-b-[3px] border-[#0072c6] mb-[-2px]' : 'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'}`}>{label}</button>); }
function FmField({ label, value, icon, onChange, isSelect, options }: { label: string; value: string; icon?: string; onChange?: (v: string) => void; isSelect?: boolean; options?: string[] }) { return (<div className="flex flex-row items-center group py-1.5"><label className="text-[12px] text-slate-500 w-32 shrink-0">{label.includes('*') ? <>{label.replace(' *','')}<span className="text-red-600"> *</span></> : label}</label><div className="flex-1 relative border-b border-slate-200 group-hover:border-slate-400 focus-within:border-[#0072c6] flex items-center pb-1 transition-colors">{icon && <span className="material-symbols-outlined text-[18px] text-[#0072c6] mr-1">{icon}</span>}{isSelect ? <CustomSelect value={value} onChange={onChange||(()=>{})} options={options||[]} /> : <input type="text" value={value} onChange={e => onChange?.(e.target.value)} className="w-full bg-transparent text-[13px] outline-none text-slate-900" />}</div></div>); }
