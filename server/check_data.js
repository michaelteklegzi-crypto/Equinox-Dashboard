const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking DrillingEntry count...');
        const count = await prisma.drillingEntry.count();
        console.log('DrillingEntry count:', count);

        // Check recent entries
        const now = new Date();
        const fourteenDaysAgo = new Date(now.setDate(now.getDate() - 14));
        const recent = await prisma.drillingEntry.count({
            where: {
                createdAt: { gte: fourteenDaysAgo }
            }
        });
        console.log('Recent DrillingEntry count (14 days):', recent);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
