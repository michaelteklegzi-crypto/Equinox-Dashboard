const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = require('../db');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Store user in session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        // Debugging: Return actual error message to client
        res.status(500).json({
            error: `Login failed: ${error.message}`,
            details: error.stack
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                lastLogin: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId }
        });

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: req.session.userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Admin-only: Create new user
router.post('/register', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const validRoles = ['Admin', 'Supervisor', 'Driller', 'Viewer'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'Viewer',
                mustChangePassword: true,
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

module.exports = router;
