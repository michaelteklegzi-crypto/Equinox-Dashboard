import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Save, AlertTriangle, TrendingUp, Drill, Clock, Fuel } from 'lucide-react';
import axios from 'axios';
import DrillingEntryModal from '../components/DrillingEntryModal';

const PER_PAGE = 15;

export default function DrillingOperations() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ rigId: '', projectId: '', shift: '', search: '' });
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [page, setPage] = useState(1);

    // Edit state
    const [editEntry, setEditEntry] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchEntries = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.rigId) params.append('rigId', filter.rigId);
            if (filter.projectId) params.append('projectId', filter.projectId);
            if (filter.shift) params.append('shift', filter.shift);
            params.append('limit', '500');
            const res = await axios.get(`/api/drilling?${params}`, { withCredentials: true });
            setEntries(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
        Promise.all([
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([r, p]) => { setRigs(r.data); setProjects(p.data); });
    }, []);

    useEffect(() => { setPage(1); fetchEntries(); }, [filter.rigId, filter.projectId, filter.shift]);

    // Search-filtered entries
    const filtered = useMemo(() => {
        if (!filter.search) return entries;
        const q = filter.search.toLowerCase();
        return entries.filter(e =>
            (e.rig?.name || '').toLowerCase().includes(q) ||
            (e.project?.name || '').toLowerCase().includes(q) ||
            (e.supervisorName || '').toLowerCase().includes(q) ||
            (e.remarks || '').toLowerCase().includes(q)
        );
    }, [entries, filter.search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Calculate Summary Stats
    const summaryStats = useMemo(() => {
        let totalMeters = 0;
        let totalNPT = 0;
        let totalFuel = 0;
        let activeRigs = new Set();

        filtered.forEach(entry => {
            totalMeters += (parseFloat(entry.metersDrilled) || 0);
            totalNPT += (parseFloat(entry.nptHours) || 0);
            totalFuel += (parseFloat(entry.fuelConsumed) || 0);
            if (entry.rigId) activeRigs.add(entry.rigId);
        });

        return {
            meters: totalMeters.toLocaleString(undefined, { maximumFractionDigits: 1 }),
            npt: totalNPT.toFixed(1),
            fuel: totalFuel.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            rigs: activeRigs.size
        };
    }, [filtered]);

    // --- Edit handlers ---
    const openEdit = (entry) => {
        setEditEntry(entry);
        setEditForm({
            date: new Date(entry.date).toISOString().split('T')[0],
            shift: entry.shift,
            rigId: entry.rigId,
            projectId: entry.projectId,
            metersDrilled: entry.metersDrilled,
            drillingHours: entry.drillingHours || 0,
            mechanicalDowntime: entry.mechanicalDowntime || 0,
            operationalDelay: entry.operationalDelay || 0,
            weatherDowntime: entry.weatherDowntime || 0,
            safetyDowntime: entry.safetyDowntime || 0,
            waitingOnParts: entry.waitingOnParts || 0,
            standbyHours: entry.standbyHours || 0,
            nptHours: entry.nptHours || 0,
            holeDepth: entry.holeDepth || '',
            fuelConsumed: entry.fuelConsumed || '',
            consumablesCost: entry.consumablesCost || '',
            remarks: entry.remarks || '',
            supervisorName: entry.supervisorName || '',
        });
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            await axios.put(`/api/drilling/${editEntry.id}`, editForm, { withCredentials: true });
            setEditEntry(null);
            fetchEntries();
        } catch (err) {
            alert('Error saving: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(`/api/drilling/${deleteTarget.id}`, { withCredentials: true });
            setDeleteTarget(null);
            fetchEntries();
        } catch (err) {
            alert('Error deleting: ' + (err.response?.data?.error || err.message));
        } finally {
            setDeleting(false);
        }
    };

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";
    const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50";
    const labelClass = "text-xs text-slate-400 font-medium mb-1";

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Drilling Operations</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage and track daily rig activity logs</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] active:scale-[0.98] transition-all"
                >
                    <Plus className="h-5 w-5" />
                    New Entry
                </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl p-5 border border-slate-800/60 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <TrendingUp className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total Meters</p>
                            <h3 className="text-2xl font-bold text-white">{summaryStats.meters} <span className="text-sm font-medium text-slate-500">m</span></h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl p-5 border border-slate-800/60 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <Clock className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total NPT</p>
                            <h3 className="text-2xl font-bold text-white">{summaryStats.npt} <span className="text-sm font-medium text-slate-500">hrs</span></h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl p-5 border border-slate-800/60 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Fuel className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Fuel Consumed</p>
                            <h3 className="text-2xl font-bold text-white">{summaryStats.fuel} <span className="text-sm font-medium text-slate-500">L</span></h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl p-5 border border-slate-800/60 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Drill className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Active Rigs</p>
                            <h3 className="text-2xl font-bold text-white">{summaryStats.rigs}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl bg-gradient-to-r from-[#111827] to-[#0f172a] border border-slate-800/60 shadow-md">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search rig, project, supervisor..."
                        value={filter.search}
                        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                </div>
                <select value={filter.rigId} onChange={e => setFilter(f => ({ ...f, rigId: e.target.value }))} className={selectClass}>
                    <option value="">All Rigs</option>
                    {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={filter.projectId} onChange={e => setFilter(f => ({ ...f, projectId: e.target.value }))} className={selectClass}>
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filter.shift} onChange={e => setFilter(f => ({ ...f, shift: e.target.value }))} className={selectClass}>
                    <option value="">All Shifts</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0f172a] shadow-xl border border-slate-800/60 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-sm table-fixed min-w-[1200px]">
                        <thead className="bg-[#0f172a]/95 sticky top-0 z-10 backdrop-blur-md">
                            <tr className="border-b border-slate-700/60">
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[120px]">Date</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[150px]">Rig</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[150px]">Project</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[100px]">Shift</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[120px]">Meters</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[100px]">NPT (H)</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[130px]">Fuel (L)</th>
                                <th className="text-left px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[160px]">Supervisor</th>
                                <th className="text-center px-6 py-5 text-xs text-slate-400 uppercase tracking-widest font-semibold min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <tr key={i} className="border-b border-slate-800/40">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => (
                                            <td key={j} className="px-5 py-4"><div className="h-5 bg-slate-800 rounded-md animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length > 0 ? paginated.map(entry => (
                                <tr key={entry.id} className="border-b border-slate-800/40 hover:bg-slate-800/40 transition-all group">
                                    <td className="px-6 py-5 text-slate-300 font-medium whitespace-nowrap">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td className="px-6 py-5 text-white font-semibold">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0"></div>
                                            <span className="truncate">{entry.rig?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-300 font-medium truncate">{entry.project?.name}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${entry.shift === 'Day' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                            {entry.shift}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-left font-bold text-orange-400">{entry.metersDrilled.toLocaleString()} m</td>
                                    <td className="px-6 py-5 text-left font-medium text-slate-300">{entry.nptHours || 0} h</td>
                                    <td className="px-6 py-5 text-left font-semibold text-amber-200">{entry.fuelConsumed?.toLocaleString() || '—'} L</td>
                                    <td className="px-6 py-5 text-slate-300 font-medium truncate">{entry.supervisorName || '—'}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(entry)}
                                                className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                                                title="Edit Entry"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(entry)}
                                                className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                                                title="Delete Entry"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-slate-600">No entries found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/50">
                        <span className="text-xs text-slate-500">
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (page <= 3) pageNum = i + 1;
                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pageNum === page ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Entry Modal */}
            {showModal && <DrillingEntryModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchEntries(); }} />}

            {/* Edit Modal */}
            {editEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-white">Edit Entry</h2>
                            <button onClick={() => setEditEntry(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Date</label>
                                    <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Shift</label>
                                    <select value={editForm.shift} onChange={e => setEditForm(f => ({ ...f, shift: e.target.value }))} className={inputClass}>
                                        <option value="Day">Day</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Rig</label>
                                    <select value={editForm.rigId} onChange={e => setEditForm(f => ({ ...f, rigId: e.target.value }))} className={inputClass}>
                                        {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Project</label>
                                    <select value={editForm.projectId} onChange={e => setEditForm(f => ({ ...f, projectId: e.target.value }))} className={inputClass}>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Meters Drilled</label>
                                    <input type="number" step="0.1" value={editForm.metersDrilled} onChange={e => setEditForm(f => ({ ...f, metersDrilled: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>NPT Hours</label>
                                    <input type="number" step="0.1" value={editForm.nptHours} onChange={e => setEditForm(f => ({ ...f, nptHours: e.target.value }))} className={inputClass} />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Downtime Breakdown (hours)</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {['drillingHours', 'mechanicalDowntime', 'operationalDelay', 'weatherDowntime', 'safetyDowntime', 'waitingOnParts', 'standbyHours'].map(field => (
                                        <div key={field}>
                                            <label className={labelClass}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                                            <input type="number" step="0.1" value={editForm[field]} onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))} className={inputClass} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Additional Info</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Hole Depth</label>
                                        <input type="number" step="0.1" value={editForm.holeDepth} onChange={e => setEditForm(f => ({ ...f, holeDepth: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Fuel Consumed (L)</label>
                                        <input type="number" step="0.1" value={editForm.fuelConsumed} onChange={e => setEditForm(f => ({ ...f, fuelConsumed: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Consumables Cost ($)</label>
                                        <input type="number" step="0.01" value={editForm.consumablesCost} onChange={e => setEditForm(f => ({ ...f, consumablesCost: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Supervisor</label>
                                        <input type="text" value={editForm.supervisorName} onChange={e => setEditForm(f => ({ ...f, supervisorName: e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className={labelClass}>Remarks</label>
                                    <textarea value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} className={inputClass + " resize-none"} rows={2} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
                            <button onClick={() => setEditEntry(null)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50">
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-500/15">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Delete Entry?</h2>
                        </div>
                        <p className="text-sm text-slate-400">
                            This will permanently delete the entry for <span className="text-white font-medium">{deleteTarget.rig?.name}</span> on{' '}
                            <span className="text-white font-medium">{new Date(deleteTarget.date).toLocaleDateString()}</span> ({deleteTarget.metersDrilled}m).
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium shadow-lg shadow-red-500/25 disabled:opacity-50">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
