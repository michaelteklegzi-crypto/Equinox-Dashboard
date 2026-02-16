import React, { useState } from 'react';
import { X, Filter as FilterIcon } from 'lucide-react';

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }) {
    const [filters, setFilters] = useState(currentFilters || {
        status: '',
        priority: '',
        category: ''
    });

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const emptyFilters = { status: '', priority: '', category: '' };
        setFilters(emptyFilters);
        onApplyFilters(emptyFilters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FilterIcon className="h-5 w-5 text-orange-600" />
                        <h2 className="text-xl font-semibold">Filter Actions</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="Not Started">Not Started</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Paused">Paused</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Categories</option>
                            <option value="Operational">Operational</option>
                            <option value="Strategic">Strategic</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 text-sm font-medium transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
