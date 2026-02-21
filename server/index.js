require('dotenv').config();

// Fallback env vars for Vercel (env var UI not saving correctly)
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres.zwdupsecfokebveprnyr:vTVJMQpzq4XheAWF@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
}
if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "equinox-dashboard-secret-change-in-production";
}

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rigsRoutes = require('./routes/rigs.routes');
const projectsRoutes = require('./routes/projects.routes');
const drillingRoutes = require('./routes/drilling.routes');
const reportRoutes = require('./routes/report.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const ingestionRoutes = require('./routes/ingestion.routes'); // Phase 1
// BullMQ/Redis removed — ingestion now processes synchronously

const app = express();
app.set('trust proxy', 1);
app.set('trust proxy', 1);
const prisma = require('./db');
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

// Health check (before session)
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
        nodeEnv: process.env.NODE_ENV || 'NOT SET',
    });
});

// Session middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: false,
        dbRecordIdFunction: undefined,
    }),
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key',
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
    res.send('Equinox Fleet API Running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rigs', rigsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/drilling', drillingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/financial-params', require('./routes/financial.routes'));
app.use('/api/predictive', require('./routes/predictive.routes'));
app.use('/api/ingest', ingestionRoutes); // Phase 1
app.use('/api/ai', require('./routes/ai.routes')); // Phase 4
app.use('/api/advisor', require('./routes/advisor.routes')); // Phase 4

// Ingestion workers now run synchronously — no Redis/BullMQ needed

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
