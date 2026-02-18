import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Fuel, Clock, AlertTriangle, ChevronRight, Drill } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import DrillingEntryModal from '../components/DrillingEntryModal';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function CommandCenter() {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEntryModal, setShowEntryModal] = useState(false);

    const fetchKPIs = async () => {
        try {
            const res = await axios.get('/api/drilling/kpis', { withCredentials: true });
            setKpis(res.data);
        } catch (err) {
            console.error('Failed to load KPIs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKPIs(); }, []);

    const handleEntryCreated = () => {
        setShowEntryModal(false);
        fetchKPIs(); // Refresh dashboard
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-4 w-40 bg-slate-800 rounded mt-2 animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-slate-800/50 rounded-2xl animate-pulse" />
                    <div className="h-80 bg-slate-800/50 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    const overview = kpis?.overview || {};
    const rigPerf = kpis?.rigPerformance || [];
    const recent = kpis?.recentEntries || [];

    const kpiCards = [
        {
            label: 'Total Meters Drilled',
            value: overview.totalMeters?.toLocaleString() || '0',
            unit: 'm',
            icon: TrendingUp,
            color: 'from-orange-500 to-amber-500',
            shadow: 'shadow-orange-500/20'
        },
        {
            label: 'Avg Meters / Entry',
            value: overview.avgMetersPerEntry?.toLocaleString() || '0',
            unit: 'm',
            icon: Drill,
            color: 'from-blue-500 to-cyan-500',
            shadow: 'shadow-blue-500/20'
        },
        {
            label: 'NPT Hours',
            value: overview.totalNptHours?.toLocaleString() || '0',
            unit: 'hrs',
            icon: Clock,
            color: 'from-red-500 to-rose-500',
            shadow: 'shadow-red-500/20'
        },
        {
            label: 'Active Rigs',
            value: overview.activeRigs || '0',
            unit: '',
            icon: AlertTriangle,
            color: 'from-emerald-500 to-teal-500',
            shadow: 'shadow-emerald-500/20'
        },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Fleet Command Center</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time drilling operations overview</p>
                </div>
                <button
                    onClick={() => setShowEntryModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4" />
                    New Entry
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} className="relative overflow-hidden rounded-2xl bg-[#111827] border border-slate-800/50 p-5 group hover:border-slate-700/50 transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{card.label}</p>
                                <p className="text-3xl font-bold text-white mt-2">
                                    {card.value}
                                    <span className="text-sm text-slate-500 ml-1 font-normal">{card.unit}</span>
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow}`}>
                                <card.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rig Performance Chart */}
                <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Rig Performance (Total Meters)</h2>
                    {rigPerf.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigPerf} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                                    formatter={(val) => [`${val.toLocaleString()} m`, 'Meters']}
                                />
                                <Bar dataKey="totalMeters" fill="url(#orangeGrad)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#ea580c" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-slate-600">
                            No data yet. Create your first drilling entry!
                        </div>
                    )}
                </div>

                {/* Recent Entries */}
                <div className="rounded-2xl bg-[#111827] border border-slate-800/50 p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Entries</h2>
                    <div className="space-y-3">
                        {recent.length > 0 ? recent.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                        <Drill className="h-4 w-4 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{entry.rig?.name}</p>
                                        <p className="text-xs text-slate-500">{entry.project?.name} · {entry.shift}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-orange-400">{entry.metersDrilled}m</p>
                                    <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                                No entries yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Entry Modal */}
            {showEntryModal && (
                <DrillingEntryModal
                    onClose={() => setShowEntryModal(false)}
                    onSuccess={handleEntryCreated}
                />
            )}
        </div>
    );
}
