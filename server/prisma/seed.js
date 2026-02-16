const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    const saltRounds = 10;

    // Create users with hashed passwords
    const users = [
        {
            name: 'Admin User',
            email: 'admin@equinox.com',
            password: await bcrypt.hash('0987654321', saltRounds),
            role: 'Admin',
            mustChangePassword: false
        },
        {
            name: 'Daniel',
            email: 'daniel@equinox.com',
            password: await bcrypt.hash('1234567890', saltRounds),
            role: 'User',
            mustChangePassword: true
        },
        {
            name: 'Henock',
            email: 'henock@equinox.com',
            password: await bcrypt.hash('1234567890', saltRounds),
            role: 'User',
            mustChangePassword: true
        },
        {
            name: 'Zemenfes',
            email: 'zemenfes@equinox.com',
            password: await bcrypt.hash('1234567890', saltRounds),
            role: 'User',
            mustChangePassword: true
        },
        {
            name: 'Michael',
            email: 'michael@equinox.com',
            password: await bcrypt.hash('1234567890', saltRounds),
            role: 'User',
            mustChangePassword: true
        }
    ];

    // Create each user
    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: userData
        });
        console.log(`✓ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    console.log('\nDatabase seeded successfully!');
    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log('Admin:');
    console.log('  Email: admin@equinox.com');
    console.log('  Password: 0987654321');
    console.log('\nRegular Users:');
    console.log('  Daniel - daniel@equinox.com - 1234567890');
    console.log('  Henock - henock@equinox.com - 1234567890');
    console.log('  Zemenfes - zemenfes@equinox.com - 1234567890');
    console.log('  Michael - michael@equinox.com - 1234567890');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
