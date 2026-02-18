import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Drill, Calendar, MapPin } from 'lucide-react';
import axios from 'axios';
import DrillingEntryModal from '../components/DrillingEntryModal';

export default function DrillingOperations() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ rigId: '', projectId: '', shift: '' });
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);

    const fetchEntries = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.rigId) params.append('rigId', filter.rigId);
            if (filter.projectId) params.append('projectId', filter.projectId);
            if (filter.shift) params.append('shift', filter.shift);
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

    useEffect(() => { fetchEntries(); }, [filter]);

    const selectClass = "px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Drilling Operations</h1>
                    <p className="text-sm text-slate-500 mt-1">All drilling entries across fleet</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25"
                >
                    <Plus className="h-4 w-4" />
                    New Entry
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-[#111827] border border-slate-800/50">
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
            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800/50">
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Date</th>
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Rig</th>
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Project</th>
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Shift</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Meters</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">NPT (hrs)</th>
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Supervisor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-slate-800/30">
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : entries.length > 0 ? entries.map(entry => (
                                <tr key={entry.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                                    <td className="px-5 py-4 text-slate-300">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="px-5 py-4 text-white font-medium">{entry.rig?.name}</td>
                                    <td className="px-5 py-4 text-slate-300">{entry.project?.name}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.shift === 'Day' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                            {entry.shift}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-orange-400">{entry.metersDrilled}m</td>
                                    <td className="px-5 py-4 text-right text-slate-400">{entry.nptHours}</td>
                                    <td className="px-5 py-4 text-slate-400">{entry.supervisorName || '—'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-slate-600">No entries found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <DrillingEntryModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchEntries(); }} />}
        </div>
    );
}
