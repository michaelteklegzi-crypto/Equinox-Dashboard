import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Plus, FileSpreadsheet, Drill } from 'lucide-react'; // Drill might need check, if not available use Activity
import DailyReportForm from '../components/forms/DailyReportForm';
import { useToast } from '../context/ToastContext';

export default function DrillingReports() {
    const [reports, setReports] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get('/api/reports/daily');
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
            // Don't show toast on initial load if empty
        }
    };

    const handleSuccess = () => {
        setShowForm(false);
        fetchReports();
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Drilling Operations</h1>
                    <p className="text-slate-500 mt-2">Manage daily drilling logs and production metrics.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${showForm
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                        }`}
                >
                    {showForm ? 'Cancel Entry' : (
                        <>
                            <Plus className="h-4 w-4" />
                            New Entry
                        </>
                    )}
                </button>
            </header>

            {/* Entry Form Section */}
            {showForm && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <DailyReportForm onSuccess={handleSuccess} />
                </div>
            )}

            {/* Recent Reports List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                        Recent Reports
                    </h3>
                </div>

                {reports.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p>No drilling reports found. Start by adding a new entry.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Rig</th>
                                    <th className="px-6 py-3 font-medium">Location</th>
                                    <th className="px-6 py-3 font-medium text-right">Start (m)</th>
                                    <th className="px-6 py-3 font-medium text-right">End (m)</th>
                                    <th className="px-6 py-3 font-medium text-right">Total (m)</th>
                                    <th className="px-6 py-3 font-medium">Reporter</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/drilling/${report.id}`}>
                                        <td className="px-6 py-4 font-medium text-blue-600 hover:text-blue-800">
                                            {new Date(report.reportDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{report.rigId}</td>
                                        <td className="px-6 py-4 text-slate-600">{report.location}</td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600">{report.startDepth.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600">{report.endDepth.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-orange-600 font-mono">
                                            {report.totalDrilled.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {report.createdBy?.name || 'Unknown'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
