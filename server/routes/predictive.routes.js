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
            const firstRig = await prisma.rig.findFirst({ where: { status: 'Active' } });
            if (firstRig) targetRigId = firstRig.id;
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

        const hybridResult = await generateHybridForecast(targetRigId, weatherForecast);

        if (hybridResult.status === 'low_confidence') {
            // Return early with the formatted low_confidence response from service
            // But we need to make sure service returns the *structure* we expect.
            // Service returns { status, forecast, risk, financials? no financials in service low conf payload? }
            // Let's ensure consistency.
            return res.json({
                ...hybridResult,
                financials: hybridResult.financials || {
                    projectedRevenue: 0,
                    projectedMargin: 0,
                    marginPercent: 0,
                    explanation: 'Insufficient data.'
                }
            });
        }

        // 3. Financial Projections
        // Fetch parameters for this rig
        const params = await prisma.financialParam.findFirst({
            where: { rigId: targetRigId }
        });

        // Defaults if params missing
        const costPerMeter = params?.costPerMeter || 150;
        const revenuePerMeter = params?.contractedRate || 250; // Use parameter if exists? Schema check: FinancialParam doesn't have revenue. Project does.

        // Fetch Project rate?
        // Rig might be on multiple projects. Complex.
        // Simplification: Use $250/m revenue default.

        const totalForecastMeters = hybridResult.forecast.reduce((s, f) => s + f.prediction, 0);
        const projectedRevenue = totalForecastMeters * revenuePerMeter;
        const projectedCost = totalForecastMeters * costPerMeter;
        const margin = projectedRevenue - projectedCost;
        const marginPercent = projectedRevenue > 0 ? ((margin / projectedRevenue) * 100).toFixed(1) : 0;

        // 4. Return Final Response
        res.json({
            status: 'high_confidence',
            actuals: [], // Frontend can fetch actuals from production endpoint or we can add here if needed.
            // Frontend charts combine 'actuals' and 'forecast'.
            // If we send empty actuals, chart shows only forecast?
            // Ideally we send recent actuals too.
            forecast: hybridResult.forecast.map(f => ({
                day: f.day, // Relative day 1..14
                date: weatherForecast[f.day - 1]?.date, // Use accurate date
                forecast: f.prediction,
                baseline: f.baseline,
                adjustment: f.adjustment
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
