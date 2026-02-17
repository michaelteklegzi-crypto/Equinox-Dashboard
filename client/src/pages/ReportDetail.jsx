import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, Ruler, Activity, Clock, Users, FileText, Download } from 'lucide-react';
import ShiftReportForm from '../components/forms/ShiftReportForm';
import DowntimeForm from '../components/forms/DowntimeForm';
import { downloadDrillingPDF } from '../utils/pdfExport';
// import { useToast } from '../context/ToastContext';

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'downtime'

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            // Need to create this endpoint or modify existing to get single
            const res = await axios.get(`/api/reports/daily/${id}`);
            setReport(res.data);
        } catch (error) {
            console.error('Failed to fetch report details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (report) {
            downloadDrillingPDF(report);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!report) return <div className="p-8 text-center">Report not found</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/drilling')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Daily Report: {new Date(report.reportDate).toLocaleDateString()}
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                {report.status}
                            </span>
                        </h1>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" /> {report.location || 'No Location'}
                            <span className="mx-2">•</span>
                            <Activity className="h-4 w-4" /> {report.rigId}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                    <Download className="h-4 w-4" />
                    Export PDF
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Total Drilled</span>
                        <Ruler className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{report.totalDrilled.toFixed(2)}m</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {report.startDepth}m → {report.endDepth}m
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Shifts Logged</span>
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{report.shiftReports?.length || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Day & Night capabilities</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Downtime Events</span>
                        <Clock className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{report.downtimeLogs?.length || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Total Impact: {report.downtimeLogs?.reduce((acc, log) => acc + (log.durationHours || 0), 0).toFixed(1)} hrs</div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'shifts'
                            ? 'border-orange-500 text-orange-600 bg-orange-50'
                            : 'border-transparent text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Shift Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('downtime')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'downtime'
                            ? 'border-orange-500 text-orange-600 bg-orange-50'
                            : 'border-transparent text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Downtime Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('depths')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2 ${activeTab === 'depths'
                            ? 'border-orange-500 text-orange-600 bg-orange-50'
                            : 'border-transparent text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Drilling Depths
                    </button>
                </div>

                <div className="p-6 bg-slate-50/50 min-h-[400px]">
                    {activeTab === 'shifts' && (
                        <div className="space-y-6">
                            <ShiftReportForm dailyReportId={id} onSuccess={fetchReport} />

                            <div className="space-y-4">
                                {report.shiftReports?.map(shift => (
                                    <div key={shift.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${shift.shiftType === 'Night' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {shift.shiftType.toUpperCase()}
                                                </span>
                                                <span className="text-slate-900 font-medium">{new Date(shift.date).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">Sup: {shift.supervisorName}</span>
                                        </div>
                                        <p className="text-sm text-slate-600"><span className="font-semibold">Crew:</span> {shift.crewAssigned}</p>
                                        {shift.notes && <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded">{shift.notes}</p>}
                                    </div>
                                ))}
                                {(!report.shiftReports || report.shiftReports.length === 0) && (
                                    <p className="text-center text-slate-500 italic">No shifts recorded yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'downtime' && (
                        <div className="space-y-6">
                            <DowntimeForm dailyReportId={id} onSuccess={fetchReport} />

                            <div className="space-y-4">
                                {report.downtimeLogs?.map(log => (
                                    <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                                    {log.category}
                                                </span>
                                                <span className="text-slate-900 font-medium">
                                                    {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                                                </span>
                                            </div>
                                            <span className="font-mono font-bold text-slate-700">{log.durationHours?.toFixed(1)} hrs</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{log.description}</p>
                                        {log.equipmentId && <p className="text-xs text-slate-400 mt-1">Eq: {log.equipmentId}</p>}
                                    </div>
                                ))}
                                {(!report.downtimeLogs || report.downtimeLogs.length === 0) && (
                                    <p className="text-center text-slate-500 italic">No downtime recorded.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'depths' && (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                            <p>Detailed depth tracking UI coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
