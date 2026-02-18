import React, { useState, useEffect } from 'react';
import { Users, Drill, FolderOpen, DollarSign, Plus, Edit2, Trash2, Save, X, Check, Ban } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TABS = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'rigs', label: 'Rigs', icon: Drill },
    { key: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'financial', label: 'Financial', icon: DollarSign },
];

export default function Admin() {
    const { user } = useAuth();
    const [tab, setTab] = useState('users');

    if (user?.role !== 'Admin') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Ban className="h-16 w-16 text-red-500/50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Access Denied</h2>
                    <p className="text-slate-500 mt-2">Admin privileges required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-slate-500 mt-1">Manage fleet resources and settings</p>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-slate-800/30 w-fit">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-orange-500/15 text-orange-400' : 'text-slate-500 hover:text-slate-300'
                            }`}>
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'users' && <UserManagement />}
            {tab === 'rigs' && <RigManagement />}
            {tab === 'projects' && <ProjectManagement />}
            {tab === 'financial' && <FinancialSettings />}
        </div>
    );
}

// ============ USER MANAGEMENT ============
function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/users', { withCredentials: true })
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-300">Users ({users.length})</h3>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-800/50">
                        <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Name</th>
                        <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Email</th>
                        <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Role</th>
                        <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? [1, 2, 3].map(i => (
                        <tr key={i} className="border-b border-slate-800/30">
                            {[1, 2, 3, 4].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>)}
                        </tr>
                    )) : users.map(u => (
                        <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                            <td className="px-5 py-4 text-white font-medium">{u.name}</td>
                            <td className="px-5 py-4 text-slate-400">{u.email}</td>
                            <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'Admin' ? 'bg-red-500/15 text-red-400' :
                                        u.role === 'Supervisor' ? 'bg-blue-500/15 text-blue-400' :
                                            'bg-slate-500/15 text-slate-400'
                                    }`}>{u.role}</span>
                            </td>
                            <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                    }`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============ RIG MANAGEMENT ============
function RigManagement() {
    const [rigs, setRigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'RC', site: '', operationalCapacity: '', status: 'Active' });

    const fetchRigs = () => {
        axios.get('/api/rigs', { withCredentials: true })
            .then(res => setRigs(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchRigs(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/rigs', form, { withCredentials: true });
            setShowForm(false);
            setForm({ name: '', type: 'RC', site: '', operationalCapacity: '', status: 'Active' });
            fetchRigs();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const inputClass = "w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25">
                    <Plus className="h-4 w-4" /> Add Rig
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl bg-[#111827] border border-slate-800/50 p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required placeholder="Rig 01" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Type *</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                                <option value="RC">RC</option>
                                <option value="Diamond">Diamond</option>
                                <option value="GC">GC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Site</label>
                            <input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} className={inputClass} placeholder="North Field" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Capacity (m/day)</label>
                            <input type="number" value={form.operationalCapacity} onChange={e => setForm(f => ({ ...f, operationalCapacity: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <button type="submit" className="px-6 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold">Save Rig</button>
                </form>
            )}

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Name</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Type</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Site</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Entries</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rigs.map(r => (
                            <tr key={r.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                                <td className="px-5 py-4 text-white font-medium">{r.name}</td>
                                <td className="px-5 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">{r.type}</span></td>
                                <td className="px-5 py-4 text-slate-400">{r.site || '—'}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' :
                                            r.status === 'Maintenance' ? 'bg-amber-500/15 text-amber-400' :
                                                'bg-red-500/15 text-red-400'
                                        }`}>{r.status}</span>
                                </td>
                                <td className="px-5 py-4 text-right text-slate-400">{r._count?.drillingEntries || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============ PROJECT MANAGEMENT ============
function ProjectManagement() {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', clientName: '', location: '', contractedRate: '', status: 'Active' });

    const fetchProjects = () => {
        axios.get('/api/projects', { withCredentials: true }).then(res => setProjects(res.data));
    };
    useEffect(() => { fetchProjects(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/projects', form, { withCredentials: true });
            setShowForm(false);
            setForm({ name: '', clientName: '', location: '', contractedRate: '', status: 'Active' });
            fetchProjects();
        } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    };

    const inputClass = "w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25">
                    <Plus className="h-4 w-4" /> Add Project
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl bg-[#111827] border border-slate-800/50 p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Client</label>
                            <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Location</label>
                            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Rate ($/m)</label>
                            <input type="number" step="0.01" value={form.contractedRate} onChange={e => setForm(f => ({ ...f, contractedRate: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <button type="submit" className="px-6 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold">Save Project</button>
                </form>
            )}

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Project</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Client</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Location</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Rate</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                                <td className="px-5 py-4 text-white font-medium">{p.name}</td>
                                <td className="px-5 py-4 text-slate-400">{p.clientName || '—'}</td>
                                <td className="px-5 py-4 text-slate-400">{p.location || '—'}</td>
                                <td className="px-5 py-4 text-right text-orange-400 font-medium">{p.contractedRate ? `$${p.contractedRate}/m` : '—'}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'
                                        }`}>{p.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============ FINANCIAL SETTINGS ============
function FinancialSettings() {
    return (
        <div className="text-center py-20">
            <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">Financial Parameters</h3>
            <p className="text-sm text-slate-600 mt-2">Configure cost per meter, fuel rates, and labor factors.</p>
            <p className="text-xs text-slate-700 mt-1">Coming in Phase 4</p>
        </div>
    );
}
