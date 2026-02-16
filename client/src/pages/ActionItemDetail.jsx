import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, User, Tag, AlertCircle, FileText, Clock } from 'lucide-react';
import NotesSection from '../components/NotesSection';
import { useToast } from '../context/ToastContext';

export default function ActionItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [action, setAction] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [actionsRes, usersRes] = await Promise.all([
                axios.get('/api/actions'),
                axios.get('/api/users')
            ]);

            const foundAction = actionsRes.data.find(a => a.id === id);
            if (!foundAction) {
                showToast('Action item not found', 'error');
                navigate('/');
                return;
            }

            setAction(foundAction);
            setUsers(usersRes.data);
            setFormData({
                title: foundAction.title,
                description: foundAction.description || '',
                category: foundAction.category,
                priority: foundAction.priority,
                status: foundAction.status,
                responsiblePersonId: foundAction.responsiblePersonId,
                meetingDate: new Date(foundAction.meetingDate).toISOString().split('T')[0],
                targetCompletionDate: foundAction.targetCompletionDate
                    ? new Date(foundAction.targetCompletionDate).toISOString().split('T')[0]
                    : ''
            });
        } catch (error) {
            console.error('Error fetching action:', error);
            showToast('Failed to load action item', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            await axios.patch(`/api/actions/${id}`, formData);
            showToast('Action updated successfully', 'success');
            setIsEditing(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating action:', error);
            showToast('Failed to update action', 'error');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Not Started': 'bg-slate-100 text-slate-700',
            'Ongoing': 'bg-blue-100 text-blue-700',
            'Completed': 'bg-green-100 text-green-700',
            'Delayed': 'bg-red-100 text-red-700',
            'Paused': 'bg-yellow-100 text-yellow-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'High': 'bg-red-100 text-red-700',
            'Medium': 'bg-yellow-100 text-yellow-700',
            'Low': 'bg-green-100 text-green-700'
        };
        return colors[priority] || 'bg-slate-100 text-slate-700';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading action item...</p>
                </div>
            </div>
        );
    }

    if (!action) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {action.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                                    {action.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                                    {action.priority} Priority
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                    {action.category}
                                </span>
                            </div>
                        </div>

                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
                            >
                                Edit Details
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchData();
                                    }}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Details Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Action Details Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-500" />
                                Action Details
                            </h2>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="Operational">Operational</option>
                                                <option value="Strategic">Strategic</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                            <select
                                                name="priority"
                                                value={formData.priority}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="Not Started">Not Started</option>
                                            <option value="Ongoing">Ongoing</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Delayed">Delayed</option>
                                            <option value="Paused">Paused</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                                        <p className="text-slate-700">
                                            {action.description || <span className="text-slate-400 italic">No description provided</span>}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <NotesSection
                                actionId={action.id}
                                initialNotes={action.notes || []}
                                currentUserId={users[0]?.id}
                                onNoteAdded={(note) => {
                                    setAction(prev => ({
                                        ...prev,
                                        notes: [note, ...(prev.notes || [])]
                                    }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Info</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500">Responsible Person</p>
                                        <p className="text-sm font-medium text-slate-900">{action.responsiblePerson?.name || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500">Meeting Date</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {new Date(action.meetingDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {action.targetCompletionDate && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Target Date</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {new Date(action.targetCompletionDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Tag className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500">Created By</p>
                                        <p className="text-sm font-medium text-slate-900">{action.createdBy?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
