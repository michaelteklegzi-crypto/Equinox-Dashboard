import React, { useState, useEffect } from 'react';
import { Users, Drill, FolderOpen, DollarSign, Plus, Edit2, Trash2, Save, X, Check, Ban } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

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
                <p className="text-sm text-slate-500 mt-1">Manage rig resources and settings</p>
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
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Driller', isActive: true });
    const { showToast } = useToast();

    const fetchUsers = () => {
        axios.get('/api/users', { withCredentials: true })
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSort = (role) => {
        // Implement simple client-side sort if needed, or rely on API
    };

    const handleCreate = () => {
        setForm({ name: '', email: '', password: '', role: 'Driller', isActive: true });
        setIsEditing(false);
        setSelectedId(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setForm({
            name: user.name,
            email: user.email,
            password: '', // Leave empty to keep unchanged
            role: user.role,
            isActive: user.isActive !== false
        });
        setIsEditing(true);
        setSelectedId(user.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`/api/users/${id}`, { withCredentials: true });
            showToast('User deleted successfully', 'success');
            fetchUsers();
        } catch (err) {
            showToast('Failed to delete user: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                await axios.put(`/api/users/${selectedId}`, form, { withCredentials: true });
                showToast(`User "${form.name}" updated successfully`, 'success');
            } else {
                await axios.post('/api/auth/register', form, { withCredentials: true });
                showToast(`User "${form.name}" created successfully`, 'success');
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            showToast(`Failed to ${isEditing ? 'update' : 'create'} user: ` + (err.response?.data?.error || err.message), 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder-slate-500";

    const roleBadge = (role) => {
        const colors = {
            Admin: 'bg-red-500/15 text-red-400',
            Supervisor: 'bg-blue-500/15 text-blue-400',
            Driller: 'bg-orange-500/15 text-orange-400',
            Viewer: 'bg-slate-500/15 text-slate-400',
        };
        return colors[role] || colors.Viewer;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" /> Add User
                </button>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit User" : "New User"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Full Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Email *</label>
                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} required placeholder="john@equinox.com" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">{isEditing ? "New Password (Leave empty to keep)" : "Password *"}</label>
                            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass} required={!isEditing} placeholder={isEditing ? "••••••••" : "Min 6 chars"} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Role *</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputClass}>
                                <option value="Driller">Driller</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Admin">Admin</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                        {isEditing && (
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500/50" />
                                    Account Active
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50">
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <div className="p-4 border-b border-slate-800/50">
                    <h3 className="text-sm font-semibold text-slate-300">Users ({users.length})</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Name</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Email</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Role</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [1, 2, 3].map(i => (
                            <tr key={i} className="border-b border-slate-800/30">
                                {[1, 2, 3, 4, 5].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>)}
                            </tr>
                        )) : users.map(u => (
                            <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 group">
                                <td className="px-5 py-4 text-white font-medium">{u.name}</td>
                                <td className="px-5 py-4 text-slate-400">{u.email}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>{u.role}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                        }`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============ RIG MANAGEMENT ============
function RigManagement() {
    const [rigs, setRigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'RC', site: '', operationalCapacity: '', status: 'Active' });
    const { showToast } = useToast();

    const fetchRigs = () => {
        axios.get('/api/rigs', { withCredentials: true })
            .then(res => setRigs(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchRigs(); }, []);

    const handleCreate = () => {
        setForm({ name: '', type: 'RC', site: '', operationalCapacity: '', status: 'Active' });
        setIsEditing(false);
        setSelectedId(null);
        setShowModal(true);
    };

    const handleEdit = (rig) => {
        setForm({
            name: rig.name,
            type: rig.type,
            site: rig.site || '',
            operationalCapacity: rig.operationalCapacity || '',
            status: rig.status
        });
        setIsEditing(true);
        setSelectedId(rig.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this rig?")) return;
        // Check if rig has entries? API might block it.
        try {
            // Assuming DELETE endpoint exists or we add it? 
            // Currently rigs.routes.js does NOT have delete.
            // Let's assume we implement it or just rely on status='Archived'.
            // For now, let's just use status change to "Maintenance" or "Inactive" via Edit.
            // But if user wants delete button?
            // Let's SKIP delete for Rigs to avoid data integrity issues, only Edit.
        } catch (err) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, operationalCapacity: form.operationalCapacity ? parseFloat(form.operationalCapacity) : null };
            if (isEditing) {
                await axios.put(`/api/rigs/${selectedId}`, payload, { withCredentials: true });
                showToast(`Rig "${form.name}" updated`, 'success');
            } else {
                await axios.post('/api/rigs', payload, { withCredentials: true });
                showToast(`Rig "${form.name}" created`, 'success');
            }
            setShowModal(false);
            fetchRigs();
        } catch (err) {
            showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder-slate-500";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" /> Add Rig
                </button>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit Rig" : "New Rig"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                                <option value="Active">Active</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit"
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                            <Save className="h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Create Rig'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Name</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Type</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Site</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Entries</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rigs.map(r => (
                            <tr key={r.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 group">
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
                                <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
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
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ name: '', clientName: '', location: '', contractedRate: '', status: 'Active' });
    const { showToast } = useToast();

    const fetchProjects = () => {
        axios.get('/api/projects', { withCredentials: true }).then(res => setProjects(res.data)).finally(() => setLoading(false));
    };
    useEffect(() => { fetchProjects(); }, []);

    const handleCreate = () => {
        setForm({ name: '', clientName: '', location: '', contractedRate: '', status: 'Active' });
        setIsEditing(false);
        setSelectedId(null);
        setShowModal(true);
    };

    const handleEdit = (project) => {
        setForm({
            name: project.name,
            clientName: project.clientName || '',
            location: project.location || '',
            contractedRate: project.contractedRate || '',
            status: project.status
        });
        setIsEditing(true);
        setSelectedId(project.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            // Need delete endpoint
        } catch (err) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, contractedRate: form.contractedRate ? parseFloat(form.contractedRate) : null };
            if (isEditing) {
                await axios.put(`/api/projects/${selectedId}`, payload, { withCredentials: true });
                showToast(`Project "${form.name}" updated`, 'success');
            } else {
                await axios.post('/api/projects', payload, { withCredentials: true });
                showToast(`Project "${form.name}" created`, 'success');
            }
            setShowModal(false);
            fetchProjects();
        } catch (err) {
            showToast('Error: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder-slate-500";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" /> Add Project
                </button>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit Project" : "New Project"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="OnHold">On Hold</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                            <Save className="h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800/50">
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Project</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Client</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Location</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Rate</th>
                            <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Status</th>
                            <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 group">
                                <td className="px-5 py-4 text-white font-medium">{p.name}</td>
                                <td className="px-5 py-4 text-slate-400">{p.clientName || '—'}</td>
                                <td className="px-5 py-4 text-slate-400">{p.location || '—'}</td>
                                <td className="px-5 py-4 text-right text-orange-400 font-medium">{p.contractedRate ? `$${p.contractedRate}/m` : '—'}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'
                                        }`}>{p.status}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
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
    const [params, setParams] = useState([]);
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', scope: 'global', rigId: '', projectId: '', costPerMeter: '', fuelCostFactor: '0', consumablesFactor: '0', laborCostFactor: '0' });
    const { showToast } = useToast();

    const fetchAll = () => {
        Promise.all([
            axios.get('/api/financial-params', { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([fp, r, p]) => {
            setParams(fp.data);
            setRigs(r.data);
            setProjects(p.data);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = () => {
        setForm({ name: '', scope: 'global', rigId: '', projectId: '', costPerMeter: '', fuelCostFactor: '0', consumablesFactor: '0', laborCostFactor: '0' });
        setIsEditing(false);
        setSelectedId(null);
        setShowModal(true);
    };

    const handleEdit = (param) => {
        let scope = 'global';
        if (param.rigId) scope = 'rig';
        if (param.projectId) scope = 'project';

        setForm({
            name: param.name || '',
            scope,
            rigId: param.rigId || '',
            projectId: param.projectId || '',
            costPerMeter: param.costPerMeter,
            fuelCostFactor: param.fuelCostFactor,
            consumablesFactor: param.consumablesFactor,
            laborCostFactor: param.laborCostFactor
        });
        setIsEditing(true);
        setSelectedId(param.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this financial parameter?")) return;
        try {
            await axios.delete(`/api/financial-params/${id}`, { withCredentials: true });
            showToast('Parameter deleted', 'success');
            fetchAll();
        } catch (err) {
            showToast('Failed to delete: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Sum of factors = Cost Per Meter
        const total = parseFloat(form.costPerMeter) || 0;
        const sum = (parseFloat(form.fuelCostFactor) || 0) + (parseFloat(form.consumablesFactor) || 0) + (parseFloat(form.laborCostFactor) || 0);

        // Allow small floating point margin or strict? User said "equal".
        if (Math.abs(total - sum) > 0.01) {
            alert(`Validation Error: The sum of factors (${sum.toFixed(2)}) must equal the Cost Per Meter (${total.toFixed(2)}).`);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name,
                costPerMeter: parseFloat(form.costPerMeter) || 0,
                fuelCostFactor: parseFloat(form.fuelCostFactor) || 0,
                consumablesFactor: parseFloat(form.consumablesFactor) || 0,
                laborCostFactor: parseFloat(form.laborCostFactor) || 0,
            };
            if (!isEditing) {
                if (form.scope === 'rig' && form.rigId) payload.rigId = form.rigId;
                if (form.scope === 'project' && form.projectId) payload.projectId = form.projectId;
            } else {
                if (form.scope === 'rig') { payload.rigId = form.rigId; payload.projectId = null; }
                else if (form.scope === 'project') { payload.projectId = form.projectId; payload.rigId = null; }
                else { payload.rigId = null; payload.projectId = null; }
            }

            if (isEditing) {
                await axios.put(`/api/financial-params/${selectedId}`, payload, { withCredentials: true });
                showToast('Parameter updated', 'success');
            } else {
                await axios.post('/api/financial-params', payload, { withCredentials: true });
                showToast('Parameter created', 'success');
            }
            setShowModal(false);
            fetchAll();
        } catch (err) { showToast('Failed to save parameter: ' + (err.response?.data?.error || err.message), 'error'); }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" /> Add Parameter
                </button>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit Parameter" : "New Parameter"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Financial Parameter</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 uppercase mb-1">Parameter Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} required placeholder="e.g. Q1 Standard Rates" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 uppercase mb-1">Scope *</label>
                            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className={inputClass}>
                                <option value="global">Global</option>
                                <option value="rig">Per Rig</option>
                                <option value="project">Per Project</option>
                            </select>
                        </div>
                        {form.scope === 'rig' && (
                            <div className="md:col-span-2">
                                <label className="block text-xs text-slate-500 uppercase mb-1">Rig</label>
                                <select value={form.rigId} onChange={e => setForm(f => ({ ...f, rigId: e.target.value }))} className={inputClass}>
                                    <option value="">Select</option>
                                    {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        )}
                        {form.scope === 'project' && (
                            <div className="md:col-span-2">
                                <label className="block text-xs text-slate-500 uppercase mb-1">Project</label>
                                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className={inputClass}>
                                    <option value="">Select</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Cost/Meter ($)</label>
                            <input type="number" step="0.01" value={form.costPerMeter} onChange={e => setForm(f => ({ ...f, costPerMeter: e.target.value }))} className={inputClass} placeholder="e.g. 100.00" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Fuel Component ($)</label>
                            <input type="number" step="0.01" value={form.fuelCostFactor} onChange={e => setForm(f => ({ ...f, fuelCostFactor: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Consumables ($)</label>
                            <input type="number" step="0.01" value={form.consumablesFactor} onChange={e => setForm(f => ({ ...f, consumablesFactor: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Labor Component ($)</label>
                            <input type="number" step="0.01" value={form.laborCostFactor} onChange={e => setForm(f => ({ ...f, laborCostFactor: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50">
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Parameter')}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                <div className="p-4 border-b border-slate-800/50">
                    <h3 className="text-sm font-semibold text-slate-300">Financial Parameters ({params.length})</h3>
                </div>
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-10 bg-slate-800 rounded animate-pulse" />)}
                    </div>
                ) : params.length === 0 ? (
                    <div className="text-center py-12">
                        <DollarSign className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No financial parameters configured yet</p>
                        <p className="text-xs text-slate-600 mt-1">Add global or scoped parameters above</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800/50">
                                <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase font-medium">Scope</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Cost/Meter</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Fuel Factor</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Consumables</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Labor</th>
                                <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {params.map(p => (
                                <tr key={p.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 group">
                                    <td className="px-5 py-4">
                                        <span className="text-white font-medium">{p.rig?.name || p.project?.name || 'Global'}</span>
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${!p.rigId && !p.projectId ? 'bg-emerald-500/15 text-emerald-400' :
                                            p.rigId ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                                            }`}>{!p.rigId && !p.projectId ? 'Global' : p.rigId ? 'Rig' : 'Project'}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right text-orange-400 font-semibold">${p.costPerMeter}</td>
                                    <td className="px-5 py-4 text-right text-slate-300">${p.fuelCostFactor}/L</td>
                                    <td className="px-5 py-4 text-right text-slate-300">×{p.consumablesFactor}</td>
                                    <td className="px-5 py-4 text-right text-slate-300">×{p.laborCostFactor}</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

