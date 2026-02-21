const prisma = require('../db');

/**
 * Build a data context string from the database for the AI to reference.
 * Fetches recent entries, rig stats, equipment health, and KPIs.
 */
async function buildDataContext(rigId) {
    const context = {};

    // 1. Rig fleet overview
    const rigs = await prisma.rig.findMany({
        select: { id: true, name: true, type: true, status: true, site: true }
    });
    context.rigs = rigs;

    // 2. Recent drilling entries (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entryWhere = { date: { gte: thirtyDaysAgo } };
    if (rigId) entryWhere.rigId = rigId;

    const recentEntries = await prisma.drillingEntry.findMany({
        where: entryWhere,
        select: {
            date: true, shift: true, metersDrilled: true,
            holeDepth: true, nptHours: true, drillingHours: true,
            fuelConsumed: true, consumablesCost: true, formation: true,
            mechanicalDowntime: true, operationalDelay: true, weatherDowntime: true,
            rig: { select: { name: true, type: true } },
            project: { select: { name: true, clientName: true } },
        },
        orderBy: { date: 'desc' },
        take: 50,
    });
    context.recentEntries = recentEntries;

    // 3. Aggregated KPIs
    const totals = await prisma.drillingEntry.aggregate({
        where: entryWhere,
        _sum: { metersDrilled: true, nptHours: true, drillingHours: true, fuelConsumed: true, consumablesCost: true },
        _avg: { metersDrilled: true, nptHours: true },
        _count: true,
    });
    context.kpis = {
        totalMetersDrilled: totals._sum.metersDrilled || 0,
        totalNptHours: totals._sum.nptHours || 0,
        totalDrillingHours: totals._sum.drillingHours || 0,
        totalFuelConsumed: totals._sum.fuelConsumed || 0,
        avgMetersPerEntry: Math.round((totals._avg.metersDrilled || 0) * 100) / 100,
        avgNptPerEntry: Math.round((totals._avg.nptHours || 0) * 100) / 100,
        entryCount: totals._count,
    };

    // 4. Per-rig performance
    const rigPerf = await prisma.drillingEntry.groupBy({
        by: ['rigId'],
        where: entryWhere,
        _sum: { metersDrilled: true, nptHours: true, drillingHours: true },
        _avg: { metersDrilled: true },
        _count: true,
    });
    const rigMap = Object.fromEntries(rigs.map(r => [r.id, r.name]));
    context.rigPerformance = rigPerf.map(r => ({
        rigName: rigMap[r.rigId] || 'Unknown',
        totalMeters: r._sum.metersDrilled || 0,
        totalNpt: r._sum.nptHours || 0,
        totalDrillingHours: r._sum.drillingHours || 0,
        avgMetersPerShift: Math.round((r._avg.metersDrilled || 0) * 100) / 100,
        entries: r._count,
    }));

    // 5. Equipment health
    const equipment = await prisma.equipment.findMany({
        select: { name: true, type: true, currentHours: true, lastServiceHours: true, mtbfHours: true, currentRiskScore: true }
    });
    context.equipment = equipment.map(eq => {
        const usage = Math.max(0, (eq.currentHours || 0) - (eq.lastServiceHours || 0));
        const mtbf = eq.mtbfHours || 5000;
        const healthPct = Math.max(0, Math.round(100 - (usage / mtbf) * 100));
        return { name: eq.name, type: eq.type, hours: eq.currentHours, healthPercent: healthPct };
    });

    // 6. Active projects
    const projects = await prisma.project.findMany({
        where: { status: 'Active' },
        select: { name: true, clientName: true, location: true, status: true }
    });
    context.projects = projects;

    // 7. Maintenance logs (recent)
    const recentMaint = await prisma.maintenanceLog.findMany({
        orderBy: { datePerformed: 'desc' },
        take: 10,
        select: { equipmentName: true, maintenanceType: true, description: true, cost: true, datePerformed: true }
    });
    context.recentMaintenance = recentMaint;

    return context;
}

/**
 * Send a chat message to Gemini with drilling data context.
 */
async function chat(message, conversationHistory = [], rigId = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            response: "⚠️ AI Assistant is not configured. Please add a GEMINI_API_KEY to your server .env file. You can get a free key at https://aistudio.google.com/apikey",
            error: true
        };
    }

    // Build data context
    const dataContext = await buildDataContext(rigId);

    const systemPrompt = `You are EQUINOX AI, an intelligent drilling operations assistant for the Equinox Fleet Dashboard. 
You have access to the company's real drilling data and should answer questions based on it.

IMPORTANT RULES:
- Always reference actual data from the context provided
- Format numbers nicely (e.g., "1,234.5 meters" not "1234.5")
- Use tables when comparing multiple items (format as markdown tables)
- Be concise but thorough
- If data is insufficient for a question, say so honestly
- You can do calculations on the data (averages, trends, comparisons)
- Suggest actionable insights when relevant
- Use emoji sparingly for key metrics (📊 📈 ⚠️ ✅)

CURRENT DATA CONTEXT:
${JSON.stringify(dataContext, null, 2)}`;

    // Build messages array
    const messages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I have access to the current drilling data context. I will answer questions based on this real data. How can I help you?' }] },
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
        messages.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }

    // Add current message
    messages.push({ role: 'user', parts: [{ text: message }] });

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messages,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API error:', data.error);
            return { response: `API Error: ${data.error.message}`, error: true };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        return { response: text, error: false };
    } catch (err) {
        console.error('AI chat error:', err);
        return { response: `Connection error: ${err.message}`, error: true };
    }
}

/**
 * Generate suggested questions based on current data.
 */
async function getSuggestions() {
    const rigCount = await prisma.rig.count();
    const entryCount = await prisma.drillingEntry.count();
    const equipCount = await prisma.equipment.count();

    const suggestions = [
        "What is my best performing rig this month?",
        "Show me a summary of total meters drilled",
        "Which equipment needs maintenance soon?",
        "Compare downtime across all rigs",
    ];

    if (rigCount > 1) suggestions.push("Which rig has the highest utilization?");
    if (entryCount > 10) suggestions.push("What's the drilling trend over the last 30 days?");
    if (equipCount > 0) suggestions.push("Give me an equipment health overview");

    return suggestions;
}

module.exports = { chat, getSuggestions, buildDataContext };
