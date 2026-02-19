const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user (Admin only)
router.put('/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, email, role, isActive } = req.body;
        // Prevent changing own role/status to lock oneself out? (Optional safety)

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, email, role, isActive }
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE user (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Optional: Prevent deleting self
        if (req.params.id === req.session.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
