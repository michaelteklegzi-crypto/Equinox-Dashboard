const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- USER DEBUG INFO ---');
    try {
        const users = await prisma.user.findMany();
        console.log(users.map(u => ({
            email: u.email,
            role: u.role,
            passwordLength: u.password.length,
            passwordStart: u.password.substring(0, 10),
            isHashed: u.password.startsWith('$2')
        })));
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
