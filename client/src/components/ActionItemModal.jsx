import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, MessageCircle } from 'lucide-react';
import NotesSection from './NotesSection';

export default function ActionItemModal({ isOpen, onClose, onItemSaved, actionItem = null, users = [] }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Operational',
        priority: 'Medium',
        status: 'Not Started',
        responsiblePersonName: '',
        meetingDate: new Date().toISOString().split('T')[0],
        targetCompletionDate: ''
    });

    const [customNames, setCustomNames] = useState([]);
    const [activeTab, setActiveTab] = useState('details');

    // Load custom names from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('customResponsiblePersons');
        if (stored) {
            try {
                setCustomNames(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse custom names from localStorage', e);
            }
        }
    }, []);

    useEffect(() => {
        if (actionItem) {
            // For existing items, use the name from the user object or the stored name
            const userName = actionItem.responsiblePersonId
                ? users.find(u => u.id === actionItem.responsiblePersonId)?.name || ''
                : actionItem.responsiblePersonName || '';

            setFormData({
                ...actionItem,
                responsiblePersonName: userName,
                meetingDate: actionItem.meetingDate ? new Date(actionItem.meetingDate).toISOString().split('T')[0] : '',
                targetCompletionDate: actionItem.targetCompletionDate ? new Date(actionItem.targetCompletionDate).toISOString().split('T')[0] : ''
            });
        } else {
            // Reset for new item
            setFormData({
                title: '',
                description: '',
                category: 'Operational',
                priority: 'Medium',
                status: 'Not Started',
                responsiblePersonName: '',
                meetingDate: new Date().toISOString().split('T')[0],
                targetCompletionDate: ''
            });
        }
    }, [actionItem, isOpen, users]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Save custom name to localStorage if it's new
            const name = formData.responsiblePersonName.trim();
            if (name && !customNames.includes(name) && !users.find(u => u.name === name)) {
                const updatedNames = [...customNames, name];
                setCustomNames(updatedNames);
                localStorage.setItem('customResponsiblePersons', JSON.stringify(updatedNames));
            }

            // Convert responsiblePersonName to responsiblePersonId for backend
            const responsibleUser = users.find(u => u.name === name);
            const responsiblePersonId = responsibleUser ? responsibleUser.id : (users[0]?.id || '');

            // Build payload with proper field names for backend
            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                status: formData.status,
                responsiblePersonId: responsiblePersonId,  // Convert name to ID
                meetingDate: formData.meetingDate,
                targetCompletionDate: formData.targetCompletionDate || null
            };

            if (actionItem?.id) {
                await axios.patch(`/api/actions/${actionItem.id}`, payload);
            } else {
                // For new items, add createdById (use first user as current user)
                payload.createdById = users[0]?.id || '';
                await axios.post('/api/actions', payload);
            }

            onItemSaved();
            onClose();
        } catch (error) {
            console.error("Error saving action", error);
            console.error("Error details:", error.response?.data || error.message);

            // Still save the custom name to localStorage even if backend save fails
            const name = formData.responsiblePersonName.trim();
            if (name && !customNames.includes(name)) {
                const updatedNames = [...customNames, name];
                setCustomNames(updatedNames);
                localStorage.setItem('customResponsiblePersons', JSON.stringify(updatedNames));
                console.log(`Custom name "${name}" saved to localStorage for future use`);
            }

            alert(`Failed to save action item: ${error.response?.data?.error || error.message}. The responsible person name has been saved locally.`);

            // Close the modal even on error so user isn't stuck
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg sm:p-8 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold leading-none tracking-tight">
                        {actionItem ? 'Edit Action Item' : 'New Action Item'}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs for existing actions */}
                {actionItem && (
                    <div className="flex border-b border-slate-200 mb-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('notes')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Notes
                            {actionItem.notes && actionItem.notes.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-600 rounded-full">
                                    {actionItem.notes.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Action item title..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="Operational">Operational</option>
                                    <option value="Strategic">Strategic</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Paused">Paused</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Responsible Person</label>
                                <input
                                    list="responsible-persons"
                                    name="responsiblePersonName"
                                    value={formData.responsiblePersonName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter or select a name..."
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <datalist id="responsible-persons">
                                    {users.map(u => (
                                        <option key={u.id} value={u.name} />
                                    ))}
                                    {customNames.map((name, idx) => (
                                        <option key={`custom-${idx}`} value={name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Meeting Date</label>
                                <input
                                    type="date"
                                    name="meetingDate"
                                    value={formData.meetingDate}
                                    onChange={handleChange}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Target Date</label>
                                <input
                                    type="date"
                                    name="targetCompletionDate"
                                    value={formData.targetCompletionDate}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Detailed notes..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border hover:bg-muted text-sm font-medium">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">Save Action</button>
                        </div>
                    </form>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && actionItem && (
                    <NotesSection
                        actionId={actionItem.id}
                        initialNotes={actionItem.notes || []}
                        currentUserId={users[0]?.id}
                        onNoteAdded={(note) => {
                            // Update the action item notes in parent
                            if (actionItem.notes) {
                                actionItem.notes = [note, ...actionItem.notes];
                            } else {
                                actionItem.notes = [note];
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
