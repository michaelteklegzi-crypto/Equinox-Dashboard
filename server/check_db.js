const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({ take: 1, select: { id: true, email: true } });
        console.log(`Users in DB: ${userCount}`);
        console.log('Sample User:', users[0]);

        const stagingCount = await prisma.importStaging.count();
        console.log(`Staging Rows: ${stagingCount}`);

        const stagingSamples = await prisma.importStaging.findMany({
            take: 2,
            orderBy: { createdAt: 'desc' }
        });
        console.log('Sample Staging:', stagingSamples);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
