const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = require('../db');

// GET all rigs
router.get('/', async (req, res) => {
    try {
        const rigs = await prisma.rig.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { drillingEntries: true } }
            }
        });
        res.json(rigs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create rig
router.post('/', async (req, res) => {
    try {
        const { name, type, site, operationalCapacity, commissionDate, status, defaultCostPerMeter } = req.body;
        const rig = await prisma.rig.create({
            data: {
                name, type, site,
                operationalCapacity: operationalCapacity ? parseFloat(operationalCapacity) : null,
                commissionDate: commissionDate ? new Date(commissionDate) : null,
                status: status || 'Active',
                defaultCostPerMeter: defaultCostPerMeter ? parseFloat(defaultCostPerMeter) : null,
            }
        });
        res.status(201).json(rig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update rig
router.put('/:id', async (req, res) => {
    try {
        const rig = await prisma.rig.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(rig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
