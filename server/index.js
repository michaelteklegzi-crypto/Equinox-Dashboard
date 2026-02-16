require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const actionRoutes = require('./routes/actions');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const exportRoutes = require('./routes/export');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool for session store
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

app.use(cors({
    origin: ['http://localhost:5173', process.env.FRONTEND_URL], // Add your Vercel URL here later
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Session middleware with persistent store
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session' // Use a custom table or default 'session'
    }),
    secret: process.env.SESSION_SECRET || 'equinox-dashboard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true on https
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // vital for cross-site cookie
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/actions', actionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/export', exportRoutes);

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
