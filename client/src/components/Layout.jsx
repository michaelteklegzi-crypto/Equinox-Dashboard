import React, { useState } from 'react';
import { LayoutDashboard, Activity, Wrench, BarChart3, Shield, Settings, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Activity, label: 'Drilling Ops', to: '/drilling' },
    { icon: Wrench, label: 'Maintenance', to: '/maintenance' },
    { icon: BarChart3, label: 'Analytics', to: '/analytics' },
    { icon: Shield, label: 'Admin', to: '/admin', adminOnly: true },
];

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

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

    const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-slate-300"
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
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
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
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${active
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-orange-400 shadow-sm shadow-orange-500/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
        >
            <Icon className={`h-[18px] w-[18px] ${active ? 'text-orange-400' : ''}`} />
            {label}
        </Link>
    );
}
