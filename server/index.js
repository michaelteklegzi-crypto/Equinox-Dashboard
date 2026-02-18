require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
// Prisma Session Store (Uses existing Prisma Client connection)
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const app = express();
// Required for Vercel (behind proxy) to detect HTTPS
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and Vercel deployments
        if (origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // Allow FRONTEND_URL if set
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        callback(null, true); // Permissive for local Electron dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Basic health check - MOVED BEFORE SESSION TO DIAGNOSE DB/SESSION ISSUES
app.get('/api/health-check', async (req, res) => {
    try {
        // Test DB Connection
        const userCount = await prisma.user.count();
        res.json({
            status: 'ok',
            timestamp: new Date(),
            db: 'connected',
            userCount,
            env: process.env.NODE_ENV
        });
    } catch (error) {
        console.error('Health Check DB Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Session middleware - Use Prisma Store
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    store: new PrismaSessionStore(
        prisma,
        {
            checkPeriod: 2 * 60 * 1000,  // ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    ),
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // True in Vercel
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Simple Health Check (No DB) - To verify Server Start
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'pong',
        message: 'Server is running',
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
    });
});


app.get('/', (req, res) => {
    res.send('Equinox API Running');
});

// app.get('/api/health'...) removed as replaced by /api/health-check above

app.use('/api/actions', actionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportRoutes); // New
app.use('/api/maintenance', maintenanceRoutes); // New
app.use('/api/analytics', analyticsRoutes); // New

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: isProduction ? '🥞' : err.stack
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
