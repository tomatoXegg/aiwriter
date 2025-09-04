const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock data for demonstration
let materials = [
  {
    id: '1',
    title: '人工智能发展趋势',
    content: '人工智能技术正在快速发展，特别是在自然语言处理、计算机视觉和机器学习等领域。最新的研究表明，AI在各个行业的应用前景广阔。',
    tags: ['AI', '技术', '趋势'],
    type: 'text',
    created_at: new Date().toISOString(),
    account_id: '1'
  },
  {
    id: '2',
    title: '健康生活方式',
    content: '现代生活节奏快，压力大，保持健康的生活方式变得越来越重要。合理的饮食、适量的运动和良好的睡眠是健康生活的三大支柱。',
    tags: ['健康', '生活', '养生'],
    type: 'text',
    created_at: new Date().toISOString(),
    account_id: '2'
  }
];

// GET /api/materials - Get all materials
router.get('/', (req, res) => {
  res.json(materials);
});

// POST /api/materials - Create new material
router.post('/', (req, res) => {
  const { title, content, tags = [], type = 'text', account_id } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newMaterial = {
    id: uuidv4(),
    title,
    content,
    tags: Array.isArray(tags) ? tags : [tags],
    type,
    created_at: new Date().toISOString(),
    account_id: account_id || null
  };

  materials.push(newMaterial);
  res.status(201).json(newMaterial);
});

// GET /api/materials/:id - Get specific material
router.get('/:id', (req, res) => {
  const material = materials.find(mat => mat.id === req.params.id);
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }
  res.json(material);
});

// PUT /api/materials/:id - Update material
router.put('/:id', (req, res) => {
  const { title, content, tags, type } = req.body;
  const materialIndex = materials.findIndex(mat => mat.id === req.params.id);
  
  if (materialIndex === -1) {
    return res.status(404).json({ error: 'Material not found' });
  }

  const updatedMaterial = {
    ...materials[materialIndex],
    title: title || materials[materialIndex].title,
    content: content || materials[materialIndex].content,
    tags: tags || materials[materialIndex].tags,
    type: type || materials[materialIndex].type
  };

  materials[materialIndex] = updatedMaterial;
  res.json(updatedMaterial);
});

// DELETE /api/materials/:id - Delete material
router.delete('/:id', (req, res) => {
  const materialIndex = materials.findIndex(mat => mat.id === req.params.id);
  
  if (materialIndex === -1) {
    return res.status(404).json({ error: 'Material not found' });
  }

  materials.splice(materialIndex, 1);
  res.status(204).send();
});

module.exports = router;