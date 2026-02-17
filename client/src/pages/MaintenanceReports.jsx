import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Plus, History } from 'lucide-react';
import MaintenanceForm from '../components/forms/MaintenanceForm';
import { useToast } from '../context/ToastContext';

export default function MaintenanceReports() {
    const [logs, setLogs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    // const { showToast } = useToast();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/maintenance');
            setLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch maintenance logs', error);
        }
    };

    const handleSuccess = () => {
        setShowForm(false);
        fetchLogs();
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance & Assets</h1>
                    <p className="text-slate-500 mt-2">Track equipment status, maintenance logs, and downtime.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${showForm
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                        }`}
                >
                    {showForm ? 'Cancel' : (
                        <>
                            <Plus className="h-4 w-4" />
                            Log Maintenance
                        </>
                    )}
                </button>
            </header>

            {showForm && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <MaintenanceForm onSuccess={handleSuccess} />
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-500" />
                        Maintenance History
                    </h3>
                </div>

                {logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Wrench className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p>No maintenance logs found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Equipment</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 font-medium">Description</th>
                                    <th className="px-6 py-3 font-medium text-right">Hours</th>
                                    {/* <th className="px-6 py-3 font-medium text-right">Cost</th> */}
                                    <th className="px-6 py-3 font-medium">Performed By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {new Date(log.datePerformed).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{log.equipmentName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.maintenanceType === 'Preventive' ? 'bg-green-100 text-green-700' :
                                                    log.maintenanceType === 'Corrective' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.maintenanceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.description}>
                                            {log.description}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">{log.hoursSpent}</td>
                                        {/* <td className="px-6 py-4 text-right text-slate-600">${log.cost}</td> */}
                                        <td className="px-6 py-4 text-slate-500">
                                            {log.performedBy || log.createdBy?.name || 'Unknown'}
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
