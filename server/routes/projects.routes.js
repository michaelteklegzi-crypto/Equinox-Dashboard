const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = require('../db');

// GET all projects
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { drillingEntries: true } }
            }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create project
router.post('/', async (req, res) => {
    try {
        const { name, clientName, location, startDate, endDate, contractedRate, status } = req.body;
        const project = await prisma.project.create({
            data: {
                name, clientName, location,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                contractedRate: contractedRate ? parseFloat(contractedRate) : null,
                status: status || 'Active',
            }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update project
router.put('/:id', async (req, res) => {
    try {
        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
