import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function DailyReportForm({ onSuccess }) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        rigId: '',
        location: '',
        startDepth: '',
        endDepth: ''
    });

    const [totalDrilled, setTotalDrilled] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate total drilled whenever depths change
    useEffect(() => {
        const start = parseFloat(formData.startDepth) || 0;
        const end = parseFloat(formData.endDepth) || 0;
        setTotalDrilled(Math.max(0, end - start).toFixed(2));
    }, [formData.startDepth, formData.endDepth]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (parseFloat(formData.endDepth) < parseFloat(formData.startDepth)) {
            showToast('End depth cannot be less than start depth', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post('/api/reports/daily', {
                ...formData,
                startDepth: parseFloat(formData.startDepth),
                endDepth: parseFloat(formData.endDepth),
                createdById: user?.id
            });

            showToast('Daily Drilling Report saved successfully', 'success');

            // Reset form or notify parent
            setFormData({
                reportDate: new Date().toISOString().split('T')[0],
                rigId: '',
                location: '',
                startDepth: formData.endDepth, // Auto-set next start depth to current end depth
                endDepth: ''
            });

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error saving report:', error);
            showToast(error.response?.data?.error || 'Failed to save report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Save className="h-5 w-5" />
                </div>
                New Daily Drilling Report
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date & Rig */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Report Date</label>
                        <input
                            type="date"
                            name="reportDate"
                            value={formData.reportDate}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rig ID / Name</label>
                        <select
                            name="rigId"
                            value={formData.rigId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        >
                            <option value="">Select Rig</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={`Rig ${i + 1}`}>
                                    Rig {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location / Well Name</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Block 4, Well X-12"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>

                    {/* Depths */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Depth (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="startDepth"
                            value={formData.startDepth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Depth (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="endDepth"
                            value={formData.endDepth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Calculation Display */}
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calculator className="h-5 w-5" />
                        <span className="font-medium">Total Drilled This Report:</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {totalDrilled} <span className="text-sm font-normal text-slate-500">meters</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-100 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <CheckCircle2 className="h-5 w-5" />
                                Submit Report
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
