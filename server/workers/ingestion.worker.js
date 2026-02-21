const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xlsx = require('xlsx');
const fs = require('fs');

/**
 * Parse an uploaded Excel file and stage rows into ImportStaging.
 * Expects the template format with named columns on the first row.
 * Returns { success, rows, errors[] }
 */
async function processExcelFile({ filePath, uploadedById, batchId }) {
    console.log(`Processing file: ${filePath} for Batch: ${batchId}`);

    try {
        // 1. Read File
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        if (rawData.length === 0) {
            return { success: false, rows: 0, errors: ['File is empty or has no data rows.'] };
        }

        // 2. Validate headers — check mandatory columns exist
        const firstRow = rawData[0];
        const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
        const mandatory = ['date', 'rig', 'project', 'shift', 'meters drilled'];
        const missingHeaders = mandatory.filter(m => !headers.some(h => h.includes(m.replace('meters drilled', 'meters'))));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                rows: 0,
                errors: [`Missing mandatory columns: ${missingHeaders.join(', ')}. Please use the import template.`]
            };
        }

        console.log(`Parsed ${rawData.length} rows from sheet "${sheetName}"`);

        // 3. Batch Insert into ImportStaging
        const CHUNK_SIZE = 50;
        for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
            const chunk = rawData.slice(i, i + CHUNK_SIZE);

            const stagingRecords = chunk.map((row, index) => ({
                batchId,
                rowNumber: i + index + 1,
                rawData: row,
                status: 'Pending',
                uploadedById
            }));

            await prisma.importStaging.createMany({
                data: stagingRecords
            });
        }

        // 4. Cleanup File
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

        return { success: true, rows: rawData.length, errors: [] };

    } catch (error) {
        console.error('Ingestion Error:', error);
        return { success: false, rows: 0, errors: [error.message] };
    }
}

/**
 * Smart column mapper — normalizes any reasonable column name to our internal keys.
 */
function mapRowData(rawData) {
    const normalized = {};
    for (const [key, value] of Object.entries(rawData)) {
        const lower = key.toLowerCase().trim();

        // Mandatory
        if (lower === 'date' || lower.includes('date')) normalized.date = value;
        else if (lower === 'rig' || lower.includes('rig')) normalized.rig = value;
        else if (lower === 'project' || lower.includes('project') || lower.includes('client') || lower.includes('job')) normalized.project = value;
        else if (lower === 'shift') normalized.shift = value;
        else if (lower.includes('meters') || lower.includes('drilled') || lower.includes('footage')) normalized.metersDrilled = value;

        // Optional - Production
        else if (lower.includes('hole') && lower.includes('depth')) normalized.holeDepth = value;
        else if (lower.includes('bit')) normalized.bitType = value;
        else if (lower.includes('formation') || lower.includes('lithology')) normalized.formation = value;
        else if (lower.includes('mud')) normalized.mudType = value;

        // Optional - Hours
        else if (lower.includes('total') && lower.includes('shift')) normalized.totalShiftHours = value;
        else if (lower.includes('drilling') && lower.includes('hour')) normalized.drillingHours = value;
        else if (lower.includes('mechanical')) normalized.mechanicalDowntime = value;
        else if (lower.includes('operational')) normalized.operationalDelay = value;
        else if (lower.includes('weather')) normalized.weatherDowntime = value;
        else if (lower.includes('safety')) normalized.safetyDowntime = value;
        else if (lower.includes('waiting') || lower.includes('parts')) normalized.waitingOnParts = value;
        else if (lower.includes('standby')) normalized.standbyHours = value;
        else if (lower.includes('npt')) normalized.nptHours = value;

        // Optional - Costs
        else if (lower.includes('fuel')) normalized.fuelConsumed = value;
        else if (lower.includes('consumable') || lower.includes('cost')) normalized.consumablesCost = value;

        // Optional - Metadata
        else if (lower.includes('supervisor')) normalized.supervisorName = value;
        else if (lower.includes('remark') || lower.includes('note') || lower.includes('comment')) normalized.remarks = value;
    }
    return normalized;
}

/**
 * Validate staged rows against Admin-managed items.
 * Returns { valid: [], errors: [], adminActions: [] }
 * adminActions tells the user exactly what to create in Admin.
 */
async function validateBatch(batchId) {
    const stagedRows = await prisma.importStaging.findMany({
        where: { batchId, status: 'Pending' }
    });

    if (stagedRows.length === 0) {
        return { valid: [], errors: ['No pending rows found.'], adminActions: [] };
    }

    // Fetch Admin-managed lookups
    const rigs = await prisma.rig.findMany();
    const projects = await prisma.project.findMany();

    const rigNames = rigs.map(r => r.name);
    const projNames = projects.map(p => p.name);

    // Build lookup maps (case-insensitive)
    const rigMap = new Map();
    for (const rig of rigs) {
        rigMap.set(rig.name.toLowerCase().replace(/\s+/g, ''), rig.id);
        rigMap.set(rig.name.toLowerCase(), rig.id);
    }

    const projMap = new Map();
    for (const proj of projects) {
        projMap.set(proj.name.toLowerCase().replace(/\s+/g, ''), proj.id);
        projMap.set(proj.name.toLowerCase(), proj.id);
    }

    const valid = [];
    const errors = [];
    const missingRigs = new Set();
    const missingProjects = new Set();

    for (const row of stagedRows) {
        const data = mapRowData(row.rawData);
        const rowErrors = [];

        // --- Validate Date ---
        let dateObj;
        if (data.date === '' || data.date === undefined || data.date === null) {
            rowErrors.push('Date is required');
        } else {
            try {
                if (typeof data.date === 'number') {
                    dateObj = new Date(Math.round((data.date - 25569) * 86400 * 1000));
                } else {
                    dateObj = new Date(data.date);
                }
                if (isNaN(dateObj.getTime())) throw new Error('Invalid');
            } catch {
                rowErrors.push(`Invalid Date: "${data.date}"`);
            }
        }

        // --- Validate Rig (Admin-managed) ---
        let rigId = null;
        const rigInput = String(data.rig || '').trim();
        if (!rigInput) {
            rowErrors.push('Rig is required');
        } else {
            const rigKey = rigInput.toLowerCase().replace(/\s+/g, '');
            rigId = rigMap.get(rigKey) || rigMap.get(rigInput.toLowerCase());
            if (!rigId) {
                missingRigs.add(rigInput);
                rowErrors.push(`Rig "${rigInput}" not found in Admin`);
            }
        }

        // --- Validate Project (Admin-managed) ---
        let projectId = null;
        const projInput = String(data.project || '').trim();
        if (!projInput) {
            rowErrors.push('Project is required');
        } else {
            const projKey = projInput.toLowerCase().replace(/\s+/g, '');
            projectId = projMap.get(projKey) || projMap.get(projInput.toLowerCase());
            if (!projectId) {
                missingProjects.add(projInput);
                rowErrors.push(`Project "${projInput}" not found in Admin`);
            }
        }

        // --- Validate Shift ---
        const shift = String(data.shift || '').trim();
        if (!shift) {
            rowErrors.push('Shift is required (Day or Night)');
        } else if (!['day', 'night'].includes(shift.toLowerCase())) {
            rowErrors.push(`Invalid Shift: "${shift}" (must be Day or Night)`);
        }

        // --- Validate Meters Drilled ---
        const meters = parseFloat(data.metersDrilled);
        if (data.metersDrilled === '' || data.metersDrilled === undefined || isNaN(meters)) {
            rowErrors.push('Meters Drilled is required (number)');
        }

        if (rowErrors.length > 0) {
            errors.push({ row: row.rowNumber, errors: rowErrors, data: data });
        } else {
            valid.push({
                stagingId: row.id,
                rowNumber: row.rowNumber,
                data,
                dateObj,
                rigId,
                projectId,
                shift: shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase(),
                metersDrilled: meters,
            });
        }
    }

    // Build Admin action messages
    const adminActions = [];
    if (missingRigs.size > 0) {
        adminActions.push({
            type: 'rig',
            message: `The following Rig(s) do not exist. Please create them in Admin → Rigs before importing:`,
            items: [...missingRigs],
            existingItems: rigNames,
        });
    }
    if (missingProjects.size > 0) {
        adminActions.push({
            type: 'project',
            message: `The following Project(s) do not exist. Please create them in Admin → Projects before importing:`,
            items: [...missingProjects],
            existingItems: projNames,
        });
    }

    return { valid, errors, adminActions, totalRows: stagedRows.length };
}

/**
 * Commit validated rows to DrillingEntry.
 */
async function commitBatch(batchId, uploadedById) {
    const validation = await validateBatch(batchId);

    if (validation.adminActions.length > 0) {
        return {
            success: false,
            message: 'Cannot commit — some items need to be created in Admin first.',
            adminActions: validation.adminActions,
            validCount: validation.valid.length,
            errorCount: validation.errors.length,
        };
    }

    if (validation.valid.length === 0) {
        return {
            success: false,
            message: 'No valid rows to commit.',
            errors: validation.errors.slice(0, 10),
            validCount: 0,
            errorCount: validation.errors.length,
        };
    }

    // Build DrillingEntry records
    const entries = validation.valid.map(v => {
        const d = v.data;
        return {
            date: v.dateObj,
            shift: v.shift,
            rigId: v.rigId,
            projectId: v.projectId,
            metersDrilled: v.metersDrilled,
            holeDepth: d.holeDepth !== '' ? parseFloat(d.holeDepth) || null : null,
            bitType: d.bitType || null,
            formation: d.formation || null,
            mudType: d.mudType || null,
            totalShiftHours: d.totalShiftHours !== '' ? parseFloat(d.totalShiftHours) || 12 : 12,
            drillingHours: d.drillingHours !== '' ? parseFloat(d.drillingHours) || 0 : 0,
            mechanicalDowntime: d.mechanicalDowntime !== '' ? parseFloat(d.mechanicalDowntime) || 0 : 0,
            operationalDelay: d.operationalDelay !== '' ? parseFloat(d.operationalDelay) || 0 : 0,
            weatherDowntime: d.weatherDowntime !== '' ? parseFloat(d.weatherDowntime) || 0 : 0,
            safetyDowntime: d.safetyDowntime !== '' ? parseFloat(d.safetyDowntime) || 0 : 0,
            waitingOnParts: d.waitingOnParts !== '' ? parseFloat(d.waitingOnParts) || 0 : 0,
            standbyHours: d.standbyHours !== '' ? parseFloat(d.standbyHours) || 0 : 0,
            nptHours: d.nptHours !== '' ? parseFloat(d.nptHours) || 0 : 0,
            fuelConsumed: d.fuelConsumed !== '' ? parseFloat(d.fuelConsumed) || null : null,
            consumablesCost: d.consumablesCost !== '' ? parseFloat(d.consumablesCost) || null : null,
            supervisorName: d.supervisorName || null,
            remarks: d.remarks || null,
            createdById: uploadedById,
            status: 'Approved',
        };
    });

    const committedIds = validation.valid.map(v => v.stagingId);

    // Transaction: create entries + update staging status
    await prisma.$transaction([
        prisma.drillingEntry.createMany({ data: entries }),
        prisma.importStaging.updateMany({
            where: { id: { in: committedIds } },
            data: { status: 'Imported' }
        })
    ]);

    // Mark error rows
    const errorIds = validation.errors.map(e => {
        // We need to find staging IDs for error rows
        return null; // handled separately
    }).filter(Boolean);

    return {
        success: true,
        message: `Successfully imported ${entries.length} records.`,
        committed: entries.length,
        errors: validation.errors.slice(0, 10),
        errorCount: validation.errors.length,
    };
}

module.exports = { processExcelFile, validateBatch, commitBatch, mapRowData };
