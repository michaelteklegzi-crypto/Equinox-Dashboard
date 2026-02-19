const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function resetSimple() {
    console.log("Resetting to 123456...");
    const email = "ai@admin.com";
    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });
    console.log("Password reset done.");
}

resetSimple()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
