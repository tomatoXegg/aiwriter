const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');

// Mock controller for now - will be replaced with real implementation
const contentController = new ContentController(null); // Will be injected properly later

// POST /api/content/generate - Generate content from topic
router.post('/generate', async (req, res) => {
  try {
    const { topicId, accountId, prompt, options } = req.body;
    
    if (!topicId || !accountId) {
      return res.status(400).json({ 
        error: 'Topic ID and Account ID are required' 
      });
    }

    const content = await contentController.generateContent(
      topicId, 
      accountId, 
      prompt, 
      options
    );
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/content - Get all content
router.get('/', async (req, res) => {
  try {
    const { accountId, status } = req.query;
    const contents = await contentController.getAllContents(accountId, status);
    res.json(contents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/content/:id - Get specific content
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await contentController.getContentById(id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const content = await contentController.updateContent(id, updates);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await contentController.deleteContent(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/:id/review - Review content
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const review = await contentController.reviewContent(id);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;