const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default coordinates (can be made dynamic based on rig location)
const DEFAULT_LAT = 25.276987; // Example: Middle East
const DEFAULT_LON = 55.296249;

/**
 * Fetch daily weather for a specific date (Historical or Forecast)
 * Checks DB first. If missing, fetches from Open-Meteo.
 */
async function getWeatherForDate(date) {
    // Normalize date to YYYY-MM-DD
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // 1. Check DB
    const cached = await prisma.weatherLog.findUnique({
        where: { date: dateObj }
    });

    if (cached) return cached;

    // 2. Fetch from API
    // We use forecast API for future, archive for past?
    // Open-Meteo Forecast API covers 7 days past + 14 days future.
    try {
        const dateStr = dateObj.toISOString().split('T')[0];
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: DEFAULT_LAT,
                longitude: DEFAULT_LON,
                daily: 'temperature_2m_max,rain_sum,precipitation_hours',
                timezone: 'auto',
                start_date: dateStr,
                end_date: dateStr
            }
        });

        const daily = response.data.daily;
        if (!daily || !daily.time || daily.time.length === 0) return null;

        const rainfall = daily.rain_sum[0] || 0;
        const temp = daily.temperature_2m_max[0] || 0;
        const isRainy = rainfall > 5.0; // Threshold > 5mm

        // 3. Save to DB
        return await prisma.weatherLog.create({
            data: {
                date: dateObj,
                rainfall,
                temperature: temp,
                isRainy
            }
        });
    } catch (error) {
        console.error('Weather API Error:', error.message);
        // Fallback: Return "Average" weather
        return {
            date: dateObj,
            rainfall: 0,
            temperature: 30,
            isRainy: false
        };
    }
}

/**
 * Get weather forecast for next N days
 */
async function getWeatherForecast(days = 14) {
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1); // Start from tomorrow
        forecast.push(await getWeatherForDate(d));
    }
    return forecast;
}

module.exports = {
    getWeatherForDate,
    getWeatherForecast
};
