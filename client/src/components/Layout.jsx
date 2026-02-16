import React from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            showToast('Logged out successfully', 'success');
            navigate('/login');
        } else {
            showToast('Logout failed', 'error');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <img
                        src="/equinox-logo.png"
                        alt="Equinox Dashboard"
                        className="h-12 w-auto object-contain max-h-12 max-w-full"
                        style={{ maxHeight: '48px', maxWidth: '100%' }}
                    />
                    <p className="text-xs text-slate-500 mt-2">Meeting Intelligence</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
                    <NavItem icon={FileText} label="All Actions" />
                    <NavItem icon={BarChart3} label="Reports" to="/reports" active={location.pathname === '/reports'} />
                    <NavItem icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500">{user?.role || 'User'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-md"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

function NavItem({ icon: Icon, label, active = false, to }) {
    const { showToast } = useToast();

    if (!to) {
        // Non-functional nav item
        return (
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    console.log(`${label} is not working yet`);
                    showToast(`${label} is not working yet`, 'warning');
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
                <Icon className="h-5 w-5" />
                {label}
            </a>
        );
    }

    // Functional nav item with routing
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all ${active
                ? 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    );
}
