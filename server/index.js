require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
// const pgSession = require('connect-pg-simple')(session); // Removed for SQLite
// const { Pool } = require('pg'); // Removed for SQLite

const actionRoutes = require('./routes/actions');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const exportRoutes = require('./routes/export');
const reportRoutes = require('./routes/report.routes'); // New
const maintenanceRoutes = require('./routes/maintenance.routes'); // New

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool removed
/*
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
*/

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

// Session middleware - switched to MemoryStore for local desktop app
app.use(session({
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // process.env.NODE_ENV === 'production', // False for local file/http
        sameSite: 'lax', // process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Basic health check
app.get('/', (req, res) => {
    res.send('Equinox API Running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/actions', actionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportRoutes); // New
app.use('/api/maintenance', maintenanceRoutes); // New

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
