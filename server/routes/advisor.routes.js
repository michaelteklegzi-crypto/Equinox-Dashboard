const express = require('express');
const router = express.Router();
const advisorService = require('../services/advisor.service');

// GET /api/advisor/parameters — KPIs + sparkline trend data
router.get('/parameters', async (req, res) => {
    try {
        const { rigId } = req.query;
        const data = await advisorService.getRigParameters(rigId || null);
        res.json(data);
    } catch (error) {
        console.error('Advisor parameters error:', error);
        res.status(500).json({ error: 'Failed to fetch advisor parameters' });
    }
});

// GET /api/advisor/recommendations — Parameter recommendations
router.get('/recommendations', async (req, res) => {
    try {
        const { rigId } = req.query;
        const recommendations = await advisorService.getRecommendations(rigId || null);
        res.json({ recommendations });
    } catch (error) {
        console.error('Advisor recommendations error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// GET /api/advisor/comparison — Fleet-wide comparison
router.get('/comparison', async (req, res) => {
    try {
        const comparison = await advisorService.getFleetComparison();
        res.json({ comparison });
    } catch (error) {
        console.error('Fleet comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch fleet comparison' });
    }
});

module.exports = router;
