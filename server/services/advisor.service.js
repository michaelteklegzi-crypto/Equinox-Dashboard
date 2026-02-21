const prisma = require('../db');

/**
 * Get real-time KPI parameters for a specific rig or fleet-wide.
 * Includes 7-day trend data for sparklines.
 */
async function getRigParameters(rigId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where = { date: { gte: thirtyDaysAgo } };
    if (rigId) where.rigId = rigId;

    const whereWeek = { date: { gte: sevenDaysAgo } };
    if (rigId) whereWeek.rigId = rigId;

    // Aggregate KPIs (30-day)
    const totals = await prisma.drillingEntry.aggregate({
        where,
        _sum: {
            metersDrilled: true, nptHours: true, drillingHours: true,
            fuelConsumed: true, consumablesCost: true,
            mechanicalDowntime: true, operationalDelay: true,
            weatherDowntime: true, totalShiftHours: true,
        },
        _avg: { metersDrilled: true, nptHours: true },
        _count: true,
    });

    const totalMeters = totals._sum.metersDrilled || 0;
    const totalDrillingHrs = totals._sum.drillingHours || 0;
    const totalShiftHrs = totals._sum.totalShiftHours || 1;
    const totalNpt = totals._sum.nptHours || 0;
    const totalFuel = totals._sum.fuelConsumed || 0;

    // Calculate ROP (Rate of Penetration) — meters per drilling hour
    const rop = totalDrillingHrs > 0 ? Math.round((totalMeters / totalDrillingHrs) * 100) / 100 : 0;

    // Utilization — drilling hours / total shift hours
    const utilization = totalShiftHrs > 0 ? Math.round((totalDrillingHrs / totalShiftHrs) * 1000) / 10 : 0;

    // NPT ratio
    const nptRatio = totalShiftHrs > 0 ? Math.round((totalNpt / totalShiftHrs) * 1000) / 10 : 0;

    // Cost efficiency — $/meter
    const totalCost = (totals._sum.consumablesCost || 0) + (totalFuel * 1.5); // fuel factor
    const costPerMeter = totalMeters > 0 ? Math.round((totalCost / totalMeters) * 100) / 100 : 0;

    // Fuel efficiency — meters per liter
    const fuelEfficiency = totalFuel > 0 ? Math.round((totalMeters / totalFuel) * 100) / 100 : 0;

    // Active rigs count
    const activeRigs = await prisma.rig.count({ where: { status: 'Active' } });

    // Equipment health average
    const equipment = await prisma.equipment.findMany({
        select: { currentHours: true, lastServiceHours: true, mtbfHours: true }
    });
    let avgHealth = 100;
    if (equipment.length > 0) {
        const healths = equipment.map(eq => {
            const usage = Math.max(0, (eq.currentHours || 0) - (eq.lastServiceHours || 0));
            const mtbf = eq.mtbfHours || 5000;
            return Math.max(0, 100 - (usage / mtbf) * 100);
        });
        avgHealth = Math.round(healths.reduce((a, b) => a + b, 0) / healths.length);
    }

    // 7-day trend data for sparklines
    const dailyEntries = await prisma.drillingEntry.findMany({
        where: whereWeek,
        select: {
            date: true, metersDrilled: true, nptHours: true,
            drillingHours: true, fuelConsumed: true, totalShiftHours: true,
        },
        orderBy: { date: 'asc' },
    });

    // Group by day
    const dailyMap = {};
    for (const e of dailyEntries) {
        const day = e.date.toISOString().split('T')[0];
        if (!dailyMap[day]) {
            dailyMap[day] = { date: day, meters: 0, npt: 0, drillingHrs: 0, fuel: 0, shiftHrs: 0 };
        }
        dailyMap[day].meters += e.metersDrilled || 0;
        dailyMap[day].npt += e.nptHours || 0;
        dailyMap[day].drillingHrs += e.drillingHours || 0;
        dailyMap[day].fuel += e.fuelConsumed || 0;
        dailyMap[day].shiftHrs += e.totalShiftHours || 0;
    }

    const trend = Object.values(dailyMap).map(d => ({
        date: d.date,
        meters: Math.round(d.meters * 100) / 100,
        rop: d.drillingHrs > 0 ? Math.round((d.meters / d.drillingHrs) * 100) / 100 : 0,
        utilization: d.shiftHrs > 0 ? Math.round((d.drillingHrs / d.shiftHrs) * 1000) / 10 : 0,
        npt: Math.round(d.npt * 100) / 100,
        fuel: Math.round(d.fuel * 100) / 100,
    }));

    // Rig info
    let rigInfo = null;
    if (rigId) {
        rigInfo = await prisma.rig.findUnique({
            where: { id: rigId },
            select: { name: true, type: true, status: true, site: true }
        });
    }

    // Last entry info
    const lastEntry = await prisma.drillingEntry.findFirst({
        where: rigId ? { rigId } : {},
        orderBy: { date: 'desc' },
        select: { date: true, holeDepth: true, formation: true, metersDrilled: true, shift: true, rig: { select: { name: true } } }
    });

    return {
        rigInfo,
        lastUpdate: lastEntry?.date || null,
        currentDepth: lastEntry?.holeDepth || 0,
        lastFormation: lastEntry?.formation || '—',
        currentShift: lastEntry?.shift || '—',
        kpis: [
            { id: 'rop', label: 'ROP', value: rop, unit: 'm/hr', trend: trend.map(t => t.rop), status: rop > 5 ? 'good' : rop > 3 ? 'warning' : 'critical' },
            { id: 'utilization', label: 'Utilization', value: utilization, unit: '%', trend: trend.map(t => t.utilization), status: utilization > 70 ? 'good' : utilization > 50 ? 'warning' : 'critical' },
            { id: 'npt', label: 'NPT Hours', value: Math.round(totalNpt * 10) / 10, unit: 'hrs', trend: trend.map(t => t.npt), status: nptRatio < 10 ? 'good' : nptRatio < 20 ? 'warning' : 'critical' },
            { id: 'cost', label: 'Cost/Meter', value: costPerMeter, unit: '$/m', trend: trend.map(t => t.meters > 0 ? Math.round((t.fuel * 1.5) / t.meters * 100) / 100 : 0), status: costPerMeter < 50 ? 'good' : costPerMeter < 100 ? 'warning' : 'critical' },
            { id: 'meters', label: 'Total Meters', value: Math.round(totalMeters), unit: 'm', trend: trend.map(t => t.meters), status: 'good' },
            { id: 'fuel', label: 'Fuel Efficiency', value: fuelEfficiency, unit: 'm/L', trend: trend.map(t => t.fuel > 0 ? Math.round(t.meters / t.fuel * 100) / 100 : 0), status: fuelEfficiency > 0.5 ? 'good' : fuelEfficiency > 0.2 ? 'warning' : 'critical' },
            { id: 'health', label: 'Equip. Health', value: avgHealth, unit: '%', trend: [], status: avgHealth > 70 ? 'good' : avgHealth > 40 ? 'warning' : 'critical' },
            { id: 'rigs', label: 'Active Rigs', value: activeRigs, unit: '', trend: [], status: 'good' },
        ],
        dailyTrend: trend,
    };
}

/**
 * Generate parameter recommendations based on performance patterns.
 */
async function getRecommendations(rigId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const where = { date: { gte: sevenDaysAgo } };
    if (rigId) where.rigId = rigId;

    const entries = await prisma.drillingEntry.findMany({
        where,
        select: {
            metersDrilled: true, drillingHours: true, nptHours: true,
            mechanicalDowntime: true, operationalDelay: true, weatherDowntime: true,
            fuelConsumed: true, formation: true, totalShiftHours: true,
        },
    });

    const recommendations = [];

    if (entries.length === 0) {
        return [{ id: 1, title: 'No Data', description: 'No recent drilling entries found. Add entries to see recommendations.', severity: 'info', icon: '📊' }];
    }

    // Calculate averages
    const avgMeters = entries.reduce((a, e) => a + (e.metersDrilled || 0), 0) / entries.length;
    const avgNpt = entries.reduce((a, e) => a + (e.nptHours || 0), 0) / entries.length;
    const avgMechDown = entries.reduce((a, e) => a + (e.mechanicalDowntime || 0), 0) / entries.length;
    const avgDrillingHrs = entries.reduce((a, e) => a + (e.drillingHours || 0), 0) / entries.length;
    const totalShiftHrs = entries.reduce((a, e) => a + (e.totalShiftHours || 0), 0);
    const totalDrillingHrs = entries.reduce((a, e) => a + (e.drillingHours || 0), 0);

    const utilPct = totalShiftHrs > 0 ? (totalDrillingHrs / totalShiftHrs) * 100 : 0;

    // High NPT warning
    if (avgNpt > 2) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'High Non-Productive Time',
            description: `Average NPT is ${avgNpt.toFixed(1)} hrs/shift. Investigate root causes — top categories may include waiting on parts or operational delays.`,
            severity: avgNpt > 4 ? 'critical' : 'warning',
            icon: '⏱️',
        });
    }

    // Low utilization
    if (utilPct < 65) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'Low Utilization Rate',
            description: `Current utilization is ${utilPct.toFixed(1)}%. Target is 75%+. Review shift handover procedures and reduce standby time.`,
            severity: utilPct < 50 ? 'critical' : 'warning',
            icon: '📉',
        });
    }

    // Mechanical downtime
    if (avgMechDown > 1) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'Mechanical Downtime Elevated',
            description: `Averaging ${avgMechDown.toFixed(1)} hrs/shift mechanical downtime. Review preventive maintenance schedules and equipment health scores.`,
            severity: avgMechDown > 3 ? 'critical' : 'warning',
            icon: '🔧',
        });
    }

    // Good performance
    if (utilPct > 75 && avgNpt < 1.5) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'Strong Performance',
            description: `Utilization at ${utilPct.toFixed(1)}% with low NPT. Current parameters are performing well — maintain current approach.`,
            severity: 'good',
            icon: '✅',
        });
    }

    // ROP check
    const avgRop = avgDrillingHrs > 0 ? avgMeters / avgDrillingHrs : 0;
    if (avgRop > 0 && avgRop < 3) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'Low Rate of Penetration',
            description: `Average ROP is ${avgRop.toFixed(2)} m/hr. Consider reviewing bit selection, WOB, and RPM parameters for optimization.`,
            severity: 'warning',
            icon: '🔄',
        });
    }

    // Equipment health check
    const equipment = await prisma.equipment.findMany({
        select: { name: true, currentHours: true, lastServiceHours: true, mtbfHours: true }
    });
    const criticalEquip = equipment.filter(eq => {
        const usage = Math.max(0, (eq.currentHours || 0) - (eq.lastServiceHours || 0));
        const mtbf = eq.mtbfHours || 5000;
        return usage / mtbf >= 0.9;
    });

    if (criticalEquip.length > 0) {
        recommendations.push({
            id: recommendations.length + 1,
            title: 'Equipment Service Due',
            description: `${criticalEquip.length} equipment item(s) approaching or exceeding service interval: ${criticalEquip.map(e => e.name).join(', ')}.`,
            severity: 'critical',
            icon: '⚠️',
        });
    }

    // Fuel efficiency
    const totalFuel = entries.reduce((a, e) => a + (e.fuelConsumed || 0), 0);
    const totalMeters = entries.reduce((a, e) => a + (e.metersDrilled || 0), 0);
    if (totalFuel > 0 && totalMeters > 0) {
        const fuelEff = totalMeters / totalFuel;
        if (fuelEff < 0.2) {
            recommendations.push({
                id: recommendations.length + 1,
                title: 'Fuel Consumption High',
                description: `Fuel efficiency is ${fuelEff.toFixed(3)} m/L — below optimal range. Check engine conditions and idle time.`,
                severity: 'warning',
                icon: '⛽',
            });
        }
    }

    if (recommendations.length === 0) {
        recommendations.push({
            id: 1,
            title: 'All Systems Normal',
            description: 'All parameters are within acceptable ranges. No immediate action required.',
            severity: 'good',
            icon: '✅',
        });
    }

    return recommendations;
}

/**
 * Fleet comparison — performance side-by-side for all rigs.
 */
async function getFleetComparison() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rigs = await prisma.rig.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true, type: true }
    });

    const comparison = [];

    for (const rig of rigs) {
        const totals = await prisma.drillingEntry.aggregate({
            where: { rigId: rig.id, date: { gte: sevenDaysAgo } },
            _sum: { metersDrilled: true, nptHours: true, drillingHours: true, totalShiftHours: true },
            _count: true,
        });

        const meters = totals._sum.metersDrilled || 0;
        const drillingHrs = totals._sum.drillingHours || 0;
        const shiftHrs = totals._sum.totalShiftHours || 1;
        const npt = totals._sum.nptHours || 0;

        comparison.push({
            rigId: rig.id,
            rigName: rig.name,
            rigType: rig.type,
            totalMeters: Math.round(meters),
            rop: drillingHrs > 0 ? Math.round((meters / drillingHrs) * 100) / 100 : 0,
            utilization: Math.round((drillingHrs / shiftHrs) * 1000) / 10,
            nptHours: Math.round(npt * 10) / 10,
            entries: totals._count,
        });
    }

    return comparison.sort((a, b) => b.totalMeters - a.totalMeters);
}

module.exports = { getRigParameters, getRecommendations, getFleetComparison };
