import React, { useState } from 'react';
import axios from 'axios';
import { Save, Users, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function ShiftReportForm({ dailyReportId, onSuccess }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        shiftType: 'Day', // 'Day' | 'Night'
        date: new Date().toISOString().split('T')[0],
        supervisorName: user?.name || '',
        crewAssigned: '',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post('/api/reports/shift', {
                ...formData,
                dailyReportId,
                createdById: user?.id
            });

            showToast('Shift report added successfully', 'success');

            setFormData({
                shiftType: 'Day',
                date: new Date().toISOString().split('T')[0],
                supervisorName: user?.name || '',
                crewAssigned: '',
                notes: ''
            });

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error saving shift report:', error);
            showToast('Failed to save shift report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                {formData.shiftType === 'Night' ? (
                    <Moon className="h-5 w-5 text-indigo-500" />
                ) : (
                    <Sun className="h-5 w-5 text-orange-500" />
                )}
                Add Shift Report
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Shift Type</label>
                        <select
                            name="shiftType"
                            value={formData.shiftType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        >
                            <option value="Day">Day Shift</option>
                            <option value="Night">Night Shift</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                        <input
                            type="text"
                            name="supervisorName"
                            value={formData.supervisorName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Crew Details</label>
                        <input
                            type="text"
                            name="crewAssigned"
                            value={formData.crewAssigned}
                            onChange={handleChange}
                            placeholder="e.g. Driller A, Derrickman B..."
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Operational highlights, issues, etc."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-100 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <Save className="h-4 w-4" />
                                Add Shift
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
