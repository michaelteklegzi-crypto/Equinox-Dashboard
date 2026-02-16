import React, { useState } from 'react';
import axios from 'axios';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function NotesSection({ actionId, initialNotes = [], currentUserId, onNoteAdded }) {
    const [notes, setNotes] = useState(initialNotes);
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newNote.trim() || !currentUserId) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post(`/api/actions/${actionId}/notes`, {
                content: newNote.trim(),
                createdById: currentUserId
            });

            setNotes([response.data, ...notes]);
            setNewNote('');
            showToast('Note added successfully', 'success');
            if (onNoteAdded) onNoteAdded(response.data);
        } catch (error) {
            console.error('Error adding note:', error);
            showToast('Failed to add note', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTimestamp = (date) => {
        const noteDate = new Date(date);
        const now = new Date();
        const diffMs = now - noteDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return noteDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <MessageCircle className="h-5 w-5" />
                <h3>Notes & Updates</h3>
                <span className="text-sm font-normal text-slate-500">({notes.length})</span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note or update..."
                    className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!newNote.trim() || isSubmitting}
                    className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>

            {/* Notes List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notes yet. Be the first to add one!</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-semibold">
                                    {getInitials(note.createdBy.name)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-medium text-sm text-slate-900">
                                        {note.createdBy.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {formatTimestamp(note.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                                    {note.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
