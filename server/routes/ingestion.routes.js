const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processExcelFile, validateBatch, commitBatch } = require('../workers/ingestion.worker');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel/CSV files are allowed!'), false);
        }
    }
});

// ═══════════════════════════════════════════════════
// POST /api/ingest/upload — Upload & process file
// ═══════════════════════════════════════════════════
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const batchId = uuidv4();

        // Get valid user or fallback to first user in DB
        let uploadedById = req.session?.user?.id;
        if (!uploadedById) {
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                uploadedById = defaultUser.id;
            } else {
                return res.status(500).json({ error: 'No users found in database.' });
            }
        }

        // Process synchronously (no Redis needed)
        const result = await processExcelFile({
            filePath: req.file.path,
            batchId,
            uploadedById
        });

        if (!result.success) {
            return res.status(400).json({
                error: 'Failed to process file',
                details: result.errors,
                batchId
            });
        }

        // Auto-validate to give immediate feedback
        const validation = await validateBatch(batchId);

        res.json({
            message: `File processed: ${result.rows} rows staged`,
            batchId,
            filename: req.file.originalname,
            rowCount: result.rows,
            validation: {
                validCount: validation.valid.length,
                errorCount: validation.errors.length,
                adminActions: validation.adminActions,
                sampleErrors: validation.errors.slice(0, 5).map(e => ({
                    row: e.row,
                    errors: e.errors
                })),
            }
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/ingest/batches — List recent batches
// ═══════════════════════════════════════════════════
router.get('/batches', async (req, res) => {
    try {
        // Get distinct batches with their info
        const batches = await prisma.importStaging.groupBy({
            by: ['batchId', 'status'],
            _count: { _all: true },
            orderBy: { batchId: 'desc' },
        });

        // Merge into batch-level summaries
        const batchMap = new Map();
        for (const row of batches) {
            if (!batchMap.has(row.batchId)) {
                batchMap.set(row.batchId, { batchId: row.batchId, totalRows: 0, pending: 0, imported: 0, error: 0 });
            }
            const entry = batchMap.get(row.batchId);
            entry.totalRows += row._count._all;
            if (row.status === 'Pending') entry.pending += row._count._all;
            else if (row.status === 'Imported') entry.imported += row._count._all;
            else if (row.status === 'Error') entry.error += row._count._all;
        }

        // Get createdAt for each batch
        const batchIds = [...batchMap.keys()];
        const batchMeta = await prisma.importStaging.findMany({
            where: { batchId: { in: batchIds } },
            select: { batchId: true, createdAt: true },
            distinct: ['batchId'],
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const result = batchMeta.map(m => ({
            ...batchMap.get(m.batchId),
            createdAt: m.createdAt,
            status: batchMap.get(m.batchId)?.imported > 0 ? 'Imported'
                : batchMap.get(m.batchId)?.pending > 0 ? 'Pending'
                    : 'Error',
        }));

        res.json(result);
    } catch (error) {
        console.error('Fetch Batches Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/ingest/batches/:batchId/validate — Pre-commit validation
// ═══════════════════════════════════════════════════
router.get('/batches/:batchId/validate', async (req, res) => {
    try {
        const { batchId } = req.params;
        const validation = await validateBatch(batchId);

        res.json({
            totalRows: validation.totalRows || 0,
            validCount: validation.valid.length,
            errorCount: validation.errors.length,
            adminActions: validation.adminActions,
            sampleErrors: validation.errors.slice(0, 10).map(e => ({
                row: e.row,
                errors: e.errors,
            })),
            sampleValid: validation.valid.slice(0, 3).map(v => ({
                row: v.rowNumber,
                date: v.dateObj,
                rig: v.data.rig,
                project: v.data.project,
                shift: v.shift,
                meters: v.metersDrilled,
            })),
        });
    } catch (error) {
        console.error('Validation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════
// POST /api/ingest/batches/:batchId/commit — Commit to DrillingEntry
// ═══════════════════════════════════════════════════
router.post('/batches/:batchId/commit', async (req, res) => {
    const { batchId } = req.params;
    try {
        let uploadedById = req.session?.user?.id;
        if (!uploadedById) {
            const defaultUser = await prisma.user.findFirst();
            uploadedById = defaultUser?.id;
        }

        const result = await commitBatch(batchId, uploadedById);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Commit Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/ingest/template — Download the import template
// ═══════════════════════════════════════════════════
router.get('/template', (req, res) => {
    const xlsx = require('xlsx');
    const wb = xlsx.utils.book_new();

    const headers = [
        'Date', 'Rig', 'Project', 'Shift', 'Meters Drilled',
        'Hole Depth', 'Bit Type', 'Formation', 'Mud Type',
        'Total Shift Hours', 'Drilling Hours', 'Mechanical Downtime',
        'Operational Delay', 'Weather Downtime', 'Safety Downtime',
        'Waiting On Parts', 'Standby Hours', 'NPT Hours',
        'Fuel Consumed', 'Consumables Cost', 'Supervisor Name', 'Remarks',
    ];

    const sampleData = [
        ['2026-01-15', 'Rig 04', 'Hansagnare', 'Day', 120, 450, 'PDC', 'Sandstone', 'Water-Based', 12, 9, 1.5, 0.5, 0, 0, 0, 1, 2, 85, 150, 'John Doe', 'Normal operations'],
        ['2026-01-16', 'Rig 03', 'Bamako', 'Night', 110, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    const ws = xlsx.utils.aoa_to_sheet([headers, ...sampleData]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    xlsx.utils.book_append_sheet(wb, ws, 'Drilling Data');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=Equinox_Import_Template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

module.exports = router;
