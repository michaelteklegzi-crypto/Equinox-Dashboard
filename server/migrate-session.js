const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'prisma/migrations/session_table.sql'), 'utf8');
        await client.query(sql);
        console.log('Session table created successfully');
    } catch (err) {
        console.error('Error creating session table:', err);
    } finally {
        await client.end();
    }
}

run();
