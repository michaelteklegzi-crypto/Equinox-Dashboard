import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // If already authenticated, redirect based on role
    if (isAuthenticated) {
        if (user?.role === 'Maintenance') {
            return <Navigate to="/maintenance" replace />;
        }
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Use state values instead of hardcoded demo credentials
        const result = await login(email, password);

        if (!result.success) {
            setLoading(false);
            console.error("Login failed:", result.error);
            // Show the actual error message from the server (handled as object or string)
            const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            alert(`Login Failed: ${errorMsg || "Unknown Error"}`);
        }
        if (result.success) {
            if (result.user?.role === 'Maintenance') {
                // Navigate will handle it, but wait.. Layout handles navigation?
                // No, Login is separate. We need to manually navigate if navigate hook is used.
                // But Login.jsx doesn't have navigate hook? 
                // Ah, Login.jsx uses `if (isAuthenticated) return <Navigate to="/" ... />`
                // This component re-renders when `isAuthenticated` becomes true.
                // WE NEED TO CHANGE THAT LOGIC.
            }
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('/rig-background.jpg')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-orange-900/40 to-slate-900/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/60" />
            </div>

            {/* Content */}
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg mb-4">
                        <span className="text-white font-bold text-3xl">E</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/90">Click below to access Equinox Dashboard</p>
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-600 text-center">
                            <strong>Authorized Personnel Only</strong><br />
                            System access is monitored.
                        </p>
                    </div>
                </div>

                <p className="text-center text-sm text-white/70 mt-6">
                    © 2026 Equinox Dashboard. Meeting Intelligence.
                </p>
            </div>
        </div>
    );
}
