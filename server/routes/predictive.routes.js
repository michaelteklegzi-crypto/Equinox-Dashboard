const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const ss = require('simple-statistics');
const prisma = new PrismaClient();

// Helper: Calculate Rolling Average
const calculateRollingAvg = (data, windowSize) => {
    return data.map((d, i, arr) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = arr.slice(start, i + 1);
        const sum = window.reduce((a, b) => a + b, 0);
        return sum / window.length;
    });
};

router.get('/forecast', async (req, res) => {
    try {
        const { scenario = 'normal', days = 90, rigId } = req.query;
        const forecastDays = parseInt(days) || 90;

        // 1. Fetch Historical Data (Last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const where = { date: { gte: ninetyDaysAgo } };
        if (rigId) where.rigId = rigId;

        const entries = await prisma.drillingEntry.groupBy({
            by: ['date'],
            where,
            _sum: { metersDrilled: true, nptHours: true },
            orderBy: { date: 'asc' },
        });

        // Prepare data for regression: [dayIndex, meters]
        const dataPoints = entries.map((e, i) => [i, e._sum.metersDrilled || 0]);
        const actuals = entries.map(e => ({
            date: new Date(e.date).toISOString().split('T')[0],
            actual: e._sum.metersDrilled || 0,
            npt: e._sum.nptHours || 0
        }));

        if (dataPoints.length < 5) {
            return res.json({ status: 'low_confidence', message: 'Insufficient data for reliable forecast', actuals: actuals, forecast: [] });
        }

        // 2. Linear Regression
        const regression = ss.linearRegression(dataPoints);
        let m = regression.m; // Slope
        let b = regression.b; // Intercept
        const line = ss.linearRegressionLine(regression);

        // 3. Apply Scenario Modifiers
        let confidenceMultiplier = 1.0;
        let explanation = "";

        if (scenario === 'optimistic') {
            m *= 1.15; // 15% improvement in productivity trend
            // b *= 1.05; // Higher starting point
            confidenceMultiplier = 1.2;
            explanation = "Forecast increased by 15% assuming >95% availability and optimal drilling conditions.";
        } else if (scenario === 'conservative') {
            m *= 0.85; // 15% reduction
            confidenceMultiplier = 0.8;
            explanation = "Forecast reduced by 15% to account for potential maintenance risks and historical downtime patterns.";
        } else {
            explanation = "Forecast based on standard linear regression of last 90 days performance.";
        }

        // 4. Generate Forecast
        const forecast = [];
        const lastDate = new Date(entries[entries.length - 1].date);

        // Calculate Confidence Interval (Simplified Standard Error)
        const residuals = dataPoints.map(p => p[1] - line(p[0]));
        const stdDev = ss.standardDeviation(residuals);
        const marginOfError = 1.96 * stdDev; // 95% Confidence

        for (let i = 1; i <= forecastDays; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);

            // Forecast value based on new slope
            const x = dataPoints.length + i;
            const y = (m * x) + b;

            // Safety: Don't predict negative drilling
            const predictedMeters = Math.max(0, Math.round(y));

            forecast.push({
                date: nextDate.toISOString().split('T')[0],
                forecast: predictedMeters,
                ciHigh: Math.round(predictedMeters + marginOfError * confidenceMultiplier),
                ciLow: Math.max(0, Math.round(predictedMeters - marginOfError * confidenceMultiplier)),
            });
        }

        // 5. Reliability Risk (NPT Analysis)
        const recentEntries = await prisma.drillingEntry.findMany({
            where: { date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }, // Last 14 days
            select: { nptHours: true, downtimeCategory: true }
        });

        const totalRecentNpt = recentEntries.reduce((s, e) => s + (e.nptHours || 0), 0);
        const nptRiskScore = Math.min(100, (totalRecentNpt / (14 * 24)) * 100); // % of time down in last 2 weeks? 
        // Better: Frequency of Mechanical Failure
        const mechFailures = recentEntries.filter(e => e.downtimeCategory === 'Mechanical').length;

        let riskStatus = 'Green';
        let riskMsg = "Normal maintenance levels.";
        if (mechFailures > 5 || nptRiskScore > 15) {
            riskStatus = 'Red';
            riskMsg = "High Risk: significant mechanical downtime detected in last 14 days.";
        } else if (mechFailures > 2 || nptRiskScore > 5) {
            riskStatus = 'Yellow';
            riskMsg = "Moderate Risk: monitoring required.";
        }

        // 6. Financial Bridge
        // Estimate revenue/margin based on financial params or defaults
        const totalForecastMeters = forecast.reduce((s, f) => s + f.forecast, 0);
        const params = await prisma.financialParam.findFirst({ where: rigId ? { rigId } : {} });

        const costPerMeter = params?.costPerMeter || 150; // default
        const revenuePerMeter = 250; // hypothetical contract rate

        const projectedRevenue = totalForecastMeters * revenuePerMeter;
        const projectedCost = totalForecastMeters * costPerMeter;
        const projectedMargin = projectedRevenue - projectedCost;
        const marginPercent = projectedRevenue > 0 ? (projectedMargin / projectedRevenue) * 100 : 0;

        res.json({
            actuals,
            forecast,
            risk: {
                score: Math.round(nptRiskScore),
                status: riskStatus,
                message: riskMsg,
                primaryFactor: mechFailures > 2 ? "Mechanical Reliability" : "General Operations"
            },
            financials: {
                projectedRevenue,
                projectedMargin,
                marginPercent: marginPercent.toFixed(1),
                explanation
            }
        });

    } catch (error) {
        console.error('Predictive analytics error:', error);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
});

module.exports = router;
