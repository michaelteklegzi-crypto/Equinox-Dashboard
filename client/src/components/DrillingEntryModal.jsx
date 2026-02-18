import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const DOWNTIME_CATEGORIES = [
    { value: '', label: 'None' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Operational', label: 'Operational' },
    { value: 'Weather', label: 'Weather' },
    { value: 'Safety', label: 'Safety' },
    { value: 'WaitingOnParts', label: 'Waiting on Parts' },
];

export default function DrillingEntryModal({ onClose, onSuccess }) {
    const [rigs, setRigs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        rigId: '',
        projectId: '',
        shift: 'Day',
        metersDrilled: '',
        nptHours: '0',
        downtimeCategory: '',
        fuelConsumed: '',
        consumablesCost: '',
        remarks: '',
        supervisorName: '',
    });

    useEffect(() => {
        Promise.all([
            axios.get('/api/rigs', { withCredentials: true }),
            axios.get('/api/projects', { withCredentials: true }),
        ]).then(([rigsRes, projRes]) => {
            setRigs(rigsRes.data);
            setProjects(projRes.data);
        }).catch(console.error);
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/drilling', form, { withCredentials: true });
            onSuccess();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 placeholder-slate-500";
    const labelClass = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111827] border border-slate-800/50 shadow-2xl m-4">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800/50 bg-[#111827] rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-white">New Drilling Entry</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Row 1: Date, Shift */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Date *</label>
                            <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Shift *</label>
                            <select name="shift" value={form.shift} onChange={handleChange} className={inputClass} required>
                                <option value="Day">Day</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Rig, Project */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Rig *</label>
                            <select name="rigId" value={form.rigId} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Rig</option>
                                {rigs.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Project *</label>
                            <select name="projectId" value={form.projectId} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Meters, NPT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Meters Drilled *</label>
                            <input type="number" step="0.1" name="metersDrilled" value={form.metersDrilled} onChange={handleChange} className={inputClass} placeholder="e.g. 45.5" required />
                        </div>
                        <div>
                            <label className={labelClass}>NPT Hours</label>
                            <input type="number" step="0.1" name="nptHours" value={form.nptHours} onChange={handleChange} className={inputClass} placeholder="0" />
                        </div>
                    </div>

                    {/* Downtime Category */}
                    <div>
                        <label className={labelClass}>Downtime Category</label>
                        <select name="downtimeCategory" value={form.downtimeCategory} onChange={handleChange} className={inputClass}>
                            {DOWNTIME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    {/* Row 4: Fuel, Consumables */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Fuel Consumed (Liters)</label>
                            <input type="number" step="0.1" name="fuelConsumed" value={form.fuelConsumed} onChange={handleChange} className={inputClass} placeholder="e.g. 250" />
                        </div>
                        <div>
                            <label className={labelClass}>Consumables Cost ($)</label>
                            <input type="number" step="0.01" name="consumablesCost" value={form.consumablesCost} onChange={handleChange} className={inputClass} placeholder="e.g. 1500" />
                        </div>
                    </div>

                    {/* Supervisor */}
                    <div>
                        <label className={labelClass}>Supervisor Name</label>
                        <input type="text" name="supervisorName" value={form.supervisorName} onChange={handleChange} className={inputClass} placeholder="Enter supervisor name" />
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className={labelClass}>Remarks</label>
                        <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className={inputClass} placeholder="Any notes..." />
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
