const { v4: uuidv4 } = require('uuid');

class Material {
  constructor(db) {
    this.db = db;
  }

  async create(materialData) {
    const { title, content, tags = [], type = 'text', account_id } = materialData;
    
    const material = {
      id: uuidv4(),
      title,
      content,
      tags: JSON.stringify(tags),
      type,
      created_at: new Date().toISOString(),
      account_id
    };

    await this.db.run(
      `INSERT INTO materials (id, title, content, tags, type, created_at, account_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [material.id, material.title, material.content, material.tags, 
       material.type, material.created_at, material.account_id]
    );

    return { ...material, tags }; // Return parsed tags
  }

  async findAll(accountId = null) {
    let query = 'SELECT * FROM materials';
    let params = [];

    if (accountId) {
      query += ' WHERE account_id = ?';
      params.push(accountId);
    }

    query += ' ORDER BY created_at DESC';

    const materials = await this.db.all(query, params);
    
    // Parse JSON tags
    return materials.map(material => ({
      ...material,
      tags: JSON.parse(material.tags || '[]')
    }));
  }

  async findById(id) {
    const material = await this.db.get('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) return null;

    return {
      ...material,
      tags: JSON.parse(material.tags || '[]')
    };
  }

  async update(id, updates) {
    const allowedUpdates = ['title', 'content', 'tags', 'type'];
    const updateFields = [];
    const values = [];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        if (field === 'tags') {
          updateFields.push(`${field} = ?`);
          values.push(JSON.stringify(updates[field]));
        } else {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    await this.db.run(
      `UPDATE materials SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  async delete(id) {
    const result = await this.db.run('DELETE FROM materials WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByTag(tag) {
    const materials = await this.db.all(
      `SELECT * FROM materials WHERE tags LIKE ? ORDER BY created_at DESC`,
      [`%"${tag}"%`]
    );

    return materials.map(material => ({
      ...material,
      tags: JSON.parse(material.tags || '[]')
    }));
  }

  async search(query) {
    const materials = await this.db.all(
      `SELECT * FROM materials 
       WHERE title LIKE ? OR content LIKE ? 
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`]
    );

    return materials.map(material => ({
      ...material,
      tags: JSON.parse(material.tags || '[]')
    }));
  }
}

module.exports = Material;