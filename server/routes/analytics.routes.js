const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db');

// ============ PRODUCTION ANALYTICS ============
router.get('/production', async (req, res) => {
    try {
        const { startDate, endDate, rigId, projectId } = req.query;
        const where = {};
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
        if (rigId) where.rigId = rigId;
        if (projectId) where.projectId = projectId;

        // Overall aggregates
        const totals = await prisma.drillingEntry.aggregate({
            where,
            _sum: { metersDrilled: true, nptHours: true, fuelConsumed: true, consumablesCost: true },
            _avg: { metersDrilled: true },
            _count: true,
        });

        // Per-rig breakdown
        const byRig = await prisma.drillingEntry.groupBy({
            by: ['rigId'],
            where,
            _sum: { metersDrilled: true, nptHours: true, fuelConsumed: true },
            _avg: { metersDrilled: true },
            _count: true,
        });

        // Enrich with rig names
        const rigs = await prisma.rig.findMany({ select: { id: true, name: true, type: true } });
        const rigMap = Object.fromEntries(rigs.map(r => [r.id, r]));
        const rigBreakdown = byRig.map(r => ({
            rigId: r.rigId,
            rigName: rigMap[r.rigId]?.name || 'Unknown',
            rigType: rigMap[r.rigId]?.type || '—',
            totalMeters: r._sum.metersDrilled || 0,
            avgMeters: Math.round(r._avg.metersDrilled || 0),
            totalNpt: r._sum.nptHours || 0,
            totalFuel: r._sum.fuelConsumed || 0,
            entries: r._count,
        }));

        // Per-project breakdown
        const byProject = await prisma.drillingEntry.groupBy({
            by: ['projectId'],
            where,
            _sum: { metersDrilled: true, consumablesCost: true },
            _count: true,
        });
        const projects = await prisma.project.findMany({ select: { id: true, name: true, clientName: true } });
        const projMap = Object.fromEntries(projects.map(p => [p.id, p]));
        const projectBreakdown = byProject.map(p => ({
            projectId: p.projectId,
            projectName: projMap[p.projectId]?.name || 'Unknown',
            clientName: projMap[p.projectId]?.clientName || '—',
            totalMeters: p._sum.metersDrilled || 0,
            totalConsumables: p._sum.consumablesCost || 0,
            entries: p._count,
        }));

        // Daily trend
        const entries = await prisma.drillingEntry.findMany({
            where,
            select: { date: true, metersDrilled: true, nptHours: true },
            orderBy: { date: 'asc' },
        });
        const dailyMap = {};
        entries.forEach(e => {
            const d = new Date(e.date).toISOString().split('T')[0];
            if (!dailyMap[d]) dailyMap[d] = { date: d, meters: 0, npt: 0 };
            dailyMap[d].meters += e.metersDrilled;
            dailyMap[d].npt += e.nptHours || 0;
        });

        // Comparison Trend
        const comparisonEntries = await prisma.drillingEntry.findMany({
            where,
            select: { date: true, rigId: true, metersDrilled: true },
            orderBy: { date: 'asc' },
        });

        const compMap = {};
        comparisonEntries.forEach(e => {
            const d = new Date(e.date).toISOString().split('T')[0];
            if (!compMap[d]) compMap[d] = { date: d };
            const rigName = rigMap[e.rigId]?.name || 'Unknown';
            compMap[d][rigName] = (compMap[d][rigName] || 0) + e.metersDrilled;
        });

        const comparisonTrend = Object.values(compMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            totals: {
                totalMeters: totals._sum.metersDrilled || 0,
                totalNpt: totals._sum.nptHours || 0,
                totalFuel: totals._sum.fuelConsumed || 0,
                totalConsumables: totals._sum.consumablesCost || 0,
                avgMetersPerEntry: Math.round(totals._avg.metersDrilled || 0),
                totalEntries: totals._count,
            },
            rigBreakdown,
            projectBreakdown,
            dailyTrend: Object.values(dailyMap),
            comparisonTrend,
        });
    } catch (error) {
        console.error('Production analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch production analytics' });
    }
});

// ============ DOWNTIME ANALYTICS ============
router.get('/downtime', async (req, res) => {
    try {
        const { startDate, endDate, rigId, projectId } = req.query;
        const where = {};
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
        if (rigId) where.rigId = rigId;
        if (projectId) where.projectId = projectId;
        where.nptHours = { gt: 0 };

        // Category breakdown
        const byCat = await prisma.drillingEntry.groupBy({
            by: ['downtimeCategory'],
            where: { ...where, downtimeCategory: { not: null } },
            _sum: { nptHours: true },
            _count: true,
        });

        const categoryBreakdown = byCat.map(c => ({
            category: c.downtimeCategory || 'Unclassified',
            hours: c._sum.nptHours || 0,
            count: c._count,
        }));

        // Per-rig NPT
        const byRig = await prisma.drillingEntry.groupBy({
            by: ['rigId'],
            where,
            _sum: { nptHours: true },
            _count: true,
        });
        const rigs = await prisma.rig.findMany({ select: { id: true, name: true } });
        const rigMap = Object.fromEntries(rigs.map(r => [r.id, r]));
        const rigNpt = byRig.map(r => ({
            rigName: rigMap[r.rigId]?.name || 'Unknown',
            hours: r._sum.nptHours || 0,
            incidents: r._count,
        }));

        // Total from DowntimeLog table as well
        const downtimeWhere = {};
        if (startDate) downtimeWhere.startTime = { gte: new Date(startDate) };
        if (endDate) downtimeWhere.endTime = { lte: new Date(endDate) };
        if (rigId) downtimeWhere.rigId = rigId;

        const downtimeLogs = await prisma.downtimeLog.groupBy({
            by: ['category'],
            where: downtimeWhere,
            _sum: { durationHours: true },
            _count: true,
        }).catch(() => []);

        // NPT by Rig and Category (Stacked)
        const byRigCat = await prisma.drillingEntry.groupBy({
            by: ['rigId', 'downtimeCategory'],
            where: { ...where, downtimeCategory: { not: null } },
            _sum: { nptHours: true },
        });

        const rigCategoryMatrix = [];
        const rigsList = await prisma.rig.findMany({ select: { id: true, name: true } });
        const rigNameMap = Object.fromEntries(rigsList.map(r => [r.id, r.name]));

        // Pivot data for Recharts: { rig: 'Rig 1', Mechanical: 10, Weather: 5, ... }
        const tempMap = {};
        byRigCat.forEach(item => {
            const rigName = rigNameMap[item.rigId] || 'Unknown';
            if (!tempMap[rigName]) tempMap[rigName] = { rig: rigName };
            const cat = item.downtimeCategory || 'Unclassified';
            tempMap[rigName][cat] = (tempMap[rigName][cat] || 0) + (item._sum.nptHours || 0);
        });
        const nptByRigAndCategory = Object.values(tempMap);

        // Daily Downtime Trend
        const dailyNpt = await prisma.drillingEntry.groupBy({
            by: ['date'],
            where,
            _sum: { nptHours: true },
            orderBy: { date: 'asc' },
        });
        const downtimeTrend = dailyNpt.map(d => ({
            date: new Date(d.date).toISOString().split('T')[0],
            hours: d._sum.nptHours || 0,
        }));

        res.json({
            categoryBreakdown,
            rigNpt,
            nptByRigAndCategory,
            downtimeTrend,
        });
    } catch (error) {
        console.error('Downtime analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch downtime analytics' });
    }
});

// ============ FINANCIAL ANALYTICS ============
router.get('/financial', async (req, res) => {
    try {
        const { startDate, endDate, rigId, projectId } = req.query;
        const where = {};
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
        if (rigId) where.rigId = rigId;
        if (projectId) where.projectId = projectId;

        const totals = await prisma.drillingEntry.aggregate({
            where,
            _sum: { metersDrilled: true, fuelConsumed: true, consumablesCost: true },
            _count: true,
        });

        // Per-rig cost
        const byRig = await prisma.drillingEntry.groupBy({
            by: ['rigId'],
            where,
            _sum: { metersDrilled: true, fuelConsumed: true, consumablesCost: true },
            _count: true,
        });
        const rigs = await prisma.rig.findMany({ select: { id: true, name: true } });
        const rigMap = Object.fromEntries(rigs.map(r => [r.id, r]));

        // Get financial params for revenue estimation
        const params = await prisma.financialParam.findMany();
        const globalParam = params.find(p => !p.rigId && !p.projectId);

        const totalMeters = totals._sum.metersDrilled || 0;
        const totalFuel = totals._sum.fuelConsumed || 0;
        const totalConsumables = totals._sum.consumablesCost || 0;
        const costPerMeter = globalParam?.costPerMeter || 0;
        const fuelCostFactor = globalParam?.fuelCostFactor || 1.5; // $/L default
        const estimatedRevenue = totalMeters * costPerMeter;
        const estimatedFuelCost = totalFuel * fuelCostFactor;
        const totalCost = estimatedFuelCost + totalConsumables;

        res.json({
            totals: {
                totalMeters,
                totalFuel,
                totalConsumables,
                estimatedRevenue,
                estimatedFuelCost,
                totalCost,
                margin: estimatedRevenue > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue * 100).toFixed(1) : 0,
                costPerMeter: totalMeters > 0 ? (totalCost / totalMeters).toFixed(2) : 0,
                fuelPerMeter: totalMeters > 0 ? (totalFuel / totalMeters).toFixed(2) : 0,
            },
            rigBreakdown: byRig.map(r => ({
                rigName: rigMap[r.rigId]?.name || 'Unknown',
                meters: r._sum.metersDrilled || 0,
                fuel: r._sum.fuelConsumed || 0,
                consumables: r._sum.consumablesCost || 0,
                fuelCost: (r._sum.fuelConsumed || 0) * fuelCostFactor,
            })),
        });
    } catch (error) {
        console.error('Financial analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch financial analytics' });
    }
});

// ============ MAINTENANCE ANALYTICS ============
router.get('/maintenance', async (req, res) => {
    try {
        const { startDate, endDate, rigId } = req.query;
        const where = {};
        if (startDate) where.date = { gte: new Date(startDate) };
        if (endDate) where.date = { lte: new Date(endDate) };
        if (rigId) where.rigId = rigId;

        const logs = await prisma.maintenanceLog.findMany({
            where,
            include: { rig: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 100,
        });

        // Per-rig maintenance frequency
        const rigFreq = {};
        logs.forEach(l => {
            const name = l.rig?.name || 'Unknown';
            if (!rigFreq[name]) rigFreq[name] = { name, count: 0, totalCost: 0 };
            rigFreq[name].count += 1;
            rigFreq[name].totalCost += l.cost || 0;
        });

        res.json({
            totalLogs: logs.length,
            recentLogs: logs.slice(0, 20).map(l => ({
                id: l.id,
                rig: l.rig?.name,
                type: l.type,
                description: l.description,
                cost: l.cost,
                date: l.date,
            })),
            rigFrequency: Object.values(rigFreq),
        });
    } catch (error) {
        console.error('Maintenance analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance analytics' });
    }
});

// ============ EXECUTIVE SUMMARY ============
router.get('/executive', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totals, activeRigs, incidents, recentEntries] = await Promise.all([
            prisma.drillingEntry.aggregate({
                where: { date: { gte: thirtyDaysAgo } },
                _sum: { metersDrilled: true, nptHours: true, fuelConsumed: true, consumablesCost: true },
                _count: true,
            }),
            prisma.rig.count({ where: { status: 'Active' } }),
            prisma.incidentReport.count({ where: { dateOccurred: { gte: thirtyDaysAgo } } }),
            prisma.drillingEntry.findMany({
                where: { date: { gte: thirtyDaysAgo } },
                orderBy: { date: 'desc' },
                take: 5,
                include: { rig: { select: { name: true } }, project: { select: { name: true } } },
            }),
        ]);

        res.json({
            period: 'Last 30 Days',
            totalMeters: totals._sum.metersDrilled || 0,
            totalNpt: totals._sum.nptHours || 0,
            totalFuel: totals._sum.fuelConsumed || 0,
            totalConsumables: totals._sum.consumablesCost || 0,
            totalEntries: totals._count,
            activeRigs,
            recentIncidents: incidents,
            avgMetersPerDay: totals._count > 0 ? Math.round((totals._sum.metersDrilled || 0) / 30) : 0,
            recentEntries: recentEntries.map(e => ({
                date: e.date,
                rig: e.rig?.name,
                project: e.project?.name,
                meters: e.metersDrilled,
                shift: e.shift,
            })),
        });
    } catch (error) {
        console.error('Executive summary error:', error);
        res.status(500).json({ error: 'Failed to fetch executive summary' });
    }
});

// ============ EXPORT: CSV ============
router.get('/export/csv', async (req, res) => {
    try {
        const { startDate, endDate, rigId, projectId } = req.query;
        const where = {};
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
        if (rigId) where.rigId = rigId;
        if (projectId) where.projectId = projectId;

        const entries = await prisma.drillingEntry.findMany({
            where,
            include: { rig: { select: { name: true } }, project: { select: { name: true } } },
            orderBy: { date: 'desc' },
        });

        const headers = ['Date', 'Rig', 'Project', 'Shift', 'Meters Drilled', 'NPT Hours', 'Downtime Category', 'Fuel (L)', 'Consumables ($)', 'Supervisor', 'Remarks'];
        const rows = entries.map(e => [
            new Date(e.date).toISOString().split('T')[0],
            e.rig?.name || '',
            e.project?.name || '',
            e.shift,
            e.metersDrilled,
            e.nptHours || 0,
            e.downtimeCategory || '',
            e.fuelConsumed || 0,
            e.consumablesCost || 0,
            e.supervisorName || '',
            (e.remarks || '').replace(/"/g, '""'),
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=drilling-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

module.exports = router;
