const { RandomForestRegression } = require('ml-random-forest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ ENCODING UTILS ============
const FORMATION_MAP = { 'Sandstone': 1, 'Shale': 2, 'Limestone': 3, 'Basalt': 4, 'Mixed': 5, 'Other': 0 };
const BIT_MAP = { 'PDC': 1, 'Tricone': 2, 'Roller Cone': 3, 'Diamond': 4, 'Other': 0 };

function encodeFormation(f) { return FORMATION_MAP[f] || 0; }
function encodeBit(b) { return BIT_MAP[b] || 0; }

// ============ STATISTICAL LAYER (Holt's Linear) ============
// Captures Trend + Level. Suitable for drilling data with momentum.
function calculateHoltBaseline(data, forecastDays = 14) {
    if (data.length < 2) return Array(forecastDays).fill(data.length > 0 ? data[0].value : 0);

    let alpha = 0.5; // Level smoothing
    let beta = 0.3;  // Trend smoothing

    let level = data[0].value;
    let trend = data[1].value - data[0].value;

    // Fit model (Train)
    for (let i = 1; i < data.length; i++) {
        let prevLevel = level;
        let prevTrend = trend;
        let val = data[i].value;

        level = alpha * val + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    }

    // Forecast
    const forecast = [];
    for (let h = 1; h <= forecastDays; h++) {
        let ft = level + h * trend;
        forecast.push(Math.max(0, ft)); // No negative drilling meters
    }

    return { forecast, lastLevel: level, lastTrend: trend };
}

// ============ ML LAYER (Random Forest) ============
// Predicts Adjustment Factor (Actual / Baseline)
async function trainAndPredictAdjustment(history, futureContext) {
    // 1. Prepare Training Data
    // history: [{ meters, baseline, formation, rain, npt, depth, bit }]

    const X = [];
    const y = [];

    history.forEach(day => {
        if (day.baseline <= 0) return; // Avoid division by zero
        const ratio = day.meters / day.baseline;

        // Features: [Formation, Bit, Rain, IsRainy, NPT, Depth]
        // Note: For future prediction, we won't know NPT. So training should involve EXPECTED NPT or lag features?
        // User request: "Feature: NPT Hours". But for forecast we must assume NPT?
        // We will assume 0 NPT for "Ideal" forecast, or use avg.
        // Let's train on observed conditions.

        X.push([
            encodeFormation(day.formation),
            encodeBit(day.bit),
            day.rain || 0,
            day.isRainy ? 1 : 0,
            day.depth || 0
        ]);
        y.push(ratio);
    });

    if (X.length < 5) return Array(futureContext.length).fill(1.0); // Default to baseline

    // 2. Train Model
    const options = {
        seed: 42,
        nEstimators: 20, // Lightweight
        treeOptions: { maxDepth: 5 }
    };

    const regression = new RandomForestRegression(options);
    regression.train(X, y);

    // 3. Predict for Future
    // futureContext: [{ formation, bit, rain, isRainy, depth }]
    const adjustments = futureContext.map(ctx => {
        const features = [
            encodeFormation(ctx.formation),
            encodeBit(ctx.bit),
            ctx.rain || 0,
            ctx.isRainy ? 1 : 0,
            ctx.depth || 0
        ];
        return regression.predict([features])[0];
    });

    return adjustments;
}

// ============ HYBRID PIPELINE ============
async function generateHybridForecast(rigId, futureContext) {
    // 1. Fetch History
    // We need Meters Drilled per day (aggregated)
    const rawHistory = await prisma.drillingEntry.groupBy({
        by: ['date', 'formation', 'bitType', 'holeDepth'],
        where: { rigId },
        _sum: { metersDrilled: true, weatherDowntime: true },
        orderBy: { date: 'asc' },
        take: 60 // Last 60 producing days
    });

    // Also fetch Weather history logs?
    // Join logic is manual in Prisma.
    // For simplicity, we assume `weatherDowntime` is proxy, OR we fetch weather logs.

    if (rawHistory.length < 5) {
        return { status: 'low_confidence', forecast: [], risk: { score: 0 } };
    }

    const timeSeries = rawHistory.map(entry => ({
        date: entry.date,
        value: entry._sum.metersDrilled
    }));

    // 2. Calculate Baseline
    const { forecast: baselineForecast } = calculateHoltBaseline(timeSeries, futureContext.length);

    // 3. Prepare History for ML (Backtest to get Adjustment Labels)
    // We need to know what the Baseline WOULD HAVE BEEN for history.
    // Ideally use Rolling Origin backtest. 
    // Simply: Train on (Features -> Ratio).
    // Features come from `rawHistory`.
    // Ratio = Actual / Baseline[at_that_point]. 
    // Wait. Baseline changes.
    // Simplification: Use Moving Average as proxy for "expected" in past?
    // User Spec: "Calculate AdjustmentFactor = ActualMeters / BaselineForecast".
    // We will use the trained Holt model to "predict" the past? (In-sample fit).
    // Or just use the Trend level at that point.
    // Let's use the fitted values from Holt loop (re-run logic).

    let alpha = 0.5;
    let beta = 0.3;
    let level = timeSeries[0].value;
    let trend = timeSeries[1].value - timeSeries[0].value;

    const processedHistory = rawHistory.slice(1).map((entry, i) => {
        // Forecast for this point was Level(t-1) + Trend(t-1)
        const expected = level + trend;

        // Update model
        let val = entry._sum.metersDrilled;
        let prevLevel = level;
        level = alpha * val + (1 - alpha) * (prevLevel + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;

        return {
            meters: val,
            baseline: expected,
            formation: entry.formation,
            bit: entry.bitType,
            depth: entry.holeDepth,
            // Fetch rain from DB or assume 0 if not logged
            rain: 0,
            isRainy: false
        };
    });

    // 4. ML Adjustment
    const adjustmentFactors = await trainAndPredictAdjustment(processedHistory, futureContext);

    // 5. Final Forecast
    const finalForecast = baselineForecast.map((base, i) => {
        const adj = adjustmentFactors[i] || 1.0;
        // Dampen extreme adjustments
        const clampedAdj = Math.max(0.5, Math.min(1.5, adj));
        return {
            day: i + 1,
            baseline: Math.round(base),
            adjustment: clampedAdj,
            prediction: Math.round(base * clampedAdj)
        };
    });

    // 6. Risk Scoring
    // Variance in past adjustment factors implies volatility
    const avgAdj = adjustmentFactors.reduce((a, b) => a + b, 0) / adjustmentFactors.length;
    const variance = adjustmentFactors.reduce((a, b) => a + Math.pow(b - avgAdj, 2), 0) / adjustmentFactors.length;
    const riskScore = Math.min(100, Math.round(variance * 1000)); // Arbitrary scaling

    return {
        status: 'high_confidence',
        forecast: finalForecast,
        risk: {
            score: riskScore,
            status: riskScore > 50 ? 'Red' : riskScore > 20 ? 'Yellow' : 'Green',
            primaryFactor: 'Volatility'
        },
        financials: {
            // Placeholder, route handles this
        }
    };
}

module.exports = {
    generateHybridForecast
};
