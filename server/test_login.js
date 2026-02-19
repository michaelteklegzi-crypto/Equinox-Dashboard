const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function testLogin() {
    console.log("Testing Login...");
    const email = "ai@admin.com";
    const password = "password123";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found.");
        return;
    }

    console.log("Found user:", user.email);
    console.log("Stored Hash:", user.password);

    const match = await bcrypt.compare(password, user.password);
    console.log("Password Valid:", match);
}

testLogin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
