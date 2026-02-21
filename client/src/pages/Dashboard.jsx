import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, AlertTriangle, Clock, TrendingUp, Plus, FileText, Droplets, DollarSign, LayoutGrid } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import DepthChart from '../components/charts/DepthChart';
import DowntimeChart from '../components/charts/DowntimeChart';

export default function Dashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);

    // Analytics State
    const [kpi, setKpi] = useState({
        totalDepth: 0,
        todayDepth: 0,
        activeRigs: 0,
        nptHours: 0,
        recentIncidents: 0,
        dailyCost: 0,
        fuelConsumed: 0
    });
    const [chartData, setChartData] = useState({ depth: [], downtime: [] });
    const [fleetData, setFleetData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [kpiRes, depthRes, downtimeRes, fleetRes] = await Promise.all([
                axios.get('/api/analytics/kpi'),
                axios.get('/api/analytics/charts/depth'),
                axios.get('/api/analytics/charts/downtime'),
                axios.get('/api/analytics/fleet')
            ]);

            setKpi(kpiRes.data);
            setChartData({ depth: depthRes.data, downtime: downtimeRes.data });
            setFleetData(Array.isArray(fleetRes.data) ? fleetRes.data : []);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            showToast('System Offline. Displaying cached data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#30363D] pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <LayoutGrid className="text-cyan-400" />
                        EQUINOX <span className="text-slate-500 font-light">| COMMAND CENTER</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm font-mono">
                        RIGS STATUS: <span className="text-green-400">OPERATIONAL</span> | 12 RIGS ACTIVE
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/drilling')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#21262d] text-cyan-400 border border-[#30363D] rounded hover:bg-[#30363D] transition-colors text-sm font-medium"
                    >
                        <FileText size={16} /> Reports
                    </button>
                    <button
                        onClick={() => navigate('/drilling')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={16} /> New Entry
                    </button>
                </div>
            </div>

            {/* KPI Grid - Top Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Depth (Today)"
                    value={`${kpi.todayDepth?.toLocaleString()} m`}
                    subtext="Target: 2,500m"
                    icon={TrendingUp}
                    color="text-green-400"
                />
                <KpiCard
                    title="Rigs NPT (24h)"
                    value={`${kpi.nptHours?.toFixed(1)} hrs`}
                    subtext="Downtime Impact"
                    icon={Clock}
                    color={kpi.nptHours > 5 ? "text-red-400" : "text-slate-400"}
                />
                <KpiCard
                    title="Daily Cost Est."
                    value={`$${(kpi.dailyCost / 1000).toFixed(1)}k`}
                    subtext="OpEx Run Rate"
                    icon={DollarSign}
                    color="text-yellow-400"
                />
                <KpiCard
                    title="Fuel Consumed"
                    value={`${(kpi.fuelConsumed / 1000).toFixed(1)} kL`}
                    subtext="Diesel Usage"
                    icon={Droplets}
                    color="text-purple-400"
                />
            </div>

            {/* Main Visuals Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Chart Area (2/3 width) */}
                <div className="lg:col-span-2 bg-[#161B22] border border-[#30363D] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Drilling Progress (30 Days)</h3>
                    <div className="h-80">
                        {/* Pass dark mode flag to charts if supported, otherwise container styling handles bg */}
                        <DepthChart data={chartData.depth} />
                    </div>
                </div>

                {/* Secondary Chart / Stat Area (1/3 width) */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Downtime Causes</h3>
                    <div className="h-80">
                        <DowntimeChart data={chartData.downtime} />
                    </div>
                </div>
            </div>

            {/* Fleet Overview Table */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
                <div className="p-6 border-b border-[#30363D] flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Active Rigs Status</h3>
                    <span className="text-xs font-mono text-slate-500">LIVE FEED</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="bg-[#0d1117] text-xs uppercase font-medium text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Rig Name</th>
                                <th className="px-6 py-4">Site</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Total Depth (30d)</th>
                                <th className="px-6 py-4 text-right">Cost (30d)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#30363D]">
                            {fleetData.map((rig) => (
                                <tr key={rig.id} className="hover:bg-[#21262d] transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{rig.name}</td>
                                    <td className="px-6 py-4">{rig.site}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={rig.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-cyan-400">
                                        {rig.totalDepth?.toLocaleString()} m
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        ${(rig.totalCost / 1000).toFixed(0)}k
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Sub-components
function KpiCard({ title, value, subtext, icon: Icon, color }) {
    return (
        <div className="bg-[#161B22] border border-[#30363D] p-5 rounded-lg hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider">{title}</p>
                <Icon size={18} className={color} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{value}</h2>
            <p className="text-xs text-slate-500">{subtext}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Active: 'bg-green-900/30 text-green-400 border-green-900',
        Maintenance: 'bg-red-900/30 text-red-400 border-red-900',
        Stacked: 'bg-slate-800 text-slate-400 border-slate-700'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs border ${styles[status] || styles.Stacked}`}>
            {status}
        </span>
    );
}
