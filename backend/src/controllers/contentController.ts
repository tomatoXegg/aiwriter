const { v4: uuidv4 } = require('uuid');
const GeminiService = require('../services/geminiService');

class ContentController {
  constructor(db) {
    this.db = db;
    this.geminiService = new GeminiService();
  }

  async generateContent(topicId, accountId, customPrompt = null, options = {}) {
    try {
      // 获取选题信息
      const topic = await this.db.get(
        'SELECT * FROM topics WHERE id = ?',
        [topicId]
      );

      if (!topic) {
        throw new Error('Topic not found');
      }

      // 验证账号存在
      const account = await this.db.get(
        'SELECT * FROM accounts WHERE id = ?',
        [accountId]
      );

      if (!account) {
        throw new Error('Account not found');
      }

      // 使用Gemini生成内容
      const generatedContent = await this.geminiService.generateContent(
        topic,
        { ...options, customPrompt }
      );

      // 保存内容到数据库
      const contentData = {
        id: uuidv4(),
        title: generatedContent.title,
        body: generatedContent.body,
        topic_id: topicId,
        account_id: accountId,
        status: 'generated',
        prompt: customPrompt || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.db.run(
        `INSERT INTO contents (id, title, body, topic_id, account_id, status, prompt, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [contentData.id, contentData.title, contentData.body, contentData.topic_id,
         contentData.account_id, contentData.status, contentData.prompt,
         contentData.created_at, contentData.updated_at]
      );

      // 更新账号的内容计数
      await this.updateAccountContentCount(accountId);

      return {
        ...contentData,
        wordCount: generatedContent.wordCount
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async getAllContents(accountId = null, status = null) {
    try {
      let query = 'SELECT * FROM contents';
      let params = [];
      const conditions = [];

      if (accountId) {
        conditions.push('account_id = ?');
        params.push(accountId);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const contents = await this.db.all(query, params);
      return contents;
    } catch (error) {
      console.error('Error getting contents:', error);
      throw error;
    }
  }

  async getContentById(id) {
    try {
      const content = await this.db.get(
        'SELECT * FROM contents WHERE id = ?',
        [id]
      );
      return content;
    } catch (error) {
      console.error('Error getting content by ID:', error);
      throw error;
    }
  }

  async updateContent(id, updates) {
    try {
      const allowedUpdates = ['title', 'body', 'status'];
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

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db.run(
        `UPDATE contents SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getContentById(id);
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  async deleteContent(id) {
    try {
      const result = await this.db.run(
        'DELETE FROM contents WHERE id = ?',
        [id]
      );

      if (result.changes > 0) {
        // 更新账号的内容计数
        const content = await this.getContentById(id);
        if (content) {
          await this.updateAccountContentCount(content.account_id);
        }
      }

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  async reviewContent(id) {
    try {
      const content = await this.getContentById(id);
      
      if (!content) {
        throw new Error('Content not found');
      }

      // 使用Gemini进行内容审查
      const reviewResult = await this.geminiService.reviewContent(content.body);

      // 保存审查结果
      const reviewData = {
        id: uuidv4(),
        content_id: id,
        quality: reviewResult.overallScore,
        originality: reviewResult.scores.originality,
        suggestions: JSON.stringify(reviewResult.suggestions || []),
        status: reviewResult.status === 'passed' ? 'passed' : 'failed',
        reviewed_at: new Date().toISOString()
      };

      await this.db.run(
        `INSERT INTO reviews (id, content_id, quality, originality, suggestions, status, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [reviewData.id, reviewData.content_id, reviewData.quality, reviewData.originality,
         reviewData.suggestions, reviewData.status, reviewData.reviewed_at]
      );

      // 更新内容状态
      await this.updateContent(id, { 
        status: reviewResult.status === 'passed' ? 'reviewed' : 'needs_improvement'
      });

      return {
        ...reviewData,
        suggestions: JSON.parse(reviewData.suggestions),
        detailedReview: reviewResult
      };
    } catch (error) {
      console.error('Error reviewing content:', error);
      throw error;
    }
  }

  async updateAccountContentCount(accountId) {
    try {
      const count = await this.db.get(
        'SELECT COUNT(*) as count FROM contents WHERE account_id = ?',
        [accountId]
      );
      
      await this.db.run(
        'UPDATE accounts SET content_count = ?, updated_at = ? WHERE id = ?',
        [count.count, new Date().toISOString(), accountId]
      );
    } catch (error) {
      console.error('Error updating account content count:', error);
      // 不抛出错误，因为这不是关键功能
    }
  }
}

module.exports = ContentController;