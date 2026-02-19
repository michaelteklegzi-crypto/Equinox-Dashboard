import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Wrench, Download, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#6366f1'];
const TABS = [
    { key: 'production', label: 'Production', icon: TrendingUp },
    { key: 'downtime', label: 'Downtime', icon: Clock },
    { key: 'financial', label: 'Financial', icon: DollarSign },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'predictive', label: 'Predictive', icon: TrendingUp },
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
    const [predData, setPredData] = useState(null);
    const [scenario, setScenario] = useState('normal');
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
            } else if (t === 'predictive') {
                const res = await axios.get(`/api/predictive/forecast?${q}&scenario=${scenario}`, { withCredentials: true });
                setPredData(res.data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTab(tab); }, [tab, filters, scenario]);

    const handleExportCSV = () => {
        const q = buildParams();
        window.open(`/api/analytics/export/csv?${q}`, '_blank');
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Equinox Analytics Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

        if (tab === 'production' && prodData) {
            doc.text(`Total Meters: ${prodData.totals.totalMeters}`, 14, 40);
            autoTable(doc, {
                startY: 50,
                head: [['Rig', 'Meters', 'Fuel', 'Entries']],
                body: prodData.rigBreakdown.map(r => [r.rigName, r.totalMeters, r.totalFuel, r.entries]),
                theme: 'striped'
            });
        } else if (tab === 'downtime' && dtData) {
            doc.text('Downtime Analysis', 14, 40);
            autoTable(doc, {
                startY: 50,
                head: [['Category', 'Hours', 'Count']],
                body: dtData.categoryBreakdown.map(c => [c.category, c.hours, c.count]),
                theme: 'striped'
            });
        }

        doc.save(`analytics_${tab}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
                    <p className="text-sm text-slate-500 mt-1">Fleet performance intelligence</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all text-sm font-medium">
                        <FileSpreadsheet className="h-4 w-4 text-green-500" /> Export CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all text-sm font-medium">
                        <Download className="h-4 w-4 text-orange-500" /> Export PDF
                    </button>
                </div>
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
                    {tab === 'predictive' && predData && <PredictiveTab data={predData} scenario={scenario} setScenario={setScenario} />}
                </>
            )}
        </div>
    );
}

// ============ PRODUCTION TAB ============
function ProductionTab({ data }) {
    const { totals, rigBreakdown, projectBreakdown, dailyTrend, comparisonTrend } = data;
    // Dynamic keys for multi-rig comparison: Collect ALL unique keys from ALL data points
    const rigKeys = comparisonTrend ? Array.from(new Set(comparisonTrend.flatMap(d => Object.keys(d).filter(k => k !== 'date')))) : [];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total Meters" value={`${totals.totalMeters.toLocaleString()}m`} />
                <KPI label="Avg / Entry" value={`${totals.avgMetersPerEntry}m`} />
                <KPI label="Total Entries" value={totals.totalEntries} />
                <KPI label="Best Rig" value={[...rigBreakdown].sort((a, b) => b.totalMeters - a.totalMeters)[0]?.rigName || '—'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Meters by Rig">
                    {rigBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigBreakdown.map(i => ({ ...i }))} barSize={32}>
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
                            <LineChart data={dailyTrend.map(i => ({ ...i }))}>
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

            <div className="mt-6">
                <ChartCard title="Multi-Rig Comparison (Meters)">
                    {comparisonTrend && comparisonTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={comparisonTrend.map(i => ({ ...i }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                                {rigKeys.map((key, index) => (
                                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                                ))}
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
    const { categoryBreakdown, rigNpt, nptByRigAndCategory, downtimeTrend } = data;
    const totalHours = categoryBreakdown.reduce((s, c) => s + c.hours, 0);

    // Get all unique categories for stacking
    const categories = Array.from(new Set(categoryBreakdown.map(c => c.category)));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total NPT" value={`${totalHours.toFixed(1)} hrs`} />
                <KPI label="Categories" value={categoryBreakdown.length} />
                <KPI label="Total Incidents" value={categoryBreakdown.reduce((s, c) => s + c.count, 0)} />
                <KPI label="Worst Category" value={[...categoryBreakdown].sort((a, b) => b.hours - a.hours)[0]?.category || '—'} />
            </div>

            {/* Daily Trend */}
            <ChartCard title="Daily Downtime Trend">
                {downtimeTrend && downtimeTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={downtimeTrend.map(i => ({ ...i }))}>
                            <defs>
                                <linearGradient id="colorNpt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={ttStyle} />
                            <Area type="monotone" dataKey="hours" stroke="#ef4444" fillOpacity={1} fill="url(#colorNpt)" name="NPT Hours" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="NPT by Category">
                    {categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={categoryBreakdown.map(i => ({ ...i }))} dataKey="hours" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={ttStyle} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </ChartCard>

                <ChartCard title="NPT by Rig & Reason">
                    {nptByRigAndCategory && nptByRigAndCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={nptByRigAndCategory.map(i => ({ ...i }))} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rig" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Legend />
                                {categories.map((cat, index) => (
                                    <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[index % COLORS.length]} />
                                ))}
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
                            <BarChart data={rigBreakdown.map(i => ({ ...i }))} barSize={32}>
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
                            <BarChart data={rigBreakdown.map(i => ({ ...i }))} barSize={32}>
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
                <KPI label="Most Serviced" value={[...rigFrequency].sort((a, b) => b.count - a.count)[0]?.name || '—'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Maintenance Frequency by Rig">
                    {rigFrequency.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigFrequency.map(i => ({ ...i }))} barSize={32}>
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

// ============ PREDICTIVE TAB ============
function PredictiveTab({ data, scenario, setScenario }) {
    const { actuals, forecast, risk, financials } = data;

    // Combine actuals and forecast for the chart
    // We need a continuous line. The last actual point should connect to first forecast point.
    // The backend provides 'forecast' starting from tomorrow.

    const chartData = [
        ...actuals.map(d => ({ ...d, type: 'actual' })),
        // Add last actual as first forecast point to connect lines?
        // OR just rely on Recharts.
        ...forecast.map(d => ({ ...d, type: 'forecast' }))
    ];

    const getScenarioColor = () => {
        if (scenario === 'optimistic') return '#10b981';
        if (scenario === 'conservative') return '#f59e0b';
        return '#3b82f6'; // normal
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-slate-800/50 p-1 rounded-xl">
                    {['normal', 'optimistic', 'conservative'].map(s => (
                        <button key={s} onClick={() => setScenario(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${scenario === s ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-700/30">
                    <span className="w-2 h-2 rounded-full" style={{ background: getScenarioColor() }}></span>
                    Mode: <span className="text-slate-200 font-medium capitalize">{scenario} Case</span>
                </div>
            </div>

            {/* Financial Bridge */}
            {data.status === 'low_confidence' && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm flex items-start gap-3">
                    <div className="bg-orange-500/20 p-2 rounded-lg"><Clock className="h-4 w-4" /></div>
                    <div>
                        <p className="font-semibold mb-1">Insufficient Historical Data</p>
                        <p className="opacity-80">{data.message || 'We need at least 5 days of production history to generate reliable forecasts.'}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI label="Projected Revenue (90 Days)" value={`$${Number(financials.projectedRevenue).toLocaleString()}`} />
                <KPI label="Projected Margin" value={`${financials.marginPercent}%`} />
                <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-4 relative group">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Risk Assessment</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xl font-bold ${risk.status === 'Red' ? 'text-red-500' : risk.status === 'Yellow' ? 'text-yellow-500' : 'text-green-500'}`}>
                            {risk.status} ({risk.score}%)
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Primary Factor: {risk.primaryFactor}</p>
                </div>
            </div>

            {/* Explanation Banner */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg"><TrendingUp className="h-4 w-4" /></div>
                <div>
                    <p className="font-semibold mb-1">Forecast Insight</p>
                    <p className="opacity-80">{financials.explanation}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartCard title={data.status === 'low_confidence' ? "Production Roadmap (Waiting for Data)" : "90-Day Production Roadmap"}>
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={getScenarioColor()} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={getScenarioColor()} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={30} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={ttStyle} />
                                <Legend />
                                {/* Confidence Interval Area */}
                                <Area type="monotone" dataKey="ciHigh" dataKey2="ciLow" stroke="none" fill={getScenarioColor()} fillOpacity={0.1} name="Confidence Interval" />

                                <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={2} dot={false} name="Actual History" />
                                <Line type="monotone" dataKey="forecast" stroke={getScenarioColor()} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div className="space-y-6">
                    <ChartCard title="Downtime Risk Probability">
                        <div className="flex flex-col items-center justify-center h-[280px] relative">
                            {/* Custom Circular Gauge CSS approach */}
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="15" fill="none" />
                                    <circle cx="80" cy="80" r="70" stroke={risk.status === 'Red' ? '#ef4444' : risk.status === 'Yellow' ? '#f59e0b' : '#10b981'} strokeWidth="15" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * risk.score) / 100} className="transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{risk.score}%</span>
                                    <span className="text-xs text-slate-500 uppercase">Risk Prob.</span>
                                </div>
                            </div>
                            <p className="text-center text-sm text-slate-400 mt-6 px-4">
                                {risk.message}
                            </p>
                        </div>
                    </ChartCard>
                </div>
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
