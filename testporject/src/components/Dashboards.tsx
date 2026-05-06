import React, { useState, useEffect } from 'react';
import AlertDialog from './AlertDialog';
import { dashboardApi } from '../lib/api';
import type { DashboardData } from '../lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0072c6', '#ef4444', '#f59e0b', '#10b981'];

export default function Dashboards({ onNavigate }: { onNavigate?: (view: string) => void }) {
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({ pipelineData: [], revenueData: [], winLossData: [], totalAccounts: 0, totalContacts: 0, totalOpportunities: 0, totalLeads: 0 });

    const fetchData = async () => { try { setLoading(true); setData(await dashboardApi.getData()); } catch (e: any) { setAlertTitle('Error'); setAlertMessage(e.message); setShowAlertDialog(true); } finally { setLoading(false); } };
    useEffect(() => { fetchData(); }, []);

    return (
        <div className="flex flex-col h-full bg-[#f3f2f1]">
            <div className="h-11 border-b border-slate-200 flex items-center px-4 gap-1 shrink-0 bg-white">
                <CmdBtn icon="refresh" label="Refresh" onClick={fetchData} />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6">
                <div className="flex justify-between items-end mb-4">
                    <h1 className="text-xl font-normal text-slate-900">Sales Dashboard</h1>
                    <select className="border border-slate-300 rounded py-1 px-2 text-[13px] bg-white"><option>Current Quarter</option><option>Last Quarter</option><option>This Year</option></select>
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Accounts" value={loading ? '...' : String(data.totalAccounts)} icon="business" color="#0072c6" onClick={() => onNavigate?.('accounts')} />
                    <KpiCard label="Total Contacts" value={loading ? '...' : String(data.totalContacts)} icon="people" color="#10b981" onClick={() => onNavigate?.('contacts')} />
                    <KpiCard label="Open Opportunities" value={loading ? '...' : String(data.totalOpportunities)} icon="trending_up" color="#f59e0b" onClick={() => onNavigate?.('opportunities')} />
                    <KpiCard label="Active Leads" value={loading ? '...' : String(data.totalLeads)} icon="person_search" color="#ef4444" onClick={() => onNavigate?.('leads')} />
                </div>
                {loading ? <div className="flex items-center justify-center h-32 text-slate-500 text-[13px]">Loading dashboard data...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-4 h-80 flex flex-col">
                        <h2 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">Sales Pipeline</h2>
                        <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.pipelineData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} /><XAxis type="number" tickFormatter={(v) => `$${v/1000}k`} /><YAxis dataKey="name" type="category" width={80} /><RechartsTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Bar dataKey="amount" fill="#0072c6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-4 h-80 flex flex-col">
                        <h2 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">Revenue Trend</h2>
                        <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `$${v}`} /><RechartsTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-4 h-80 flex flex-col">
                        <h2 className="text-[13px] font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">Win/Loss Ratio</h2>
                        <div className="flex-1 flex justify-center items-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">{data.winLossData.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}</Pie><RechartsTooltip /><Legend verticalAlign="bottom" height={36} /></PieChart></ResponsiveContainer></div>
                    </div>
                </div>
                )}
            </div>
            <AlertDialog isOpen={showAlertDialog} title={alertTitle} message={alertMessage} onClose={() => setShowAlertDialog(false)} />
        </div>
    );
}

function CmdBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
    return (<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 rounded transition-colors outline-none shrink-0 group"><span className="material-symbols-outlined text-[16px] text-slate-500 group-hover:text-[#0072c6] transition-colors">{icon}</span><span className="hidden sm:inline whitespace-nowrap">{label}</span></button>);
}

function KpiCard({ label, value, icon, color, onClick }: { label: string; value: string; icon: string; color: string, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded border border-slate-200 shadow-sm p-4 flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 group active:scale-[0.98]' : ''}`}
        >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${color}15` }}>
                <span className="material-symbols-outlined text-[24px]" style={{ color }}>{icon}</span>
            </div>
            <div>
                <div className="text-[22px] font-semibold text-slate-900 group-hover:text-[#0072c6] transition-colors">{value}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}
