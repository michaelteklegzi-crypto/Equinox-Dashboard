const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Downtime Logs ---
router.get('/downtime', async (req, res) => {
    try {
        const logs = await prisma.downtimeLog.findMany({
            include: {
                dailyReport: true
            },
            orderBy: { startTime: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/downtime', async (req, res) => {
    try {
        const { dailyReportId, category, startTime, endTime, description, equipmentId } = req.body;

        let durationHours = 0;
        if (endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            durationHours = (end - start) / (1000 * 60 * 60);
        }

        const log = await prisma.downtimeLog.create({
            data: {
                dailyReportId,
                category,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                durationHours,
                description,
                equipmentId
            }
        });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Maintenance Logs ---
router.get('/maintenance', async (req, res) => {
    try {
        const logs = await prisma.maintenanceLog.findMany({
            orderBy: { datePerformed: 'desc' },
            include: {
                createdBy: { select: { name: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/maintenance', async (req, res) => {
    try {
        const { equipmentName, maintenanceType, description, cost, hoursSpent, performedBy, datePerformed, createdById } = req.body;
        const log = await prisma.maintenanceLog.create({
            data: {
                equipmentName,
                maintenanceType,
                description,
                cost,
                hoursSpent,
                performedBy,
                datePerformed: new Date(datePerformed),
                createdById
            }
        });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Incident Reports ---
router.post('/incident', async (req, res) => {
    try {
        const { incidentType, dateOccurred, description, severity, reportedById } = req.body;
        const report = await prisma.incidentReport.create({
            data: {
                incidentType,
                dateOccurred: new Date(dateOccurred),
                description,
                severity,
                reportedById
            }
        });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
