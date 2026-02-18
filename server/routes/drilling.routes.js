const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET all drilling entries (with filters)
router.get('/', async (req, res) => {
    try {
        const { rigId, projectId, startDate, endDate, shift, limit } = req.query;
        const where = {};

        if (rigId) where.rigId = rigId;
        if (projectId) where.projectId = projectId;
        if (shift) where.shift = shift;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const entries = await prisma.drillingEntry.findMany({
            where,
            orderBy: { date: 'desc' },
            take: limit ? parseInt(limit) : 100,
            include: {
                rig: { select: { name: true, type: true } },
                project: { select: { name: true, clientName: true } },
                createdBy: { select: { name: true } }
            }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create drilling entry
router.post('/', async (req, res) => {
    try {
        const {
            date, shift, rigId, projectId,
            metersDrilled, nptHours, downtimeCategory,
            // New detailed hours
            drillingHours, mechanicalDowntime, operationalDelay,
            weatherDowntime, safetyDowntime, waitingOnParts, standbyHours,
            totalShiftHours, holeDepth, bitType,
            // Costs & Meta
            fuelConsumed, consumablesCost, remarks, supervisorName
        } = req.body;

        if (!date || !shift || !rigId || !projectId || metersDrilled === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate hours sum
        const shiftDuration = totalShiftHours ? parseFloat(totalShiftHours) : 12;
        const totalAccounted = (
            (parseFloat(drillingHours) || 0) +
            (parseFloat(mechanicalDowntime) || 0) +
            (parseFloat(operationalDelay) || 0) +
            (parseFloat(weatherDowntime) || 0) +
            (parseFloat(safetyDowntime) || 0) +
            (parseFloat(waitingOnParts) || 0) +
            (parseFloat(standbyHours) || 0)
        );

        // Allow small floating point margin or exact match? 
        // User said "Prevent total hours exceeding shift hours".
        if (totalAccounted > shiftDuration) {
            return res.status(400).json({
                error: `Total hours (${totalAccounted}) exceed shift duration (${shiftDuration})`
            });
        }

        const entry = await prisma.drillingEntry.create({
            data: {
                date: new Date(date),
                shift,
                rigId,
                projectId,
                metersDrilled: parseFloat(metersDrilled),
                // Detailed Breakdown
                drillingHours: parseFloat(drillingHours) || 0,
                mechanicalDowntime: parseFloat(mechanicalDowntime) || 0,
                operationalDelay: parseFloat(operationalDelay) || 0,
                weatherDowntime: parseFloat(weatherDowntime) || 0,
                safetyDowntime: parseFloat(safetyDowntime) || 0,
                waitingOnParts: parseFloat(waitingOnParts) || 0,
                standbyHours: parseFloat(standbyHours) || 0,
                totalShiftHours: shiftDuration,

                holeDepth: holeDepth ? parseFloat(holeDepth) : null,
                bitType: bitType || null,

                // Legacy / Computed
                nptHours: nptHours ? parseFloat(nptHours) : (shiftDuration - (parseFloat(drillingHours) || 0)),
                downtimeCategory: downtimeCategory || null,

                fuelConsumed: fuelConsumed ? parseFloat(fuelConsumed) : null,
                consumablesCost: consumablesCost ? parseFloat(consumablesCost) : null,
                remarks: remarks || null,
                supervisorName: supervisorName || null,
                createdById: req.session?.userId || 'system',
            },
            include: {
                rig: { select: { name: true } },
                project: { select: { name: true } }
            }
        });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET dashboard KPIs (server-side aggregation)
router.get('/kpis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        // Aggregations
        const [totals, rigStats, recentEntries, rigCount] = await Promise.all([
            prisma.drillingEntry.aggregate({
                where,
                _sum: { metersDrilled: true, nptHours: true, fuelConsumed: true, consumablesCost: true },
                _count: { id: true },
                _avg: { metersDrilled: true }
            }),
            prisma.drillingEntry.groupBy({
                by: ['rigId'],
                where,
                _sum: { metersDrilled: true, nptHours: true },
                _count: { id: true },
            }),
            prisma.drillingEntry.findMany({
                where,
                orderBy: { date: 'desc' },
                take: 5,
                include: {
                    rig: { select: { name: true } },
                    project: { select: { name: true } }
                }
            }),
            prisma.rig.count({ where: { status: 'Active' } })
        ]);

        // Get rig names for stats
        const rigIds = rigStats.map(r => r.rigId);
        const rigs = await prisma.rig.findMany({
            where: { id: { in: rigIds } },
            select: { id: true, name: true, type: true }
        });
        const rigMap = Object.fromEntries(rigs.map(r => [r.id, r]));

        const rigPerformance = rigStats.map(r => ({
            rigId: r.rigId,
            rigName: rigMap[r.rigId]?.name || 'Unknown',
            rigType: rigMap[r.rigId]?.type || 'Unknown',
            totalMeters: r._sum.metersDrilled || 0,
            totalNpt: r._sum.nptHours || 0,
            entryCount: r._count.id,
            avgMeters: r._count.id > 0 ? (r._sum.metersDrilled || 0) / r._count.id : 0,
        })).sort((a, b) => b.totalMeters - a.totalMeters);

        // Calculate fleet utilization (entries with > 0 meters / total possible entries)
        const totalEntries = totals._count.id || 0;
        const totalMeters = totals._sum.metersDrilled || 0;
        const totalNpt = totals._sum.nptHours || 0;
        const avgMetersPerEntry = totals._avg.metersDrilled || 0;
        const totalFuel = totals._sum.fuelConsumed || 0;
        const totalConsumables = totals._sum.consumablesCost || 0;

        res.json({
            overview: {
                totalMeters,
                totalEntries,
                avgMetersPerEntry: Math.round(avgMetersPerEntry * 10) / 10,
                totalNptHours: totalNpt,
                nptPercentage: totalEntries > 0 ? Math.round((totalNpt / (totalEntries * 12)) * 100) : 0,
                activeRigs: rigCount,
                totalFuel,
                totalConsumables,
            },
            rigPerformance,
            recentEntries,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
