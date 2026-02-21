import { Wrench, Plus, History, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EquipmentHealth from '../components/maintenance/EquipmentHealth';
import MaintenanceForm from '../components/forms/MaintenanceForm';
import { useToast } from '../context/ToastContext';

export default function MaintenanceReports() {
    const [logs, setLogs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('health');

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/maintenance/maintenance', { withCredentials: true });
            setLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch maintenance logs', error);
        }
    };

    const handleSuccess = () => {
        setShowForm(false);
        if (activeTab === 'logs') fetchLogs();
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Maintenance & Assets</h1>
                    <p className="text-sm text-slate-500 mt-1">Track equipment status, maintenance logs, and downtime.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
                >
                    <Plus className="h-4 w-4" />
                    Log Maintenance
                </button>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 w-fit">
                <TabButton label="Health Monitor" icon={Activity} isActive={activeTab === 'health'} onClick={() => setActiveTab('health')} />
                <TabButton label="Maintenance Logs" icon={History} isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">New Maintenance Entry</h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">Close</button>
                            </div>
                            <MaintenanceForm onSuccess={handleSuccess} />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {activeTab === 'health' ? (
                <EquipmentHealth />
            ) : (
                <div className="rounded-2xl bg-[#111827] border border-slate-800/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800/50 flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-500" />
                        <h3 className="font-semibold text-white">Recent Activities</h3>
                    </div>

                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Wrench className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                            <p className="text-slate-500">No maintenance logs found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase border-b border-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Equipment</th>
                                        <th className="px-6 py-3 font-medium">Type</th>
                                        <th className="px-6 py-3 font-medium">Description</th>
                                        <th className="px-6 py-3 font-medium text-right">Hours</th>
                                        <th className="px-6 py-3 font-medium">Performed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                                {new Date(log.datePerformed).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-300">{log.equipmentName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.maintenanceType === 'Preventive' ? 'bg-emerald-500/15 text-emerald-400' :
                                                    log.maintenanceType === 'Corrective' ? 'bg-red-500/15 text-red-400' :
                                                        'bg-blue-500/15 text-blue-400'
                                                    }`}>
                                                    {log.maintenanceType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.description}>
                                                {log.description}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400">{log.hoursSpent}</td>
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
            )}
        </div>
    );
}

function TabButton({ label, icon: Icon, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}
