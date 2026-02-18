require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

// Route imports
const actionRoutes = require('./routes/actions');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const exportRoutes = require('./routes/export');
const reportRoutes = require('./routes/report.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
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

// Health check (before session middleware)
app.get('/api/health-check', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ status: 'ok', db: 'connected', userCount, env: process.env.NODE_ENV });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/ping', (req, res) => {
    res.json({
        status: 'pong',
        timestamp: new Date().toISOString(),
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
        hasSessionSecret: !!process.env.SESSION_SECRET,
        nodeEnv: process.env.NODE_ENV || 'NOT SET',
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('SESSION') || k.includes('NODE_ENV'))
    });
});

// Session middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    }),
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.get('/', (req, res) => {
    res.send('Equinox API Running');
});

// Routes
app.use('/api/actions', actionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Local dev only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
