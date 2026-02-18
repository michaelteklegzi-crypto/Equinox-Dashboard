const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Get or Create User
    let user = await prisma.user.findFirst();
    if (!user) {
        // Since we don't have bcrypt imported here easily without relying on node_modules, 
        // we'll assume a user exists or create a dummy one.
        // If no user exists, this might fail on password hash if the app checks it strictly, 
        // but for seeding data linked to a user, any ID works.
        try {
            user = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin@equinox.com',
                    password: '$2a$10$YourHashedPasswordHere', // Dummy hash
                    role: 'Admin'
                }
            });
            console.log('Created Admin User');
        } catch (e) {
            // Might collide if email exists but findFirst failed logic? Unlikely.
            console.log('User creation skipped or failed, finding again.');
            user = await prisma.user.findFirst();
        }
    }

    // 2. Get or Create Rig
    let rig = await prisma.rig.findUnique({ where: { name: 'Rig-01' } });
    if (!rig) {
        rig = await prisma.rig.create({
            data: {
                name: 'Rig-01',
                type: 'RC',
                status: 'Active',
                operationalCapacity: 200
            }
        });
        console.log('Created Rig-01');
    }

    // 3. Get or Create Project
    let project = await prisma.project.findFirst({ where: { name: 'Project Alpha' } });
    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Project Alpha',
                clientName: 'Mining Corp',
                status: 'Active',
                contractedRate: 150
            }
        });
        console.log('Created Project Alpha');
    }

    // 4. Generate Drilling Data (Last 7 Days)
    const today = new Date();
    const shifts = ['Day', 'Night'];

    console.log('Generating 7 days of drilling data...');
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        for (const shift of shifts) {
            // Randomize logic
            const breakdown = {
                shiftHours: 12,
                mech: Math.random() > 0.7 ? Math.random() * 3 : 0, // 30% chance of breakdown
                weather: Math.random() > 0.9 ? Math.random() * 2 : 0, // 10% chance of weather
                safety: Math.random() > 0.95 ? 0.5 : 0,
                standby: Math.random() > 0.8 ? 1 : 0
            };

            // Calculate drilling hours
            const totalDowntime = breakdown.mech + breakdown.weather + breakdown.safety + breakdown.standby;
            const drillingHours = Math.max(0, 12 - totalDowntime - 1.0); // 1.0 ops delay standard

            // Production
            const meters = drillingHours * (15 + Math.random() * 5); // 15-20m per hour

            await prisma.drillingEntry.create({
                data: {
                    date: date,
                    shift: shift,
                    rigId: rig.id,
                    projectId: project.id,
                    createdById: user.id,

                    // Detailed Hours
                    totalShiftHours: 12,
                    drillingHours: parseFloat(drillingHours.toFixed(1)),
                    mechanicalDowntime: parseFloat(breakdown.mech.toFixed(1)),
                    operationalDelay: 1.0,
                    weatherDowntime: parseFloat(breakdown.weather.toFixed(1)),
                    safetyDowntime: parseFloat(breakdown.safety.toFixed(1)),
                    waitingOnParts: 0,
                    standbyHours: parseFloat(breakdown.standby.toFixed(1)),

                    // Production
                    metersDrilled: parseFloat(meters.toFixed(1)),

                    fuelConsumed: 200 + Math.random() * 100,
                    consumablesCost: 50 + Math.random() * 150,
                    remarks: breakdown.mech > 0 ? 'Hydraulic issue fixed' : 'Smooth operation',
                    supervisorName: 'Supervisor ' + (shift === 'Day' ? 'A' : 'B')
                }
            });
        }
    }

    // 5. Generate Maintenance Logs
    console.log('Generating Maintenance Logs...');
    const maintTypes = ['Preventive', 'Corrective'];
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        const type = maintTypes[Math.floor(Math.random() * maintTypes.length)];

        await prisma.maintenanceLog.create({
            data: {
                equipmentName: 'Engine #1',
                maintenanceType: type,
                description: type === 'Preventive' ? '500h Service' : 'Coolant leak repair',
                rigId: rig.id,
                cost: 100 + Math.random() * 500,
                hoursSpent: 1 + Math.random() * 4,
                performedBy: 'Tech Team',
                datePerformed: date,
                createdById: user.id
            }
        });
    }

    console.log('Seed data created successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
