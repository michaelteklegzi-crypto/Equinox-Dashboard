const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function listUsers() {
    console.log("Listing Users...");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
    });
    console.table(users);
}

listUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
