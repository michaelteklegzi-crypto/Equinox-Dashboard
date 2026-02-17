const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Configuration
const DAYS_TO_SIMULATE = 30;
const SITES = ['North Field', 'South Field', 'West Field'];
const RIG_TYPES = ['High Spec', 'Standard', 'Aging', 'New Build'];

// Helper: Random number between min/max
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Helper: Get random item from array
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
    console.log('🚀 Starting Enterprise Simulation...');

    // 1. CLEANUP (Reset DB)
    console.log('🧹 Clearing existing data...');
    await prisma.downtimeLog.deleteMany();
    await prisma.drillingDepth.deleteMany();
    await prisma.shiftReport.deleteMany();
    await prisma.dailyDrillingReport.deleteMany();
    await prisma.incidentReport.deleteMany();
    await prisma.rig.deleteMany();
    await prisma.actionItem.deleteMany();
    await prisma.user.deleteMany();

    // 2. CREATE USERS
    console.log('bust creating users...');
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('0987654321', saltRounds);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@equinox.com',
            password: adminPassword,
            role: 'Admin'
        }
    });

    // 3. CREATE RIG FLEET (12 Rigs)
    console.log('🏗️ Commissioning 12-Rig Fleet...');
    const rigs = [];

    // North Field: 4 High Spec Rigs (High Performance)
    for (let i = 1; i <= 4; i++) {
        rigs.push(await prisma.rig.create({
            data: { name: `Rig 0${i}`, site: 'North Field', type: 'High Spec', status: 'Active' }
        }));
    }
    // South Field: 4 Standard Rigs (Average)
    for (let i = 5; i <= 8; i++) {
        rigs.push(await prisma.rig.create({
            data: { name: `Rig 0${i}`, site: 'South Field', type: 'Standard', status: 'Active' }
        }));
    }
    // West Field: Mix of Aging and New
    rigs.push(await prisma.rig.create({ data: { name: 'Rig 09', site: 'West Field', type: 'Aging', status: 'Active' } })); // Problematic
    rigs.push(await prisma.rig.create({ data: { name: 'Rig 10', site: 'West Field', type: 'Aging', status: 'Maintenance' } })); // Problematic
    rigs.push(await prisma.rig.create({ data: { name: 'Rig 11', site: 'West Field', type: 'New Build', status: 'Active' } })); // Learning Curve
    rigs.push(await prisma.rig.create({ data: { name: 'Rig 12', site: 'West Field', type: 'New Build', status: 'Active' } }));

    // 4. SIMULATE OPERATIONS (30 Days)
    console.log(`⏳ Simulating ${DAYS_TO_SIMULATE} days of drilling operations...`);

    const today = new Date();

    // Track current depth for each rig to ensure continuity
    const rigDepths = {};
    rigs.forEach(r => rigDepths[r.id] = random(500, 1500)); // Start at random depth

    for (let d = DAYS_TO_SIMULATE; d >= 0; d--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - d);

        // Skip Sundays sometimes (Weekend drop)
        const isWeekend = currentDate.getDay() === 0;

        for (const rig of rigs) {
            // Rig Performance Multipliers
            let performance = 1.0;
            let failureChance = 0.05; // 5% base chance of downtime

            if (rig.type === 'High Spec') {
                performance = 1.3;
                failureChance = 0.02;
            } else if (rig.type === 'Aging') {
                performance = 0.8;
                failureChance = 0.25; // 25% chance of failure
            } else if (rig.type === 'New Build') {
                // Improves over time (simulated by checking if date is recent)
                performance = d < 10 ? 1.2 : 0.9; // Faster in recent days
            }

            // Generate Daily Stats
            const baseDrill = isWeekend ? random(40, 80) : random(60, 150);
            const actualDrilled = Math.floor(baseDrill * performance);

            const startDepth = rigDepths[rig.id];
            const endDepth = startDepth + actualDrilled;
            rigDepths[rig.id] = endDepth; // Update for next day

            // Calculate Enterprise Metrics
            // Cost per meter varies by rig type + random variance
            const baseCostPerDay = rig.type === 'High Spec' ? 65000 : 45000;
            const variableCost = actualDrilled * random(150, 300); // $150-$300 per meter
            const dailyCost = baseCostPerDay + variableCost;

            // Fuel consumption linked to drilling activity
            const fuelConsumed = 2000 + (actualDrilled * 15) + random(-200, 200);

            // Create Daily Report
            const report = await prisma.dailyDrillingReport.create({
                data: {
                    reportDate: currentDate,
                    rigId: rig.id,
                    location: rig.site,
                    startDepth: startDepth,
                    endDepth: endDepth,
                    totalDrilled: actualDrilled,
                    dailyCost: dailyCost,
                    fuelConsumed: fuelConsumed,
                    status: d === 0 ? 'Draft' : 'Approved', // Today is draft
                    createdById: admin.id
                }
            });

            // Downtime Simulation
            if (Math.random() < failureChance) {
                const categories = rig.type === 'Aging'
                    ? ['Mechanical', 'Mechanical', 'WaitingOnParts'] // Aging fails mechanically
                    : ['Weather', 'Operational', 'Safety'];

                const category = sample(categories);
                const hours = randomFloat(1, 8);

                await prisma.downtimeLog.create({
                    data: {
                        dailyReportId: report.id,
                        category: category,
                        startTime: currentDate, // Simplified time
                        durationHours: hours,
                        description: `Simulated ${category} event on ${rig.name}`,
                        createdAt: currentDate
                    }
                });
            }

            // Create Shift Reports (Day/Night)
            await prisma.shiftReport.create({
                data: {
                    shiftType: 'Day',
                    date: currentDate,
                    dailyReportId: report.id,
                    supervisorName: 'Simulation Bot',
                    createdById: admin.id
                }
            });
            await prisma.shiftReport.create({
                data: {
                    shiftType: 'Night',
                    date: currentDate,
                    dailyReportId: report.id,
                    supervisorName: 'Simulation Bot',
                    createdById: admin.id
                }
            });
        }
    }

    // 5. SAFETY INCIDENTS
    console.log('⚠️ Injecting Safety Incidents...');
    for (let i = 0; i < 5; i++) {
        const incidentDate = new Date();
        incidentDate.setDate(incidentDate.getDate() - random(1, 25));

        await prisma.incidentReport.create({
            data: {
                incidentType: sample(['Safety', 'Environmental', 'EquipmentDamage']),
                dateOccurred: incidentDate,
                description: 'Simulated fleet incident.',
                severity: sample(['Low', 'Medium']),
                reportedById: admin.id,
                createdAt: incidentDate
            }
        });
    }

    console.log('✅ Simulation Complete! Enterprise data ready.');
    console.log(`   - 12 Rigs Created`);
    console.log(`   - ~${12 * 30} Daily Reports Generated`);
    console.log(`   - Admin: admin@equinox.com / 0987654321`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
