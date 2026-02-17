import React, { useState } from 'react';
import axios from 'axios';
import { Clock, Timer, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function DowntimeForm({ onSuccess, dailyReportId }) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        category: 'Mechanical',
        startTime: '',
        endTime: '',
        description: '',
        equipmentId: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post('/api/maintenance/downtime', {
                ...formData,
                dailyReportId: dailyReportId || null, // Optional link
            });

            showToast('Downtime logged successfully', 'success');

            setFormData({
                category: 'Mechanical',
                startTime: '',
                endTime: '',
                description: '',
                equipmentId: ''
            });

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error logging downtime:', error);
            showToast('Failed to log downtime', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Clock className="h-5 w-5" />
                </div>
                Log Downtime
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none"
                        >
                            <option value="Mechanical">Mechanical</option>
                            <option value="Operational">Operational</option>
                            <option value="Weather">Weather</option>
                            <option value="WaitingOnParts">Waiting on Parts</option>
                            <option value="Safety">Safety Stoppage</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Affected (Optional)</label>
                        <input
                            type="text"
                            name="equipmentId"
                            value={formData.equipmentId}
                            onChange={handleChange}
                            placeholder="e.g. Pump 2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        required
                        placeholder="Details of the downtime..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none"
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-4 focus:ring-yellow-100 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <Timer className="h-5 w-5" />
                                Log Downtime
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
