import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, CheckCircle, Clock, Save, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function EquipmentHealth() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/maintenance/health', { withCredentials: true });
            setData(res.data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load health data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateHours = async (id, newHours) => {
        setUpdating(id);
        try {
            await axios.post(`/api/maintenance/equipment/${id}/update-hours`, { currentHours: newHours }, { withCredentials: true });
            showToast("Usage updated successfully", "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.error || "Update failed", "error");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading Fleet Health...</div>;
    if (!data) return <div className="p-12 text-center text-slate-500">No Data Available</div>;

    const { stats, equipment } = data;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Fleet Health" value={`${stats.avgHealth}%`} icon={Activity} color="blue" sub="Average Score" />
                <KPICard label="Good Condition" value={stats.good} icon={CheckCircle} color="emerald" sub="Items" />
                <KPICard label="Warnings" value={stats.warning} icon={AlertTriangle} color="amber" sub="Service Due Soon" />
                <KPICard label="Critical" value={stats.critical} icon={AlertTriangle} color="red" sub="Late for Service" />
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {equipment.map(item => (
                    <EquipmentCard key={item.id} item={item} onUpdate={handleUpdateHours} isUpdating={updating === item.id} />
                ))}
            </div>

            {equipment.length === 0 && (
                <div className="text-center p-12 rounded-2xl bg-[#111827] border border-slate-800/50">
                    <p className="text-slate-500">No equipment tracked. Add items to database to see health.</p>
                </div>
            )}
        </div>
    );
}

function KPICard({ label, value, icon: Icon, color, sub }) {
    const colors = {
        blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        red: 'border-red-500/30 bg-red-500/10 text-red-400',
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color]} flex items-center justify-between`}>
            <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
                <div className="text-2xl font-bold mt-1">{value}</div>
                <p className="text-[10px] mt-1 opacity-60">{sub}</p>
            </div>
            <div className="p-3 rounded-full bg-white/5 backdrop-blur-sm">
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}

function EquipmentCard({ item, onUpdate, isUpdating }) {
    const [hoursInput, setHoursInput] = useState(item.hours);
    const [editing, setEditing] = useState(false);

    const statusColor = item.status === 'Critical' ? 'bg-red-500' :
        item.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500';

    const statusBg = item.status === 'Critical' ? 'bg-red-500/5 border-red-500/20' :
        item.status === 'Warning' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[#111827] border-slate-800/50';

    return (
        <div className={`p-5 rounded-xl border transition-all ${statusBg}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${statusColor} bg-opacity-15 flex items-center justify-center`}>
                        <Activity className={`h-5 w-5 ${item.status === 'Critical' ? 'text-red-400' : item.status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{item.name}</h4>
                        <p className="text-xs text-slate-500">{item.type} • {item.rig?.name || 'Unassigned'}</p>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${item.status === 'Critical' ? 'bg-red-500/15 text-red-400' : item.status === 'Warning' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {item.status}
                </div>
            </div>

            {/* Health Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-400">Health Score</span>
                    <span className="font-bold text-white">{item.healthScore}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${statusColor} transition-all duration-500`}
                        style={{ width: `${item.healthScore}%` }}
                    />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                    <p className="text-slate-500 mb-1">Running Hours</p>

                    {editing ? (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={hoursInput}
                                onChange={(e) => setHoursInput(e.target.value)}
                                className="w-full px-2 py-1 rounded border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <button
                                onClick={() => { onUpdate(item.id, hoursInput); setEditing(false); }}
                                className="bg-orange-500 text-white p-1 rounded hover:bg-orange-600 transition-colors"
                                disabled={isUpdating}
                            >
                                <Save className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between group">
                            <span className="text-lg font-semibold text-white">{item.hours} h</span>
                            <button
                                onClick={() => setEditing(true)}
                                className="opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-300 transition text-xs font-medium"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                    <p className="text-slate-500 mb-1">Next Service Due in</p>
                    <span className={`text-lg font-semibold ${item.remainingHours < 500 ? 'text-red-400' : 'text-white'}`}>
                        {item.remainingHours} h
                    </span>
                    <p className="text-[10px] text-slate-600 mt-1">at {item.nextServiceAt} h total</p>
                </div>
            </div>
        </div>
    );
}
