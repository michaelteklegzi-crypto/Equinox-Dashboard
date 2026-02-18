const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db');

// GET /api/actions
router.get('/', async (req, res) => {
    try {
        const { category, priority, status, responsiblePersonId, limit } = req.query;
        const window = req.query.window === '14days';

        let where = {};

        if (category) where.category = category;
        if (priority) where.priority = priority;
        if (status) where.status = status;
        if (responsiblePersonId) where.responsiblePersonId = responsiblePersonId;

        if (window) {
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            // For ongoing or not started actions, show ALL regardless of date
            // For other statuses (Completed, Delayed, Paused), apply 14-day filter
            if (status && (status === 'Ongoing' || status === 'Not Started')) {
                // Don't apply date filter for active actions
            } else if (status && status !== 'Ongoing' && status !== 'Not Started') {
                // Apply date filter for completed/delayed/paused
                where.meetingDate = {
                    gte: fourteenDaysAgo,
                };
            } else {
                // No specific status filter, but window=14days
                // Show all ongoing/not started + last 14 days of others
                where.OR = [
                    { status: { in: ['Ongoing', 'Not Started'] } },
                    { meetingDate: { gte: fourteenDaysAgo } }
                ];
            }
        }

        const actions = await prisma.actionItem.findMany({
            where,
            include: {
                responsiblePerson: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true }
                },
                notes: {
                    include: {
                        createdBy: {
                            select: { id: true, name: true }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: [
                { priority: 'asc' }, // High/Med/Low - strictly speaking string sort might not be correct ('High' < 'Low' is False). We need custom sort or map.
                { status: 'asc' },
                { targetCompletionDate: 'asc' }
            ]
        });

        // Custom sort helper for Priority if needed (Prisma sort is basic)
        // For now, let's return as is and frontend can sort, OR we map priorities to int in DB.
        // "High", "Medium", "Low". Alphabetical: High, Low, Medium. 
        // We might need to strictly order them in memory if DB doesn't support enum sort order easily in SQLite.

        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        actions.sort((a, b) => {
            const pA = priorityOrder[a.priority] || 99;
            const pB = priorityOrder[b.priority] || 99;
            return pA - pB;
        });

        res.json(actions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/actions
router.post('/', async (req, res) => {
    try {
        const { title, description, category, priority, status, responsiblePersonId, meetingDate, targetCompletionDate, createdById } = req.body;

        // Basic validation
        if (!title || !responsiblePersonId || !meetingDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure user is authenticated
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const action = await prisma.actionItem.create({
            data: {
                title,
                description,
                category,
                priority,
                status: status || 'Not Started',
                responsiblePersonId,
                meetingDate: new Date(meetingDate),
                targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
                createdById: req.session.userId
            }
        });
        res.json(action);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/actions/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            priority,
            status,
            responsiblePersonId,
            meetingDate,
            targetCompletionDate
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) updateData.status = status;
        if (responsiblePersonId !== undefined) updateData.responsiblePersonId = responsiblePersonId;
        if (meetingDate !== undefined) updateData.meetingDate = new Date(meetingDate);
        if (targetCompletionDate !== undefined) updateData.targetCompletionDate = targetCompletionDate ? new Date(targetCompletionDate) : null;

        const action = await prisma.actionItem.update({
            where: { id },
            data: updateData
        });
        res.json(action);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/actions/:id/notes
router.post('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Missing required fields: content' });
        }

        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify action exists
        const action = await prisma.actionItem.findUnique({ where: { id } });
        if (!action) {
            return res.status(404).json({ error: 'Action not found' });
        }

        const note = await prisma.note.create({
            data: {
                content,
                actionItemId: id,
                createdById: req.session.userId
            },
            include: {
                createdBy: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/actions/:id/notes
router.get('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;

        const notes = await prisma.note.findMany({
            where: { actionItemId: id },
            include: {
                createdBy: {
                    select: { id: true, name: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
