const Material = require('../models/Material');

class MaterialController {
  constructor(db) {
    this.materialModel = new Material(db);
  }

  async getAllMaterials(req, res) {
    try {
      const { account_id } = req.query;
      const materials = await this.materialModel.findAll(account_id);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterialById(req, res) {
    try {
      const { id } = req.params;
      const material = await this.materialModel.findById(id);
      
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      res.json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMaterial(req, res) {
    try {
      const { title, content, tags, type, account_id } = req.body;

      if (!title || !content) {
        return res.status(400).json({ 
          error: 'Title and content are required' 
        });
      }

      const material = await this.materialModel.create({
        title,
        content,
        tags: tags || [],
        type: type || 'text',
        account_id
      });

      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const material = await this.materialModel.update(id, updates);
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMaterial(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.materialModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Material not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchMaterials(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const materials = await this.materialModel.search(q);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterialsByTag(req, res) {
    try {
      const { tag } = req.params;
      const materials = await this.materialModel.findByTag(tag);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MaterialController;