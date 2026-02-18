import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Calendar, Filter, Activity, Clock, AlertTriangle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#64748b'];

export default function MachineAvailability() {
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        rigId: '',
        projectId: ''
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([r, p]) => { setRigs(r.data); setProjects(p.data); }).catch(console.error);
    }, []);

    useEffect(() => {
        fetchReport();
    }, [filters]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const res = await axios.get(`/api/reports/availability?${params}`, { withCredentials: true });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!data) return;
        const headers = ['Date', 'Rig', 'Shift', 'Shift Hrs', 'Drill Hrs', 'Mech DT', 'Ops DT', 'Weather DT', 'Availability %', 'Utilization %'];
        const rows = data.dailyBreakdown.map(d => [
            d.date.split('T')[0], d.rigName, d.shift, d.shiftHours, d.drillingHours,
            d.mechanicalDowntime, d.operationalDelay, d.weatherDowntime, d.availability, d.utilization
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `availability_report_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleExportPDF = () => {
        if (!data) return;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Machine Availability Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 28);

        // Summary
        const s = data.summary;
        doc.text(`Avg Availability: ${s.overallAvailability}%`, 14, 40);
        doc.text(`Avg Utilization: ${s.overallUtilization}%`, 80, 40);
        doc.text(`Total Meters: ${s.totalMeters}m`, 140, 40);

        // Table
        autoTable(doc, {
            startY: 50,
            head: [['Date', 'Rig', 'Drill(h)', 'Mech(h)', 'Ops(h)', 'Avail %', 'Util %']],
            body: data.dailyBreakdown.map(d => [
                d.date.split('T')[0], d.rigName,
                d.drillingHours, d.mechanicalDowntime, d.operationalDelay,
                d.availability, d.utilization
            ]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`availability_report_${filters.endDate}.pdf`);
    };

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50";

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-blue-500" />
                        Machine Availability
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Downtime analysis and fleet utilization metrics</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all text-sm font-medium">
                        <FileSpreadsheet className="h-4 w-4 text-green-500" /> Export CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all text-sm font-medium">
                        <FileText className="h-4 w-4 text-orange-500" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#111827] border border-slate-800/50 rounded-2xl p-4 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Date Range</label>
                    <div className="flex gap-2">
                        <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className={selectClass} />
                        <span className="self-center text-slate-600">-</span>
                        <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className={selectClass} />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Rig</label>
                    <select value={filters.rigId} onChange={e => setFilters(prev => ({ ...prev, rigId: e.target.value }))} className={selectClass}>
                        <option value="">All Rigs</option>
                        {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Project</label>
                    <select value={filters.projectId} onChange={e => setFilters(prev => ({ ...prev, projectId: e.target.value }))} className={selectClass}>
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button onClick={fetchReport} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all ml-auto hover:scale-[1.02] active:scale-[0.98]">
                    Apply Filters
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-500">Loading report data...</div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPI label="Availability" value={`${data.summary.overallAvailability}%`} trend="Target: 90%" icon={CheckCircle} color="text-green-500" />
                        <KPI label="Utilization" value={`${data.summary.overallUtilization}%`} trend="Target: 75%" icon={Activity} color="text-blue-500" />
                        <KPI label="Total Meters" value={`${data.summary.totalMeters.toLocaleString()}m`} icon={Filter} color="text-orange-500" />
                        <KPI label="Mech. Downtime" value={`${data.summary.totalMechanicalDT} hrs`} icon={AlertTriangle} color="text-red-500" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ChartCard title="Downtime Breakdown (Hours)" className="lg:col-span-1">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Mechanical', value: data.summary.downtimeBreakdown.mechanical },
                                            { name: 'Operational', value: data.summary.downtimeBreakdown.operational },
                                            { name: 'Weather', value: data.summary.downtimeBreakdown.weather },
                                            { name: 'Safety', value: data.summary.downtimeBreakdown.safety },
                                            { name: 'Waiting', value: data.summary.downtimeBreakdown.waiting },
                                            { name: 'Standby', value: data.summary.downtimeBreakdown.standby },
                                        ].filter(d => d.value > 0)}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Daily Availability Trend" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={data.dailyBreakdown.map(i => ({ ...i }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" tickFormatter={d => d.split('T')[0].slice(5)} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="availability" stroke="#10b981" strokeWidth={2} name="Availability %" />
                                    <Line type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2} name="Utilization %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Detailed Table */}
                    <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-300">Detailed Shift Logs</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Rig</th>
                                        <th className="px-6 py-3">Shift</th>
                                        <th className="px-6 py-3 text-right">Drill (Hrs)</th>
                                        <th className="px-6 py-3 text-right">Mech (Hrs)</th>
                                        <th className="px-6 py-3 text-right">Ops (Hrs)</th>
                                        <th className="px-6 py-3 text-right">Weather (Hrs)</th>
                                        <th className="px-6 py-3 text-right">Avail %</th>
                                        <th className="px-6 py-3 text-right">Util %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {data.dailyBreakdown.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-300">{row.date.split('T')[0]}</td>
                                            <td className="px-6 py-4 text-white font-medium">{row.rigName}</td>
                                            <td className="px-6 py-4 text-slate-400">{row.shift}</td>
                                            <td className="px-6 py-4 text-right text-slate-300">{row.drillingHours}</td>
                                            <td className="px-6 py-4 text-right text-red-400">{row.mechanicalDowntime}</td>
                                            <td className="px-6 py-4 text-right text-orange-400">{row.operationalDelay}</td>
                                            <td className="px-6 py-4 text-right text-yellow-400">{row.weatherDowntime}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-500">{row.availability}%</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-500">{row.utilization}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function KPI({ label, value, trend, icon: Icon, color }) {
    return (
        <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-5 flex items-start justify-between">
            <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-2xl font-bold text-white mt-2">{value}</p>
                {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-slate-800/50 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );
}

function ChartCard({ title, children, className }) {
    return (
        <div className={`rounded-2xl bg-[#111827] border border-slate-800/50 p-6 ${className}`}>
            <h3 className="text-sm font-semibold text-slate-300 mb-6">{title}</h3>
            {children}
        </div>
    );
}
