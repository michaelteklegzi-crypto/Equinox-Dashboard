const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding for AI Validation...");

    // 1. Create Rig
    const rig = await prisma.rig.create({
        data: {
            name: "Rig-AI-Test",
            type: "RC",
            status: "Active"
        }
    });

    // 2. Create Project
    const project = await prisma.project.create({
        data: {
            name: "AI Validation Project",
            status: "Active"
        }
    });

    // 3. Create User
    const user = await prisma.user.create({
        data: {
            name: "AI Admin",
            email: "ai@admin.com",
            password: "hashed_password",
            role: "Admin"
        }
    });

    // 4. Create History (20 days)
    const today = new Date();

    for (let i = 20; i > 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        // Pattern:
        // Days 20-11 (10 days): Sandstone, Fast
        // Days 10-6 (5 days): Shale, Slow
        // Day 5: Rain, Very Slow
        // Days 4-1: Mixed, Medium

        let meters = 100;
        let formation = "Sandstone";
        let rain = 0;

        if (i <= 10 && i > 5) {
            meters = 50;
            formation = "Shale";
        } else if (i === 5) {
            meters = 20;
            formation = "Shale";
            rain = 25.0; // Heavy rain
        } else if (i < 5) {
            meters = 75;
            formation = "Mixed";
        }

        // Random noise
        meters += (Math.random() * 10 - 5);

        await prisma.drillingEntry.create({
            data: {
                date: d,
                shift: "Day",
                rigId: rig.id,
                projectId: project.id,
                metersDrilled: meters,
                totalShiftHours: 12,
                drillingHours: 10,
                bitType: "PDC",
                formation: formation,
                mudType: "Water-Based",
                createdById: user.id,
                weatherDowntime: rain > 0 ? 2 : 0
            }
        });

        // Log Weather
        if (rain > 0) {
            await prisma.weatherLog.create({
                data: {
                    date: d,
                    rainfall: rain,
                    temperature: 25,
                    isRainy: true
                }
            });
        }
    }

    console.log("Seeding Complete.");
}

seed()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
