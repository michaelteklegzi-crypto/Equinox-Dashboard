const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ HEALTH ENGINE ============

/**
 * Calculate health score for a single piece of equipment
 * Health Score = Remaining Life % (100 = New, 0 = Dead)
 * Risk Score = Probability of Failure (0 = Low, 1 = High)
 */
function calculateHealth(equipment) {
    const current = equipment.currentHours || 0;
    const lastService = equipment.lastServiceHours || 0;
    const mtbf = equipment.mtbfHours || 5000; // Default 5000h if not set

    const usageSinceService = Math.max(0, current - lastService);
    const usageRatio = usageSinceService / mtbf;

    // Health Score (0-100)
    // 100% when usage is 0. 0% when usage is MTBF.
    let healthScore = Math.max(0, 100 - (usageRatio * 100));

    // Risk Status
    let status = 'Good';
    let color = 'green';

    if (usageRatio >= 1.0) {
        status = 'Critical';
        color = 'red';
    } else if (usageRatio >= 0.8) {
        status = 'Warning';
        color = 'yellow';
    }

    return {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type || 'Generic',
        hours: current,
        nextServiceAt: lastService + mtbf,
        remainingHours: Math.max(0, (lastService + mtbf) - current),
        healthScore: Math.round(healthScore),
        status,
        color
    };
}

/**
 * Get Health Overview for a specific Rig or Global
 */
async function getFleetHealth(rigId = null) {
    const where = rigId ? { rigId } : {};

    // Fetch Equipment
    const equipmentList = await prisma.equipment.findMany({
        where,
        include: { rig: true },
        orderBy: { currentRiskScore: 'desc' } // Worst first
    });

    const analyzed = equipmentList.map(calculateHealth);

    // Aggregate Stats
    const critical = analyzed.filter(e => e.status === 'Critical').length;
    const warning = analyzed.filter(e => e.status === 'Warning').length;
    const good = analyzed.filter(e => e.status === 'Good').length;

    // Overall Fleet Health Score (Average)
    const avgHealth = analyzed.length > 0
        ? analyzed.reduce((sum, e) => sum + e.healthScore, 0) / analyzed.length
        : 100;

    return {
        stats: {
            total: analyzed.length,
            critical,
            warning,
            good,
            avgHealth: Math.round(avgHealth)
        },
        equipment: analyzed
    };
}

/**
 * Update Current Hours for Equipment
 */
async function updateEquipmentHours(id, newHours) {
    // Check reasonable input
    const eq = await prisma.equipment.findUnique({ where: { id } });
    if (!eq) throw new Error("Equipment not found");

    if (newHours < eq.currentHours) {
        throw new Error("New hours cannot be less than current hours");
    }

    const updated = await prisma.equipment.update({
        where: { id },
        data: {
            currentHours: newHours,
            // Update risk score in DB for sorting/queries
            currentRiskScore: (newHours - (eq.lastServiceHours || 0)) / (eq.mtbfHours || 5000)
        }
    });

    return calculateHealth(updated);
}

module.exports = {
    getFleetHealth,
    updateEquipmentHours,
    calculateHealth
};
