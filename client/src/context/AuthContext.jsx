import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios to send cookies
    axios.defaults.withCredentials = true;

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await axios.get('/api/auth/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            setUser(response.data.user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setUser(null);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: 'Logout failed'
            };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            await axios.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            });
            // Update user to reflect mustChangePassword: false
            setUser(prev => ({ ...prev, mustChangePassword: false }));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Password change failed'
            };
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
