import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);

    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Auto-login with Admin credentials for demo
        const result = await login('admin@equinox.com', '0987654321');

        if (!result.success) {
            setLoading(false);
            console.error("Login failed:", result.error);
            alert("Login failed. Please check your connection or database.");
        }
        // If success, Redirect handled by AuthContext/App
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Entering System...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    <span>Enter Dashboard</span>
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
