import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Wrench, Download, FileSpreadsheet } from 'lucide-react';
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
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', rigId: '', projectId: '' });
    const [prodData, setProdData] = useState(null);
    const [dtData, setDtData] = useState(null);
    const [finData, setFinData] = useState(null);
    const [maintData, setMaintData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([r, p]) => { setRigs(r.data); setProjects(p.data); });
    }, []);

    const buildParams = () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.rigId) params.append('rigId', filters.rigId);
        if (filters.projectId) params.append('projectId', filters.projectId);
        return params.toString();
    };

    const fetchTab = async (t) => {
        setLoading(true);
        try {
            const q = buildParams();
            if (t === 'production') {
                const res = await axios.get(`/api/analytics/production?${q}`, { withCredentials: true });
                setProdData(res.data);
            } else if (t === 'downtime') {
                const res = await axios.get(`/api/analytics/downtime?${q}`, { withCredentials: true });
                setDtData(res.data);
            } else if (t === 'financial') {
                const res = await axios.get(`/api/analytics/financial?${q}`, { withCredentials: true });
                setFinData(res.data);
            } else if (t === 'maintenance') {
                const res = await axios.get(`/api/analytics/maintenance?${q}`, { withCredentials: true });
                setMaintData(res.data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTab(tab); }, [tab, filters]);

    const handleExportCSV = () => {
        const q = buildParams();
        window.open(`/api/analytics/export/csv?${q}`, '_blank');
    };

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
                    <p className="text-sm text-slate-500 mt-1">Fleet performance intelligence</p>
                </div>
                <button onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition-all">
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
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
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-orange-500/15 text-orange-400' : 'text-slate-500 hover:text-slate-300'
                            }`}>
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-slate-800/30 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <>
                    {tab === 'production' && prodData && <ProductionTab data={prodData} />}
                    {tab === 'downtime' && dtData && <DowntimeTab data={dtData} />}
                    {tab === 'financial' && finData && <FinancialTab data={finData} />}
                    {tab === 'maintenance' && maintData && <MaintenanceTab data={maintData} />}
                </>
            )}
        </div>
    );
}

// ============ PRODUCTION TAB ============
function ProductionTab({ data }) {
    const { totals, rigBreakdown, projectBreakdown, dailyTrend } = data;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total Meters" value={`${totals.totalMeters.toLocaleString()}m`} />
                <KPI label="Avg / Entry" value={`${totals.avgMetersPerEntry}m`} />
                <KPI label="Total Entries" value={totals.totalEntries} />
                <KPI label="Best Rig" value={rigBreakdown.sort((a, b) => b.totalMeters - a.totalMeters)[0]?.rigName || '—'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Meters by Rig">
                    {rigBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigBreakdown} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Bar dataKey="totalMeters" fill="#f97316" radius={[6, 6, 0, 0]} name="Meters" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
                <ChartCard title="Daily Production Trend">
                    {dailyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Line type="monotone" dataKey="meters" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} name="Meters" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
            </div>
            {/* Project breakdown table */}
            {projectBreakdown.length > 0 && (
                <ChartCard title="Production by Project">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Project</th>
                                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Client</th>
                                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Meters</th>
                                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Entries</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectBreakdown.map((p, i) => (
                                    <tr key={i} className="border-b border-slate-800/30">
                                        <td className="px-4 py-3 text-white font-medium">{p.projectName}</td>
                                        <td className="px-4 py-3 text-slate-400">{p.clientName}</td>
                                        <td className="px-4 py-3 text-right text-orange-400 font-semibold">{p.totalMeters.toLocaleString()}m</td>
                                        <td className="px-4 py-3 text-right text-slate-400">{p.entries}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            )}
        </div>
    );
}

// ============ DOWNTIME TAB ============
function DowntimeTab({ data }) {
    const { categoryBreakdown, rigNpt } = data;
    const totalHours = categoryBreakdown.reduce((s, c) => s + c.hours, 0);
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total NPT" value={`${totalHours.toFixed(1)} hrs`} />
                <KPI label="Categories" value={categoryBreakdown.length} />
                <KPI label="Total Incidents" value={categoryBreakdown.reduce((s, c) => s + c.count, 0)} />
                <KPI label="Worst Category" value={categoryBreakdown.sort((a, b) => b.hours - a.hours)[0]?.category || '—'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="NPT by Category">
                    {categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={categoryBreakdown} dataKey="hours" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={ttStyle} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
                <ChartCard title="NPT by Rig">
                    {rigNpt.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigNpt} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Bar dataKey="hours" fill="#ef4444" radius={[6, 6, 0, 0]} name="NPT Hours" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
            </div>
        </div>
    );
}

// ============ FINANCIAL TAB ============
function FinancialTab({ data }) {
    const { totals, rigBreakdown } = data;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total Fuel" value={`${Number(totals.totalFuel).toLocaleString()} L`} />
                <KPI label="Total Consumables" value={`$${Number(totals.totalConsumables).toLocaleString()}`} />
                <KPI label="Est. Fuel Cost" value={`$${Number(totals.estimatedFuelCost).toLocaleString()}`} />
                <KPI label="Cost/Meter" value={`$${totals.costPerMeter}/m`} />
            </div>
            {totals.estimatedRevenue > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <KPI label="Est. Revenue" value={`$${Number(totals.estimatedRevenue).toLocaleString()}`} />
                    <KPI label="Total Cost" value={`$${Number(totals.totalCost).toLocaleString()}`} />
                    <KPI label="Margin" value={`${totals.margin}%`} />
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Fuel Consumption by Rig">
                    {rigBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigBreakdown} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Bar dataKey="fuel" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Fuel (L)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
                <ChartCard title="Fuel Cost by Rig">
                    {rigBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigBreakdown} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Cost']} />
                                <Bar dataKey="fuelCost" fill="#10b981" radius={[6, 6, 0, 0]} name="Fuel Cost ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
            </div>
        </div>
    );
}

// ============ MAINTENANCE TAB ============
function MaintenanceTab({ data }) {
    const { totalLogs, recentLogs, rigFrequency } = data;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total Logs" value={totalLogs} />
                <KPI label="Rigs Serviced" value={rigFrequency.length} />
                <KPI label="Total Maint. Cost" value={`$${rigFrequency.reduce((s, r) => s + r.totalCost, 0).toLocaleString()}`} />
                <KPI label="Most Serviced" value={rigFrequency.sort((a, b) => b.count - a.count)[0]?.name || '—'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Maintenance Frequency by Rig">
                    {rigFrequency.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigFrequency} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Events" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>
                <ChartCard title="Recent Maintenance Logs">
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {recentLogs.length > 0 ? recentLogs.map(l => (
                            <div key={l.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/30">
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{l.rig}</p>
                                    <p className="text-xs text-slate-500">{l.type} · {l.description?.substring(0, 40)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-purple-400">{l.cost ? `$${l.cost}` : '—'}</p>
                                    <p className="text-xs text-slate-500">{new Date(l.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : <Empty />}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

// ============ SHARED COMPONENTS ============
const ttStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' };

function KPI({ label, value }) {
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

function Empty() {
    return <div className="h-[280px] flex items-center justify-center text-slate-600 text-sm">No data for this period</div>;
}
