import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, ArrowRight, Download, TrendingUp, Clock, DollarSign, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#6366f1'];
const TABS = [
    { key: 'production', label: 'Production', icon: TrendingUp },
    { key: 'downtime', label: 'Downtime', icon: Clock },
    { key: 'financial', label: 'Financial', icon: DollarSign },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
];

export default function Analytics() {
    const [tab, setTab] = useState('production');
    const [entries, setEntries] = useState([]);
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        rigId: '',
        projectId: '',
    });

    useEffect(() => {
        Promise.all([
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([r, p]) => { setRigs(r.data); setProjects(p.data); });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.rigId) params.append('rigId', filters.rigId);
            if (filters.projectId) params.append('projectId', filters.projectId);
            params.append('limit', '500');
            const res = await axios.get(`/api/drilling?${params}`, { withCredentials: true });
            setEntries(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filters]);

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    // Data aggregations
    const totalMeters = entries.reduce((s, e) => s + e.metersDrilled, 0);
    const totalNpt = entries.reduce((s, e) => s + (e.nptHours || 0), 0);
    const totalFuel = entries.reduce((s, e) => s + (e.fuelConsumed || 0), 0);
    const totalConsumables = entries.reduce((s, e) => s + (e.consumablesCost || 0), 0);

    // Per-rig aggregation
    const rigAgg = {};
    entries.forEach(e => {
        const name = e.rig?.name || 'Unknown';
        if (!rigAgg[name]) rigAgg[name] = { name, meters: 0, npt: 0, fuel: 0, entries: 0 };
        rigAgg[name].meters += e.metersDrilled;
        rigAgg[name].npt += e.nptHours || 0;
        rigAgg[name].fuel += e.fuelConsumed || 0;
        rigAgg[name].entries += 1;
    });
    const rigData = Object.values(rigAgg);

    // Downtime breakdown
    const dtAgg = {};
    entries.filter(e => e.downtimeCategory).forEach(e => {
        if (!dtAgg[e.downtimeCategory]) dtAgg[e.downtimeCategory] = { name: e.downtimeCategory, hours: 0, count: 0 };
        dtAgg[e.downtimeCategory].hours += e.nptHours || 0;
        dtAgg[e.downtimeCategory].count += 1;
    });
    const dtData = Object.values(dtAgg);

    // Daily trend
    const dailyAgg = {};
    entries.forEach(e => {
        const d = new Date(e.date).toLocaleDateString();
        if (!dailyAgg[d]) dailyAgg[d] = { date: d, meters: 0, npt: 0 };
        dailyAgg[d].meters += e.metersDrilled;
        dailyAgg[d].npt += e.nptHours || 0;
    });
    const dailyData = Object.values(dailyAgg).reverse();

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
                <p className="text-sm text-slate-500 mt-1">Fleet performance intelligence</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-[#111827] border border-slate-800/50">
                <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">From</label>
                    <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className={selectClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">To</label>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className={selectClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Rig</label>
                    <select value={filters.rigId} onChange={e => setFilters(f => ({ ...f, rigId: e.target.value }))} className={selectClass}>
                        <option value="">All Rigs</option>
                        {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Project</label>
                    <select value={filters.projectId} onChange={e => setFilters(f => ({ ...f, projectId: e.target.value }))} className={selectClass}>
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-slate-800/30 w-fit">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-orange-500/15 text-orange-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-slate-800/30 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <>
                    {tab === 'production' && (
                        <div className="space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <SummaryCard label="Total Meters" value={`${totalMeters.toLocaleString()}m`} />
                                <SummaryCard label="Avg / Entry" value={`${entries.length ? Math.round(totalMeters / entries.length) : 0}m`} />
                                <SummaryCard label="Total Entries" value={entries.length} />
                                <SummaryCard label="Best Rig" value={rigData.sort((a, b) => b.meters - a.meters)[0]?.name || '—'} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title="Meters by Rig">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={rigData} barSize={32}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                            <Bar dataKey="meters" fill="#f97316" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                                <ChartCard title="Production Trend">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                            <Line type="monotone" dataKey="meters" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                        </div>
                    )}
                    {tab === 'downtime' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <SummaryCard label="Total NPT" value={`${totalNpt.toFixed(1)} hrs`} />
                                <SummaryCard label="NPT %" value={`${entries.length ? ((totalNpt / (entries.length * 12)) * 100).toFixed(1) : 0}%`} />
                                <SummaryCard label="Categories" value={dtData.length} />
                                <SummaryCard label="Worst Category" value={dtData.sort((a, b) => b.hours - a.hours)[0]?.name || '—'} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title="Downtime by Category">
                                    {dtData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={dtData} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                                    {dtData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyState />}
                                </ChartCard>
                                <ChartCard title="NPT Trend">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                            <Line type="monotone" dataKey="npt" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                        </div>
                    )}
                    {tab === 'financial' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <SummaryCard label="Total Fuel" value={`${totalFuel.toLocaleString()} L`} />
                                <SummaryCard label="Total Consumables" value={`$${totalConsumables.toLocaleString()}`} />
                                <SummaryCard label="Fuel/Meter" value={totalMeters > 0 ? `${(totalFuel / totalMeters).toFixed(1)} L/m` : '—'} />
                                <SummaryCard label="Consumables/Meter" value={totalMeters > 0 ? `$${(totalConsumables / totalMeters).toFixed(2)}/m` : '—'} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title="Fuel Consumption by Rig">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={rigData} barSize={32}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                            <Bar dataKey="fuel" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                                <ChartCard title="Cost per Meter by Rig">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={rigData.map(r => ({ ...r, costPerMeter: r.meters > 0 ? (r.fuel * 1.5 / r.meters).toFixed(2) : 0 }))} barSize={32}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }} />
                                            <Bar dataKey="costPerMeter" fill="#10b981" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                        </div>
                    )}
                    {tab === 'maintenance' && (
                        <div className="text-center py-20">
                            <Wrench className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-400">Maintenance Analytics</h3>
                            <p className="text-sm text-slate-600 mt-2">MTBF & MTTR metrics will populate as maintenance logs are added</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
            <p className="text-xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-[280px] flex items-center justify-center text-slate-600 text-sm">
            No data for this period
        </div>
    );
}
