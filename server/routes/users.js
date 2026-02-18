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

module.exports = router;
