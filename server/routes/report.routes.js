const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all daily reports
router.get('/daily', async (req, res) => {
  try {
    const reports = await prisma.dailyDrillingReport.findMany({
      include: {
        createdBy: {
          select: { name: true }
        },
        shiftReports: true
      },
      orderBy: { reportDate: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single daily report with details
router.get('/daily/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.dailyDrillingReport.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        shiftReports: { orderBy: { date: 'desc' } },
        downtimeLogs: { orderBy: { startTime: 'desc' } },
        drillingDepths: { orderBy: { timeStart: 'desc' } }
      }
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new daily report
router.post('/daily', async (req, res) => {
  try {
    const { reportDate, rigId, location, startDepth, endDepth, createdById } = req.body;

    // Logic to ensure endDepth >= startDepth
    if (endDepth < startDepth) {
      return res.status(400).json({ error: 'End depth cannot be less than start depth' });
    }

    const report = await prisma.dailyDrillingReport.create({
      data: {
        reportDate: new Date(reportDate),
        rigId,
        location,
        startDepth,
        endDepth,
        totalDrilled: endDepth - startDepth,
        createdById
      }
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update daily report
router.put('/daily/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDepth, endDepth, status } = req.body;

    const data = { ...req.body };
    if (startDepth !== undefined && endDepth !== undefined) {
      data.totalDrilled = endDepth - startDepth;
    }

    const report = await prisma.dailyDrillingReport.update({
      where: { id },
      data
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shift Reports
router.post('/shift', async (req, res) => {
  try {
    const { dailyReportId, shiftType, date, crewAssigned, supervisorName, createdById } = req.body;
    const report = await prisma.shiftReport.create({
      data: {
        dailyReportId,
        shiftType,
        date: new Date(date),
        crewAssigned,
        supervisorName,
        createdById
      }
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
