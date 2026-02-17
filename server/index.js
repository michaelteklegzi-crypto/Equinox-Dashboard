require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
// PostgreSQL connection for Session Store (Required for Vercel/Serverless)
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Connection pool for Session Store
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

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

// Session middleware - Use PG Store in Production/Vercel
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions', // Must create this table in DB
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // True in Vercel
        sameSite: isProduction ? 'none' : 'lax', // None required for cross-site cookie if separate domains
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
app.use('/api/analytics', analyticsRoutes); // New

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
