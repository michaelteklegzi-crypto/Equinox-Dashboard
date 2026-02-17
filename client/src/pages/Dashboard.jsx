import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, AlertTriangle, Clock, TrendingUp, Plus, FileText } from 'lucide-react';
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
        recentIncidents: 0
    });
    const [depthData, setDepthData] = useState([]);
    const [downtimeData, setDowntimeData] = useState([]);
    const [recentReports, setRecentReports] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [kpiRes, depthRes, downtimeRes, reportsRes] = await Promise.all([
                axios.get('/api/analytics/kpi'),
                axios.get('/api/analytics/charts/depth'),
                axios.get('/api/analytics/charts/downtime'),
                axios.get('/api/reports') // Fetch recent reports to show list
            ]);

            setKpi(kpiRes.data);
            setDepthData(depthRes.data);
            setDowntimeData(downtimeRes.data);
            setRecentReports(Array.isArray(reportsRes.data) ? reportsRes.data.slice(0, 5) : []);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            showToast('Failed to load analytics. Using offline mode.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        EQUINOX
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Drilling Operations & Maintenance Command Center</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/drilling')}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-slate-700 transition-colors"
                    >
                        <FileText className="mr-2 h-4 w-4" /> View Reports
                    </button>
                    <button
                        onClick={() => navigate('/drilling')} // Shortcut to new report
                        className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-orange-600"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Entry
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Depth (All Time)"
                    value={`${kpi.totalDepth?.toLocaleString()} m`}
                    subtitle={`+${kpi.todayDepth?.toLocaleString()} m today`}
                    icon={TrendingUp}
                    color="orange"
                />
                <StatCard
                    title="Active Rigs"
                    value={kpi.activeRigs}
                    subtitle="Reporting today"
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="NPT (Downtime)"
                    value={`${kpi.nptHours?.toFixed(1)} hrs`}
                    subtitle="Cumulative Loss"
                    icon={Clock}
                    color={kpi.nptHours > 0 ? "red" : "green"}
                />
                <StatCard
                    title="Safety Incidents"
                    value={kpi.recentIncidents}
                    subtitle="Last 30 Days"
                    icon={AlertTriangle}
                    color={kpi.recentIncidents > 0 ? "red" : "green"}
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <DepthChart data={depthData} />
                <DowntimeChart data={downtimeData} />
            </div>

            {/* Recent Reports Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Drilling Reports</h3>
                    <button onClick={() => navigate('/drilling')} className="text-sm text-orange-600 hover:text-orange-700 font-medium">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Rig ID</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Drilled (m)</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentReports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No reports found.</td>
                                </tr>
                            ) : recentReports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => navigate(`/drilling/${report.id}`)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {new Date(report.reportDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">{report.rigId}</td>
                                    <td className="px-6 py-4 text-slate-500">{report.location || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {report.totalDrilled?.toFixed(1)} m
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                report.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-slate-100 text-slate-800'
                                            }`}>
                                            {report.status}
                                        </span>
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

function StatCard({ title, value, subtitle, icon: Icon, color }) {
    const colors = {
        orange: 'bg-orange-50 text-orange-600 ring-orange-100',
        blue: 'bg-blue-50 text-blue-600 ring-blue-100',
        green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        red: 'bg-red-50 text-red-600 ring-red-100',
    };

    return (
        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <dt>
                <div className={`absolute rounded-xl p-3 ${colors[color] || colors.blue}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-slate-500">{title}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
            </dd>
            <dd className="ml-16">
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </dd>
        </div>
    );
}
