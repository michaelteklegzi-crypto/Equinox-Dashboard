import React, { useState } from 'react';
import axios from 'axios';
import { Save, Wrench, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function MaintenanceForm({ onSuccess }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        equipmentName: '',
        maintenanceType: 'Preventive',
        description: '',
        cost: '',
        hoursSpent: '',
        datePerformed: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            cost: parseFloat(formData.cost) || 0,
            hoursSpent: parseFloat(formData.hoursSpent) || 0,
            performedBy: user?.name,
            createdById: user?.id
        };

        try {
            await axios.post('/api/maintenance', payload);
            showToast('Maintenance log saved successfully', 'success');
            resetForm();
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error saving maintenance log:', error);

            // Offline Handling
            if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                const offlineLogs = JSON.parse(localStorage.getItem('offline_maintenance_logs') || '[]');
                offlineLogs.push({ ...payload, offlineId: Date.now() });
                localStorage.setItem('offline_maintenance_logs', JSON.stringify(offlineLogs));

                showToast('Offline: Log saved locally. Will sync when online.', 'info');
                resetForm();
                if (onSuccess) onSuccess(); // Treat as success for UI
            } else {
                showToast('Failed to save log: ' + (error.response?.data?.error || error.message), 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            equipmentName: '',
            maintenanceType: 'Preventive',
            description: '',
            cost: '',
            hoursSpent: '',
            datePerformed: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Wrench className="h-5 w-5" />
                </div>
                Log Maintenance
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name / ID</label>
                        <input
                            type="text"
                            name="equipmentName"
                            value={formData.equipmentName}
                            onChange={handleChange}
                            placeholder="e.g. Mud Pump 1"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Performed</label>
                        <input
                            type="date"
                            name="datePerformed"
                            value={formData.datePerformed}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Maintenance Type</label>
                        <select
                            name="maintenanceType"
                            value={formData.maintenanceType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        >
                            <option value="Preventive">Preventive</option>
                            <option value="Corrective">Corrective</option>
                            <option value="Inspection">Inspection</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hours Spent</label>
                        <input
                            type="number"
                            step="0.5"
                            name="hoursSpent"
                            value={formData.hoursSpent}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <CheckCircle2 className="h-5 w-5" />
                                Save Log
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
