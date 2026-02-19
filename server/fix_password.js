const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const prisma = new PrismaClient();

async function fixPassword() {
    console.log("Fixing Admin Password...");

    const email = "ai@admin.com";
    const password = "password123";

    // Generate valid hash
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Password for ${email} updated. New login: ${password}`);
    } else {
        console.log("User not found!");
    }
}

fixPassword()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
