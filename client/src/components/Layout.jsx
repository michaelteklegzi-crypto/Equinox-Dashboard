import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Activity, Wrench, BarChart3, Shield, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Activity, label: 'Drilling Ops', to: '/drilling' },
    { icon: Wrench, label: 'Maintenance', to: '/maintenance' },
    { icon: Activity, label: 'Availability', to: '/reports/availability' },
    { icon: BarChart3, label: 'Analytics', to: '/analytics' },
    { icon: Shield, label: 'Admin', to: '/admin', adminOnly: true },
];

import axios from 'axios';

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Sync Offline Data
    useEffect(() => {
        const syncOfflineData = async () => {
            if (!navigator.onLine) return;

            const offlineLogs = JSON.parse(localStorage.getItem('offline_maintenance_logs') || '[]');
            if (offlineLogs.length === 0) return;

            showToast(`Syncing ${offlineLogs.length} offline logs...`, 'info');

            const remainingLogs = [];
            let successCount = 0;

            for (const log of offlineLogs) {
                try {
                    // Remove offline-specific fields if any
                    const { offlineId, ...payload } = log;
                    await axios.post('/api/maintenance', payload);
                    successCount++;
                } catch (err) {
                    console.error("Failed to sync log:", log, err);
                    remainingLogs.push(log); // Keep failed ones
                }
            }

            localStorage.setItem('offline_maintenance_logs', JSON.stringify(remainingLogs));

            if (successCount > 0) {
                showToast(`Synced ${successCount} logs successfully`, 'success');
                // Refresh data if on maintenance page?
                if (location.pathname === '/maintenance') {
                    window.location.reload(); // Simple reload to show new data
                }
            }

            // Sync Drilling Logs
            const offlineDrillingLogs = JSON.parse(localStorage.getItem('offline_drilling_logs') || '[]');
            if (offlineDrillingLogs.length > 0) {
                showToast(`Syncing ${offlineDrillingLogs.length} drilling logs...`, 'info');
                const remainingDrilling = [];
                let drillingSuccess = 0;

                for (const log of offlineDrillingLogs) {
                    try {
                        const { offlineId, ...payload } = log;
                        await axios.post('/api/drilling', payload, { withCredentials: true });
                        drillingSuccess++;
                    } catch (err) {
                        console.error("Failed to sync drilling log:", log, err);
                        remainingDrilling.push(log);
                    }
                }
                localStorage.setItem('offline_drilling_logs', JSON.stringify(remainingDrilling));
                if (drillingSuccess > 0) {
                    showToast(`Synced ${drillingSuccess} drilling logs`, 'success');
                    if (location.pathname === '/drilling') window.location.reload();
                }
            }
        };

        window.addEventListener('online', syncOfflineData);
        // Also try on mount if online
        syncOfflineData();

        // Cache Metadata (Rigs/Projects)
        const cacheMetadata = async () => {
            if (!navigator.onLine) return;
            try {
                const [r, p] = await Promise.all([
                    axios.get('/api/rigs', { withCredentials: true }),
                    axios.get('/api/projects', { withCredentials: true })
                ]);
                localStorage.setItem('cached_rigs', JSON.stringify(r.data));
                localStorage.setItem('cached_projects', JSON.stringify(p.data));
                showToast(`System Ready: Cached ${r.data.length} rigs, ${p.data.length} projects`, 'success');
            } catch (e) {
                console.error('Failed to cache metadata', e);
                showToast(`Sync Failed: ${e.message}`, 'error');
            }
        };
        cacheMetadata();

        return () => window.removeEventListener('online', syncOfflineData);
    }, [showToast, location.pathname]);

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            showToast('Logged out successfully', 'success');
            navigate('/login');
        } else {
            showToast('Logout failed', 'error');
        }
    };

    const isAdmin = user?.role === 'Admin';
    const isMaintenance = user?.role === 'Maintenance';
    const isDriller = user?.role === 'Driller';

    const filteredNav = navItems.filter(item => {
        if (isMaintenance) return item.label === 'Maintenance';
        if (isDriller) return item.label === 'Drilling Ops';
        return !item.adminOnly || isAdmin;
    });

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-800/80 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all shadow-lg shadow-black/20 btn-press"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Sidebar */}
            <aside className={`
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 transition-transform duration-300
                fixed md:static z-40
                w-64 h-full
                border-r border-slate-800/50
                bg-[#0d1224] flex flex-col
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">EQUINOX</h1>
                            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Fleet Command</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1">
                    {filteredNav.map(item => (
                        <NavItem
                            key={item.to}
                            icon={item.icon}
                            label={item.label}
                            to={item.to}
                            active={
                                item.to === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(item.to)
                            }
                            onClick={() => setMobileOpen(false)}
                        />
                    ))}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-slate-800/60">
                    <button
                        onClick={() => {
                            showToast('Syncing...', 'info');
                            const cacheMetadata = async () => {
                                try {
                                    const [r, p] = await Promise.all([
                                        axios.get('/api/rigs', { withCredentials: true }),
                                        axios.get('/api/projects', { withCredentials: true })
                                    ]);
                                    localStorage.setItem('cached_rigs', JSON.stringify(r.data));
                                    localStorage.setItem('cached_projects', JSON.stringify(p.data));
                                    showToast(`Synced: ${r.data.length} Rigs, ${p.data.length} Projects`, 'success');
                                } catch (e) {
                                    console.error('Manual sync failed', e);
                                    showToast(`Sync Failed: ${e.message}`, 'error');
                                }
                            };
                            cacheMetadata();
                        }}
                        className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors text-xs font-medium border border-orange-500/20"
                    >
                        <Activity className="h-3 w-3" /> Sync Offline Data
                    </button>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.role || 'Viewer'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden mobile-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Content */}
            <main key={location.pathname} className="flex-1 overflow-y-auto page-enter">
                {children}
            </main>
        </div>
    );
}

function NavItem({ icon: Icon, label, active = false, to, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`sidebar-nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 btn-press ${active
                ? 'active bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-orange-400 shadow-sm shadow-orange-500/5'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
        >
            <Icon className={`h-[18px] w-[18px] transition-transform duration-200 ${active ? 'text-orange-400 scale-110' : ''}`} />
            {label}
        </Link>
    );
}
