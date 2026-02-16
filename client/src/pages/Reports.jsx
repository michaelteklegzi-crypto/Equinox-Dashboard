import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Calendar, Users, FileText, Download, Printer, TrendingUp, AlertCircle, CheckCircle2, Clock, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ExportModal from '../components/ExportModal';
import { exportPDFAsBase64, downloadPDF } from '../utils/pdfExport';

export default function Reports() {
    const [actions, setActions] = useState([]);
    const [dateRange, setDateRange] = useState('all');
    const [loading, setLoading] = useState(true);
    const [groupedByPerson, setGroupedByPerson] = useState({});
    const [selectedPerson, setSelectedPerson] = useState('all');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/actions', {
                params: { window: dateRange === 'all' ? undefined : dateRange }
            });
            setActions(response.data);
            groupActionsByPerson(response.data);
        } catch (error) {
            console.error('Failed to fetch actions for reports', error);
            showToast('Failed to load report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const groupActionsByPerson = (actionsList) => {
        const grouped = actionsList.reduce((acc, action) => {
            const personName = action.responsiblePerson?.name || 'Unassigned';
            if (!acc[personName]) {
                acc[personName] = [];
            }
            acc[personName].push(action);
            return acc;
        }, {});
        setGroupedByPerson(grouped);
    };

    // Calculate summary statistics
    const stats = {
        total: actions.length,
        byStatus: {
            'Not Started': actions.filter(a => a.status === 'Not Started').length,
            'Ongoing': actions.filter(a => a.status === 'Ongoing').length,
            'Completed': actions.filter(a => a.status === 'Completed').length,
            'Delayed': actions.filter(a => a.status === 'Delayed').length,
            'Paused': actions.filter(a => a.status === 'Paused').length,
        },
        byPriority: {
            'High': actions.filter(a => a.priority === 'High').length,
            'Medium': actions.filter(a => a.priority === 'Medium').length,
            'Low': actions.filter(a => a.priority === 'Low').length,
        },
        byCategory: {
            'Operational': actions.filter(a => a.category === 'Operational').length,
            'Strategic': actions.filter(a => a.category === 'Strategic').length,
            'Admin': actions.filter(a => a.category === 'Admin').length,
        }
    };

    const handlePrint = () => {
        window.print();
        showToast('Print dialog opened', 'info');
    };

    const handleDownloadPDF = () => {
        if (selectedPerson === 'all') {
            showToast('Please select a specific person to export', 'warning');
            return;
        }

        const personActions = groupedByPerson[selectedPerson];
        if (!personActions || personActions.length === 0) {
            showToast('No actions found for this person', 'error');
            return;
        }

        downloadPDF(selectedPerson, personActions);
        showToast(`PDF downloaded for ${selectedPerson}`, 'success');
    };

    const handleOpenEmailModal = () => {
        if (selectedPerson === 'all') {
            showToast('Please select a specific person to export', 'warning');
            return;
        }

        const personActions = groupedByPerson[selectedPerson];
        if (!personActions || personActions.length === 0) {
            showToast('No actions found for this person', 'error');
            return;
        }

        setIsExportModalOpen(true);
    };

    const handleExportEmail = async (recipientEmail, message) => {
        try {
            const personActions = groupedByPerson[selectedPerson];

            // Generate PDF as base64
            const pdfBase64 = exportPDFAsBase64(selectedPerson, personActions);

            // Send to backend
            const response = await axios.post('/api/export/email', {
                pdfBase64,
                recipientEmail,
                personName: selectedPerson,
                message
            });

            if (response.data.success) {
                showToast(`Email sent successfully to ${recipientEmail}`, 'success');
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error('Export email error:', error);
            showToast(error.response?.data?.error || 'Failed to send email', 'error');
            throw error;
        }
    };

    const handleExportByPerson = () => {
        // Generate a text report grouped by person
        let report = '=== ACTION ITEMS BY RESPONSIBLE PERSON ===\n\n';
        report += `Generated: ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}\n\n`;

        Object.entries(groupedByPerson).forEach(([person, personActions]) => {
            report += `\n${'='.repeat(60)}\n`;
            report += `${person.toUpperCase()} (${personActions.length} items)\n`;
            report += `${'='.repeat(60)}\n\n`;

            personActions.forEach((action, index) => {
                report += `${index + 1}. ${action.title}\n`;
                report += `   Status: ${action.status} | Priority: ${action.priority} | Category: ${action.category}\n`;
                if (action.description) {
                    report += `   Details: ${action.description}\n`;
                }
                report += `   Meeting Date: ${new Date(action.meetingDate).toLocaleDateString()}\n`;
                if (action.targetCompletionDate) {
                    report += `   Target Date: ${new Date(action.targetCompletionDate).toLocaleDateString()}\n`;
                }
                report += '\n';
            });
        });

        // Copy to clipboard
        navigator.clipboard.writeText(report).then(() => {
            showToast('Report copied to clipboard! You can paste it into an email.', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy report', 'error');
        });
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header - Hidden when printing */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-600 mt-1">Summary of action items and exportable reports</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">All Time</option>
                        <option value="14days">Last 14 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                    </select>

                    <select
                        value={selectedPerson}
                        onChange={(e) => setSelectedPerson(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">All People</option>
                        {Object.keys(groupedByPerson).map(person => (
                            <option key={person} value={person}>{person}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleOpenEmailModal}
                        disabled={selectedPerson === 'all'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Mail className="h-4 w-4" />
                        Email PDF
                    </button>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={selectedPerson === 'all'}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </button>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                </div>
            </div>

            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Action Items Report</h1>
                <p className="text-slate-600">Generated on {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>

            {/* Summary Statistics */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    Summary Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Actions"
                        value={stats.total}
                        icon={FileText}
                        color="text-slate-500"
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.byStatus['Ongoing']}
                        icon={TrendingUp}
                        color="text-blue-500"
                        subtext={`${((stats.byStatus['Ongoing'] / stats.total) * 100 || 0).toFixed(0)}% of total`}
                    />
                    <StatCard
                        title="Completed"
                        value={stats.byStatus['Completed']}
                        icon={CheckCircle2}
                        color="text-green-500"
                        subtext={`${((stats.byStatus['Completed'] / stats.total) * 100 || 0).toFixed(0)}% completion rate`}
                    />
                    <StatCard
                        title="Delayed"
                        value={stats.byStatus['Delayed']}
                        icon={AlertCircle}
                        color="text-red-500"
                        subtext={stats.byStatus['Delayed'] > 0 ? 'Needs attention' : 'On track'}
                    />
                </div>

                {/* Breakdown Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Status Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">By Status</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.byStatus).map(([status, count]) => (
                                <div key={status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-600">{status}</span>
                                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-orange-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(count / stats.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Priority Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">By Priority</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.byPriority).map(([priority, count]) => (
                                <div key={priority}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-600">{priority}</span>
                                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${priority === 'High' ? 'bg-red-500' :
                                                priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${(count / stats.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">By Category</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.byCategory).map(([category, count]) => (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-600">{category}</span>
                                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(count / stats.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions by Responsible Person */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Actions by Responsible Person
                </h2>

                <div className="space-y-4">
                    {Object.entries(groupedByPerson).map(([person, personActions]) => (
                        <div key={person} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 print:border print:border-slate-300 print:mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500'][person.length % 5]
                                        }`}>
                                        {person.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{person}</h3>
                                        <p className="text-sm text-slate-500">{personActions.length} action{personActions.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-600 font-medium">
                                        {personActions.filter(a => a.status === 'Completed').length} completed
                                    </span>
                                    <span className="text-blue-600 font-medium">
                                        {personActions.filter(a => a.status === 'Ongoing').length} ongoing
                                    </span>
                                    {personActions.filter(a => a.status === 'Delayed').length > 0 && (
                                        <span className="text-red-600 font-medium">
                                            {personActions.filter(a => a.status === 'Delayed').length} delayed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {personActions.map((action) => (
                                    <div key={action.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-slate-50 print:hover:bg-white">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-slate-900">{action.title}</h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${action.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    action.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                                                        action.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                                                            action.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {action.status}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${action.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                    action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {action.priority}
                                                </span>
                                            </div>
                                            {action.description && (
                                                <p className="text-sm text-slate-600 mb-1">{action.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Meeting: {new Date(action.meetingDate).toLocaleDateString()}
                                                </span>
                                                {action.targetCompletionDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Target: {new Date(action.targetCompletionDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                personName={selectedPerson}
                personEmail="" // Add logic to get person's email if available
                onExport={handleExportEmail}
            />
        </div>
    );
}
