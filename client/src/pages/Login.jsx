import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
        setError(''); // Clear previous errors

        // Use state values instead of hardcoded demo credentials
        const result = await login(email, password);

        if (!result.success) {
            setLoading(false);
            console.error("Login failed:", result.error);
            // Show the actual error message from the server (handled as object or string)
            const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            setError(errorMsg || "Invalid credentials. Please try again.");
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
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#020617]">
            {/* Pure CSS Radial Glow Background */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/15 via-[#020617] to-[#020617] opacity-80" />

            {/* Content */}
            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-8 flex flex-col items-center w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)] mb-6">
                        <span className="text-white font-bold text-2xl tracking-tighter">E</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-3">Welcome Back</h1>
                    <p className="text-base text-slate-400">Secure Industrial Analytics Platform</p>
                </div>

                {/* Glassmorphism Card */}
                <div className="w-full bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-slate-700/50 p-8 sm:p-10 relative overflow-hidden">
                    {/* Subtle top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" style={{ boxShadow: '0 0 8px #ef4444' }}></div>
                                <p className="text-sm text-red-400 font-medium">{error}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 text-lg bg-slate-950/50 text-white border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-slate-600 shadow-inner"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 text-lg bg-slate-950/50 text-white border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all placeholder-slate-600 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-5 py-4 text-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-400 hover:to-amber-400 transition-all font-semibold shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/80"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to Command Center</span>
                                        <LogIn className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/80">
                        <div className="flex items-start gap-3 p-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 opacity-80 flex-shrink-0" style={{ boxShadow: '0 0 8px #f97316' }}></div>
                            <p className="text-xs text-slate-400 leading-relaxed font-mono">
                                <strong className="text-slate-300 font-sans">RESTRICTED ACCESS</strong><br />
                                System access and operations are monitored. Unauthorized access is strictly prohibited.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-8 font-mono tracking-widest uppercase">
                    Equinox Mining Systems
                </p>
            </div>
        </div>
    );
}
