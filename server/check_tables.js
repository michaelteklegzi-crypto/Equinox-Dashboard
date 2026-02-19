const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking tables...');
        // Raw query to list tables in Postgres
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables in DB:', tables);

        console.log('Checking FinancialParam count...');
        const count = await prisma.financialParam.count();
        console.log('FinancialParam count:', count);

        console.log('Checking User count...');
        const users = await prisma.user.count();
        console.log('User count:', users);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
