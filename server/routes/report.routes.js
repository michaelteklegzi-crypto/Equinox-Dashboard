const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db');

// GET Machine Availability Report
router.get('/availability', async (req, res) => {
  try {
    const { rigId, projectId, startDate, endDate } = req.query;

    const where = {};
    if (rigId) where.rigId = rigId;
    if (projectId) where.projectId = projectId;

    // Date handling
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate); // Make sure to handle end of day if needed
    }

    // Fetch entries
    const entries = await prisma.drillingEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        rig: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    // Initialize aggregates
    let totalShiftHours = 0;
    let totalDrillingHours = 0;
    let totalMeters = 0;
    let totalMechanicalDT = 0;
    let totalOperationalDT = 0;
    let totalWeatherDT = 0;
    let totalSafetyDT = 0;
    let totalWaitingDT = 0;
    let totalStandby = 0;

    // Daily breakdown for table
    const dailyBreakdown = entries.map(entry => {
      const shiftHours = entry.totalShiftHours || 12; // Default if 0/null
      const mech = entry.mechanicalDowntime || 0;
      const drill = entry.drillingHours || 0;

      // Availability: (Shift - Mechanical) / Shift
      const availability = shiftHours > 0 ? ((shiftHours - mech) / shiftHours) * 100 : 0;

      // Utilization: Drilling / Shift
      const utilization = shiftHours > 0 ? (drill / shiftHours) * 100 : 0;

      // Update totals
      totalShiftHours += shiftHours;
      totalDrillingHours += drill;
      totalMeters += (entry.metersDrilled || 0);
      totalMechanicalDT += mech;
      totalOperationalDT += (entry.operationalDelay || 0);
      totalWeatherDT += (entry.weatherDowntime || 0);
      totalSafetyDT += (entry.safetyDowntime || 0);
      totalWaitingDT += (entry.waitingOnParts || 0);
      totalStandby += (entry.standbyHours || 0);

      return {
        id: entry.id,
        date: entry.date,
        rigName: entry.rig?.name,
        shift: entry.shift,
        shiftHours,
        drillingHours: drill,
        mechanicalDowntime: mech,
        operationalDelay: entry.operationalDelay || 0,
        weatherDowntime: entry.weatherDowntime || 0,
        standbyHours: entry.standbyHours || 0,
        totalAllDowntime: mech + (entry.operationalDelay || 0) + (entry.weatherDowntime || 0) + (entry.safetyDowntime || 0) + (entry.waitingOnParts || 0),
        availability: Math.round(availability * 10) / 10,
        utilization: Math.round(utilization * 10) / 10
      };
    });

    // Global Calculations
    const overallAvailability = totalShiftHours > 0
      ? ((totalShiftHours - totalMechanicalDT) / totalShiftHours) * 100
      : 0;

    const overallUtilization = totalShiftHours > 0
      ? (totalDrillingHours / totalShiftHours) * 100
      : 0;

    const summary = {
      totalShiftHours,
      totalDrillingHours,
      totalMeters,
      totalMechanicalDT,
      overallAvailability: Math.round(overallAvailability * 10) / 10,
      overallUtilization: Math.round(overallUtilization * 10) / 10,
      avgProductivity: totalDrillingHours > 0 ? (totalMeters / totalDrillingHours).toFixed(2) : 0,
      downtimeBreakdown: {
        mechanical: totalMechanicalDT,
        operational: totalOperationalDT,
        weather: totalWeatherDT,
        safety: totalSafetyDT,
        waiting: totalWaitingDT,
        standby: totalStandby
      }
    };

    res.json({
      summary,
      dailyBreakdown,
      meta: {
        rigId,
        projectId,
        period: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
