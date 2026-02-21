const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');

// POST /api/ai/chat — Send a message, get AI response
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], rigId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await aiService.chat(message.trim(), history, rigId);
        res.json(result);
    } catch (error) {
        console.error('AI chat route error:', error);
        res.status(500).json({ error: 'Failed to process AI request', response: error.message });
    }
});

// GET /api/ai/suggestions — Get suggested questions
router.get('/suggestions', async (req, res) => {
    try {
        const suggestions = await aiService.getSuggestions();
        res.json({ suggestions });
    } catch (error) {
        console.error('AI suggestions error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

module.exports = router;
