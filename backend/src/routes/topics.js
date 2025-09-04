const express = require('express');
const router = express.Router();
const TopicController = require('../controllers/topicController');

// Mock controller for now - will be replaced with real implementation
const topicController = new TopicController(null); // Will be injected properly later

// POST /api/topics/generate - Generate topics from material
router.post('/generate', async (req, res) => {
  try {
    const { materialId, prompt } = req.body;
    
    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    const topics = await topicController.generateTopics(materialId, prompt);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/topics - Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await topicController.getAllTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/topics/:id/select - Select a topic
router.put('/:id/select', async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await topicController.selectTopic(id);
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;