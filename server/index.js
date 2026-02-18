require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// ============ MINIMAL DEBUG SERVER ============
// All routes and DB disabled to prove the server can start on Vercel

app.get('/api/ping', (req, res) => {
    res.json({
        status: 'pong',
        message: 'Equinox server is alive!',
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('Equinox API Running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Local dev only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
