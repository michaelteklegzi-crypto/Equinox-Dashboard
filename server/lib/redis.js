const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

connection.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

connection.on('connect', () => {
    console.log('Redis connected successfully');
});

module.exports = connection;
