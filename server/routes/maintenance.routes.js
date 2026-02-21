const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db');

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

// --- Equipment Health & Intelligence (Phase 3) ---
const maintenanceService = require('../services/maintenance.service');

router.get('/health', async (req, res) => {
    try {
        const { rigId } = req.query;
        const data = await maintenanceService.getFleetHealth(rigId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/equipment/:id/update-hours', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentHours } = req.body;
        const updated = await maintenanceService.updateEquipmentHours(id, parseFloat(currentHours));
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/equipment', async (req, res) => {
    try {
        const { rigId } = req.query;
        const where = rigId ? { rigId } : {};
        const equipment = await prisma.equipment.findMany({
            where,
            include: { rig: true },
            orderBy: { name: 'asc' }
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/seed', async (req, res) => {
    try {
        // 1. Ensure a Rig exists
        let rig = await prisma.rig.findFirst();
        if (!rig) {
            rig = await prisma.rig.create({
                data: { name: 'Rig 99 (Test)', type: 'RC', status: 'Active' }
            });
        }

        // 2. Create Test Equipment
        const items = [
            { name: 'Cat 3512 Engine (Port)', type: 'Engine', mtbf: 5000, last: 1000, current: 4500 }, // Usage: 3500/5000 = 70% (Warning edge)
            { name: 'Cat 3512 Engine (Stbd)', type: 'Engine', mtbf: 5000, last: 4000, current: 4100 }, // Usage: 100/5000 = 2% (Good)
            { name: 'Mud Pump A', type: 'Pump', mtbf: 3000, last: 0, current: 2900 }, // Usage: 2900/3000 = 96% (Critical)
            { name: 'Top Drive', type: 'Rotary', mtbf: 8000, last: 2000, current: 5000 }, // Usage: 3000/8000 = 37.5% (Good)
            { name: 'Main Generator', type: 'Gen', mtbf: 10000, last: 500, current: 9000 }, // Usage: 8500/10000 = 85% (Warning)
        ];

        const created = [];
        for (const item of items) {
            // Check if exists
            const exists = await prisma.equipment.findFirst({ where: { name: item.name, rigId: rig.id } });
            if (!exists) {
                const eq = await prisma.equipment.create({
                    data: {
                        name: item.name,
                        type: item.type,
                        rigId: rig.id,
                        mtbfHours: item.mtbf,
                        lastServiceHours: item.last,
                        currentHours: item.current,
                        currentRiskScore: (item.current - item.last) / item.mtbf
                    }
                });
                created.push(eq);
            }
        }

        res.json({ message: `Seeded ${created.length} equipment items to ${rig.name}`, created });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
