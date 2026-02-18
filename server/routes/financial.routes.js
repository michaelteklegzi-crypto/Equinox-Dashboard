const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all financial params
router.get('/', async (req, res) => {
    try {
        const params = await prisma.financialParam.findMany({
            include: {
                rig: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(params);
    } catch (error) {
        console.error('Financial params GET error:', error);
        res.status(500).json({ error: 'Failed to fetch financial parameters' });
    }
});

// POST create financial param
router.post('/', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { rigId, projectId, costPerMeter, fuelCostFactor, consumablesFactor, laborCostFactor } = req.body;

        const param = await prisma.financialParam.create({
            data: {
                rigId: rigId || null,
                projectId: projectId || null,
                costPerMeter: parseFloat(costPerMeter) || 0,
                fuelCostFactor: parseFloat(fuelCostFactor) || 1,
                consumablesFactor: parseFloat(consumablesFactor) || 1,
                laborCostFactor: parseFloat(laborCostFactor) || 1,
            },
            include: {
                rig: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
        });

        res.status(201).json(param);
    } catch (error) {
        console.error('Financial params POST error:', error);
        res.status(500).json({ error: 'Failed to create financial parameter' });
    }
});

// PUT update financial param
router.put('/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { costPerMeter, fuelCostFactor, consumablesFactor, laborCostFactor } = req.body;

        const param = await prisma.financialParam.update({
            where: { id: req.params.id },
            data: {
                costPerMeter: parseFloat(costPerMeter) || 0,
                fuelCostFactor: parseFloat(fuelCostFactor) || 1,
                consumablesFactor: parseFloat(consumablesFactor) || 1,
                laborCostFactor: parseFloat(laborCostFactor) || 1,
            },
        });

        res.json(param);
    } catch (error) {
        console.error('Financial params PUT error:', error);
        res.status(500).json({ error: 'Failed to update financial parameter' });
    }
});

// DELETE financial param
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await prisma.financialParam.delete({ where: { id: req.params.id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Financial params DELETE error:', error);
        res.status(500).json({ error: 'Failed to delete financial parameter' });
    }
});

module.exports = router;
