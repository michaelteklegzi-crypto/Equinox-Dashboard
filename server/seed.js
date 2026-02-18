require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const password = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
            password: password // Ensure password is set even on update if you want
        },
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'Admin',
            password: password,
        },
    });

    const user1 = await prisma.user.upsert({
        where: { email: 'john.doe@example.com' },
        update: {
            password: password
        },
        create: {
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'User',
            password: password,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jane.smith@example.com' },
        update: {
            password: password
        },
        create: {
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            role: 'User',
            password: password,
        },
    });

    console.log({ admin, user1, user2 });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
