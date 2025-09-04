const { v4: uuidv4 } = require('uuid');
const GeminiService = require('../services/geminiService');

class TopicController {
  constructor(db) {
    this.db = db;
    this.geminiService = new GeminiService();
  }

  async generateTopics(materialId, customPrompt = null) {
    try {
      // 获取素材内容
      const material = await this.db.get(
        'SELECT * FROM materials WHERE id = ?',
        [materialId]
      );

      if (!material) {
        throw new Error('Material not found');
      }

      // 使用Gemini生成选题
      const topics = await this.geminiService.generateTopics(
        material.content,
        customPrompt
      );

      // 保存生成的选题到数据库
      const savedTopics = [];
      for (const topic of topics) {
        const topicData = {
          id: uuidv4(),
          title: topic.title,
          description: topic.description,
          material_id: materialId,
          prompt: customPrompt || '',
          status: 'pending',
          created_at: new Date().toISOString()
        };

        await this.db.run(
          `INSERT INTO topics (id, title, description, material_id, prompt, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [topicData.id, topicData.title, topicData.description, topicData.material_id,
           topicData.prompt, topicData.status, topicData.created_at]
        );

        savedTopics.push({
          ...topicData,
          audience: topic.audience,
          value: topic.value
        });
      }

      return savedTopics;
    } catch (error) {
      console.error('Error generating topics:', error);
      throw error;
    }
  }

  async getAllTopics(materialId = null) {
    try {
      let query = 'SELECT * FROM topics';
      let params = [];

      if (materialId) {
        query += ' WHERE material_id = ?';
        params.push(materialId);
      }

      query += ' ORDER BY created_at DESC';

      const topics = await this.db.all(query, params);
      return topics;
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  async getTopicById(id) {
    try {
      const topic = await this.db.get(
        'SELECT * FROM topics WHERE id = ?',
        [id]
      );
      return topic;
    } catch (error) {
      console.error('Error getting topic by ID:', error);
      throw error;
    }
  }

  async selectTopic(id) {
    try {
      // 先将该素材的其他选题设为discarded
      await this.db.run(
        `UPDATE topics SET status = 'discarded' 
         WHERE material_id = (SELECT material_id FROM topics WHERE id = ?) 
         AND status = 'pending'`,
        [id]
      );

      // 将选中的选题设为selected
      await this.db.run(
        'UPDATE topics SET status = ? WHERE id = ?',
        ['selected', id]
      );

      const topic = await this.getTopicById(id);
      return topic;
    } catch (error) {
      console.error('Error selecting topic:', error);
      throw error;
    }
  }

  async updateTopic(id, updates) {
    try {
      const allowedUpdates = ['title', 'description', 'status', 'prompt'];
      const updateFields = [];
      const values = [];

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      await this.db.run(
        `UPDATE topics SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getTopicById(id);
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  async deleteTopic(id) {
    try {
      const result = await this.db.run(
        'DELETE FROM topics WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }
}

module.exports = TopicController;