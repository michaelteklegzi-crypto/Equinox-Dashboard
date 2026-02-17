const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get KPI Stats (Total Depth, Active Rigs, NPT, Incidents)
router.get('/kpi', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Total Depth Drilled (All Time vs Today)
        const totalDepthAgg = await prisma.dailyDrillingReport.aggregate({
            _sum: { totalDrilled: true }
        });

        const todayDepthAgg = await prisma.dailyDrillingReport.aggregate({
            where: {
                reportDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            _sum: { totalDrilled: true }
        });

        // 2. Active Rigs (Unique Rigs with reports today)
        const activeRigsCount = await prisma.dailyDrillingReport.groupBy({
            by: ['rigId'],
            where: {
                reportDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. NPT (Non-Productive Time) - Total Hours from Downtime Logs
        const nptAgg = await prisma.downtimeLog.aggregate({
            _sum: { durationHours: true }
        });

        // 4. Safety Incidents (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const incidentsCount = await prisma.incidentReport.count({
            where: {
                dateOccurred: { gte: thirtyDaysAgo }
            }
        });

        // 5. Enterprise Financials & Fuel
        const financialsAgg = await prisma.dailyDrillingReport.aggregate({
            where: {
                reportDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            _sum: {
                dailyCost: true,
                fuelConsumed: true
            }
        });

        res.json({
            totalDepth: totalDepthAgg._sum.totalDrilled || 0,
            todayDepth: todayDepthAgg._sum.totalDrilled || 0,
            activeRigs: activeRigsCount.length,
            nptHours: nptAgg._sum.durationHours || 0,
            recentIncidents: incidentsCount,
            dailyCost: financialsAgg._sum.dailyCost || 0,
            fuelConsumed: financialsAgg._sum.fuelConsumed || 0
        });

    } catch (error) {
        console.error('KPI Error:', error);
        res.status(500).json({ error: 'Failed to fetch KPI stats' });
    }
});

// Get Fleet Overview (Rig by Rig Performance for Last 30 Days)
router.get('/fleet', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all rigs
        const rigs = await prisma.rig.findMany({
            orderBy: { name: 'asc' },
            include: {
                dailyReports: {
                    where: { reportDate: { gte: thirtyDaysAgo } },
                    select: { totalDrilled: true, dailyCost: true }
                }
            }
        });

        // Calculate aggregates for each rig
        const fleetData = rigs.map(rig => {
            const totalDepth = rig.dailyReports.reduce((sum, r) => sum + r.totalDrilled, 0);
            const totalCost = rig.dailyReports.reduce((sum, r) => sum + (r.dailyCost || 0), 0);
            const daysReported = rig.dailyReports.length || 1;

            return {
                id: rig.id,
                name: rig.name,
                site: rig.site,
                type: rig.type,
                status: rig.status,
                totalDepth: totalDepth,
                avgRop: (totalDepth / daysReported).toFixed(1), // Simplified ROP (m/day)
                totalCost: totalCost
            };
        });

        res.json(fleetData);
    } catch (error) {
        console.error("Fleet API Error:", error);
        res.status(500).json({ error: "Failed to fetch fleet data" });
    }
});

// Get Chart Data: Drilling Progress (Depth vs Date)
router.get('/charts/depth', async (req, res) => {
    try {
        // Fetch last 30 days of reports
        const stats = await prisma.dailyDrillingReport.findMany({
            orderBy: { reportDate: 'asc' },
            select: {
                reportDate: true,
                totalDrilled: true
            },
            // Take enough to cover 12 rigs * 30 days
            take: 400
        });

        // Group by Date
        const grouped = stats.reduce((acc, curr) => {
            const dateStr = new Date(curr.reportDate).toLocaleDateString();
            if (!acc[dateStr]) acc[dateStr] = 0;
            acc[dateStr] += curr.totalDrilled;
            return acc;
        }, {});

        // Format for Recharts
        const chartData = Object.keys(grouped).map(date => ({
            date,
            depth: grouped[date]
        }));

        res.json(chartData);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Chart Data: Downtime by Category
router.get('/charts/downtime', async (req, res) => {
    try {
        const downtime = await prisma.downtimeLog.groupBy({
            by: ['category'],
            _sum: {
                durationHours: true
            }
        });

        const chartData = downtime.map(item => ({
            name: item.category,
            value: item._sum.durationHours || 0
        }));

        res.json(chartData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
