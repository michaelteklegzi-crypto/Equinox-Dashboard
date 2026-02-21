const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateHybridForecast } = require('../services/forecasting.service');
const { getWeatherForecast } = require('../services/weather.service');

// GET /api/predictive/forecast
router.get('/forecast', async (req, res) => {
    try {
        const { rigId, startDate, endDate, scenario } = req.query;

        // 1. Get Weather Context for next 14 days
        // We need to pass valid date range if we want historical weather context?
        // generateHybridForecast handles historical context internally via DB summaries.
        // We just need future context for the prediction period.
        const weatherForecast = await getWeatherForecast(14);

        // 2. Generate Hybrid Forecast
        // If rigId is not provided, we might need a default rig or aggregate?
        // For now, let's pick the first active rig if not provided, or return error.
        let targetRigId = rigId;
        if (!targetRigId) {
            // Find the rig with the MOST drilling history to ensure the ML model has enough data
            const bestRig = await prisma.drillingEntry.groupBy({
                by: ['rigId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 1
            });
            if (bestRig.length > 0) {
                targetRigId = bestRig[0].rigId;
            } else {
                const firstRig = await prisma.rig.findFirst({ where: { status: 'Active' } });
                if (firstRig) targetRigId = firstRig.id;
            }
        }

        if (!targetRigId) {
            return res.json({
                status: 'low_confidence',
                message: 'No active rigs found to forecast.',
                forecast: [],
                risk: { score: 0, status: 'Gray', message: 'No Rigs', primaryFactor: 'None' },
                financials: { projectedRevenue: 0, projectedMargin: 0, marginPercent: 0, explanation: 'No Rigs' }
            });
        }

        let hybridResult;
        try {
            hybridResult = await generateHybridForecast(targetRigId, weatherForecast);
        } catch (mlError) {
            console.error('ML Forecast Error:', mlError.message);
            return res.json({
                status: 'low_confidence',
                message: 'The forecasting model encountered an error. This usually means there is not enough historical data yet.',
                forecast: [],
                actuals: [],
                risk: { score: 0, status: 'Gray', message: 'Model unavailable', primaryFactor: 'Insufficient data' },
                financials: { projectedRevenue: 0, projectedMargin: 0, marginPercent: 0, explanation: 'Forecast unavailable — add more production data.' }
            });
        }

        if (hybridResult.status === 'low_confidence') {
            return res.json({
                ...hybridResult,
                actuals: [],
                forecast: hybridResult.forecast || [],
                risk: hybridResult.risk || { score: 0, status: 'Gray', message: 'Insufficient data', primaryFactor: 'None' },
                financials: hybridResult.financials || {
                    projectedRevenue: 0,
                    projectedMargin: 0,
                    marginPercent: 0,
                    explanation: 'Insufficient data.'
                }
            });
        }

        // 3. Financial Projections
        const params = await prisma.financialParam.findFirst({
            where: { rigId: targetRigId }
        });

        const costPerMeter = params?.costPerMeter || 150;
        const revenuePerMeter = params?.contractedRate || 250;

        const totalForecastMeters = hybridResult.forecast.reduce((s, f) => s + f.prediction, 0);
        const projectedRevenue = totalForecastMeters * revenuePerMeter;
        const projectedCost = totalForecastMeters * costPerMeter;
        const margin = projectedRevenue - projectedCost;
        const marginPercent = projectedRevenue > 0 ? ((margin / projectedRevenue) * 100).toFixed(1) : 0;

        // 4. Return Final Response
        res.json({
            status: 'high_confidence',
            actuals: [],
            forecast: hybridResult.forecast.map(f => ({
                day: f.day,
                date: weatherForecast[f.day - 1]?.date,
                forecast: f.prediction,
                baseline: f.baseline,
                adjustment: f.adjustment,
                ciHigh: f.ciHigh,
                ciLow: f.ciLow
            })),
            risk: hybridResult.risk,
            financials: {
                projectedRevenue,
                projectedMargin: margin,
                marginPercent,
                explanation: `Forecast adjusted by AI (Avg factor ${(hybridResult.forecast.reduce((s, f) => s + f.adjustment, 0) / hybridResult.forecast.length).toFixed(2)
                    }x) considering ${weatherForecast.filter(w => w.isRainy).length} rainy days.`
            }
        });

    } catch (error) {
        console.error('Predictive API Error:', error);
        res.status(500).json({ error: 'Failed to generate forecast', details: error.message });
    }
});

module.exports = router;
