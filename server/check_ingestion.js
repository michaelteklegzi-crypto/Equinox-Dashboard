const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.importStaging.count();
        console.log(`TOTAL_IMPORTED_ROWS: ${count}`);

        if (count > 0) {
            const last = await prisma.importStaging.findFirst({
                orderBy: { createdAt: 'desc' }
            });
            console.log('LATEST_BATCH_ID:', last.batchId);
            console.log('LATEST_STATUS:', last.status);
        } else {
            console.log("No data found in ImportStaging table.");
        }
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
