const { generateHybridForecast } = require('./services/forecasting.service');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function runTest() {
    console.log("=== Testing Hybrid AI Engine ===");

    // 1. Get a Rig
    const rig = await prisma.rig.findFirst();
    if (!rig) {
        console.log("No rigs found using prisma.rig.findFirst()");
        // Create dummy rig if needed, or rely on existing seed
        return;
    }
    console.log(`Using Rig: ${rig.name} (${rig.id})`);

    // 2. Mock Weather Forecast (14 days)
    const mockWeather = Array(14).fill(0).map((_, i) => ({
        date: new Date(Date.now() + (i + 1) * 86400000),
        rainfall: i === 3 ? 25.0 : 0, // Rain on day 4
        measurement: i === 3 ? 25.0 : 0,
        temperature: 30,
        isRainy: i === 3
    }));
    console.log(`Mock Weather: ${mockWeather.filter(w => w.isRainy).length} rainy days.`);

    // 3. Run Forecast
    try {
        const result = await generateHybridForecast(rig.id, mockWeather);
        console.log("\nResults:");
        console.log(`Status: ${result.status}`);

        if (result.status === 'low_confidence') {
            console.log("Low Confidence (Expected if < 5 days history).");
            console.log("Risk Score:", result.risk?.score);
        } else {
            console.log(`Forecast Days: ${result.forecast.length}`);
            console.log("Risk Score:", result.risk.score);
            console.log("First 3 Days:");
            result.forecast.slice(0, 3).forEach(day => {
                console.log(`  Day ${day.day}: Base=${day.baseline}, Adj=${day.adjustment.toFixed(2)} => Final=${day.prediction}`);
            });
        }

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
