import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Filter, Calendar, CheckCircle2, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';
import ActionItemModal from '../components/ActionItemModal';
import FilterModal from '../components/FilterModal';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const [actions, setActions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ window: '14days' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({ status: '', priority: '', category: '' });
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [actionsRes, usersRes] = await Promise.all([
                axios.get('/api/actions', { params: filter }),
                axios.get('/api/users')
            ]);
            setActions(actionsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewAction = () => {
        setCurrentAction(null);
        setIsModalOpen(true);
    };

    const handleEditAction = (action) => {
        setCurrentAction(action);
        setIsModalOpen(true);
    };

    const handleItemSaved = () => {
        fetchData();
    };

    const handleApplyFilters = (newFilters) => {
        setAppliedFilters(newFilters);
        const activeCount = Object.values(newFilters).filter(v => v !== '').length;
        if (activeCount > 0) {
            showToast(`${activeCount} filter(s) applied`, 'success');
        }
    };

    // Filter actions based on appliedFilters
    const filteredActions = actions.filter(action => {
        if (appliedFilters.status && action.status !== appliedFilters.status) return false;
        if (appliedFilters.priority && action.priority !== appliedFilters.priority) return false;
        if (appliedFilters.category && action.category !== appliedFilters.category) return false;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        EQUINOX
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Here's your meeting intelligence overview.</p>
                </div>
                <button
                    onClick={handleNewAction}
                    className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Action Item
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Actions"
                    value={actions.length}
                    icon={Calendar}
                    color="orange"
                    trend="+12% from last week"
                    trendUp={true}
                />
                <StatCard
                    title="Pending"
                    value={actions.filter(a => a.status !== 'Completed').length}
                    icon={Clock}
                    color="blue"
                    trend="5 due today"
                    trendUp={true}
                />
                <StatCard
                    title="Completed"
                    value={actions.filter(a => a.status === 'Completed').length}
                    icon={CheckCircle2}
                    color="green"
                    trend="+3 just now"
                    trendUp={true}
                />
                <StatCard
                    title="High Priority"
                    value={actions.filter(a => a.priority === 'High' && a.status !== 'Completed').length}
                    icon={AlertCircle}
                    color="purple"
                    trend="Requires attention"
                    trendUp={false}
                />
            </div>

            {/* Recent Actions Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Recent Actions</h3>
                        <p className="text-sm text-slate-500">A list of all action items tracked in the last 14 days.</p>
                    </div>
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Filter className="mr-2 h-4 w-4 text-slate-400" /> Filter
                        {(appliedFilters.status || appliedFilters.priority || appliedFilters.category) && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-orange-500 rounded-full">!</span>
                        )}
                    </button>
                </div>

                <div className="relative w-full overflow-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            Loading data...
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-separate border-spacing-y-1 px-2">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-lg">Status</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Responsible</th>
                                    <th className="px-6 py-4">Date Entered</th>
                                    <th className="px-6 py-4">Target Date</th>
                                    <th className="px-6 py-4 text-right rounded-r-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {actions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">No actions found. Time to relax?</td>
                                    </tr>
                                ) : filteredActions.map((action) => (
                                    <tr
                                        key={action.id}
                                        onClick={() => navigate(`/action/${action.id}`)}
                                        className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 rounded-l-lg border-y border-l border-slate-100 group-hover:border-orange-100">
                                            <StatusBadge status={action.status} />
                                        </td>
                                        <td className="px-6 py-4 border-y border-slate-100 group-hover:border-orange-100 font-medium text-slate-900">{action.title}</td>
                                        <td className="px-6 py-4 border-y border-slate-100 group-hover:border-orange-100">
                                            <PriorityBadge priority={action.priority} />
                                        </td>
                                        <td className="px-6 py-4 border-y border-slate-100 group-hover:border-orange-100">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500'][action.responsiblePerson?.name?.length % 5] || 'bg-slate-500'
                                                    }`}>
                                                    {action.responsiblePerson?.name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <span className="text-slate-600 font-medium">{action.responsiblePerson?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-y border-slate-100 group-hover:border-orange-100 text-slate-500">
                                            {action.meetingDate ? new Date(action.meetingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 border-y border-slate-100 group-hover:border-orange-100 text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                {action.targetCompletionDate && (
                                                    new Date(action.targetCompletionDate) < new Date() && action.status !== 'Completed' ?
                                                        <Clock className="w-3.5 h-3.5 text-red-500" /> :
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                )}
                                                {action.targetCompletionDate ? new Date(action.targetCompletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 rounded-r-lg border-y border-r border-slate-100 group-hover:border-orange-100 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    alert('More options coming soon!');
                                                }}
                                                className="text-slate-300 hover:text-orange-500 transition-colors"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <ActionItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onItemSaved={handleItemSaved}
                actionItem={currentAction}
                users={users}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApplyFilters={handleApplyFilters}
                currentFilters={appliedFilters}
            />
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend, trendUp }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-all relative overflow-hidden group">
            {/* Gradient Top Border */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color === 'orange' ? 'from-orange-500 to-red-500' :
                color === 'blue' ? 'from-blue-500 to-cyan-500' :
                    color === 'purple' ? 'from-purple-500 to-pink-500' :
                        'from-green-500 to-emerald-500'
                }`}></div>

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="mt-1 text-3xl font-extrabold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-all">{value}</h3>
                </div>
                {/* 
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50`}>
                    <Icon className="h-5 w-5 text-slate-400" />
                </div>
                */}
            </div>
            {trend && (
                <div className="flex items-center text-xs font-bold mt-2">
                    <span className={`${trendUp ? 'text-green-600' : 'text-red-500'} bg-slate-50 px-2 py-1 rounded-full`}>{trend}</span>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Completed: 'bg-green-100 text-green-700',
        Ongoing: 'bg-blue-100 text-blue-700',
        Delayed: 'bg-amber-100 text-amber-700',
        default: 'bg-slate-100 text-slate-700'
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.default}`}>
            {status}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const styles = {
        High: 'text-red-700 bg-red-50 border border-red-200',
        Medium: 'text-amber-700 bg-amber-50 border border-amber-200',
        default: 'text-slate-700 bg-slate-50 border border-slate-200'
    };

    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[priority] || styles.default}`}>
            {priority}
        </span>
    );
}
