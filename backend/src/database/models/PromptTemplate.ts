import { v4 as uuidv4 } from 'uuid';
import { PromptTemplate, CreatePromptTemplateDto } from './types';
import Database from '../init';

export class PromptTemplateModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(data: CreatePromptTemplateDto): Promise<PromptTemplate> {
    const template: PromptTemplate = {
      id: uuidv4(),
      name: data.name,
      type: data.type,
      template: data.template,
      is_default: data.is_default || false,
      created_at: new Date().toISOString(),
    };

    // If this is set as default, unset other defaults of the same type
    if (template.is_default) {
      await this.db.run(
        'UPDATE prompt_templates SET is_default = 0 WHERE type = ? AND id != ?',
        [template.type, template.id]
      );
    }

    await this.db.run(
      `INSERT INTO prompt_templates (id, name, type, template, is_default, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        template.id,
        template.name,
        template.type,
        template.template,
        template.is_default ? 1 : 0,
        template.created_at,
      ]
    );

    return template;
  }

  async findById(id: string): Promise<PromptTemplate | null> {
    const row = await this.db.get('SELECT * FROM prompt_templates WHERE id = ?', [id]);
    return row ? this.rowToPromptTemplate(row) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    type?: string;
    is_default?: boolean;
    search?: string;
  } = {}): Promise<{ data: PromptTemplate[]; total: number }> {
    const { page = 1, limit = 10, type, is_default, search } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (is_default !== undefined) {
      whereClause += ' AND is_default = ?';
      params.push(is_default ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR template LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM prompt_templates WHERE 1=1 ${whereClause}`;
    const countResult = await this.db.get(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Get data
    const dataQuery = `
      SELECT * FROM prompt_templates 
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all(dataQuery, [...params, limit, offset]);
    const data = rows.map(this.rowToPromptTemplate);

    return { data, total };
  }

  async update(id: string, data: Partial<CreatePromptTemplateDto>): Promise<PromptTemplate | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.template !== undefined) {
      updates.push('template = ?');
      params.push(data.template);
    }
    if (data.is_default !== undefined) {
      updates.push('is_default = ?');
      params.push(data.is_default ? 1 : 0);
      
      // If setting as default, unset other defaults of the same type
      if (data.is_default) {
        await this.db.run(
          'UPDATE prompt_templates SET is_default = 0 WHERE type = ? AND id != ?',
          [data.type || existing.type, id]
        );
      }
    }

    if (updates.length === 0) return existing;

    params.push(id);

    await this.db.run(
      `UPDATE prompt_templates SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const template = await this.findById(id);
    if (!template) return false;

    // If this was the default template, set another one as default
    if (template.is_default) {
      const anotherTemplate = await this.db.get(
        'SELECT id FROM prompt_templates WHERE type = ? AND id != ? LIMIT 1',
        [template.type, id]
      );
      
      if (anotherTemplate) {
        await this.db.run(
          'UPDATE prompt_templates SET is_default = 1 WHERE id = ?',
          [anotherTemplate.id]
        );
      }
    }

    const result = await this.db.run('DELETE FROM prompt_templates WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async findByType(type: string): Promise<PromptTemplate[]> {
    const rows = await this.db.all(
      'SELECT * FROM prompt_templates WHERE type = ? ORDER BY is_default DESC, created_at DESC',
      [type]
    );
    return rows.map(this.rowToPromptTemplate);
  }

  async findDefaultByType(type: string): Promise<PromptTemplate | null> {
    const row = await this.db.get(
      'SELECT * FROM prompt_templates WHERE type = ? AND is_default = 1',
      [type]
    );
    return row ? this.rowToPromptTemplate(row) : null;
  }

  async setAsDefault(id: string): Promise<PromptTemplate | null> {
    const template = await this.findById(id);
    if (!template) return null;

    // Unset other defaults of the same type
    await this.db.run(
      'UPDATE prompt_templates SET is_default = 0 WHERE type = ? AND id != ?',
      [template.type, id]
    );

    // Set this as default
    await this.db.run(
      'UPDATE prompt_templates SET is_default = 1 WHERE id = ?',
      [id]
    );

    return this.findById(id);
  }

  async renderTemplate(id: string, variables: Record<string, any>): Promise<string> {
    const template = await this.findById(id);
    if (!template) throw new Error('Template not found');

    let rendered = template.template;
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }

  async validateTemplate(template: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check for unbalanced braces
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('模板中的大括号不匹配');
    }

    // Extract variables and validate format
    const variablePattern = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(template)) !== null) {
      variables.push(match[1]);
    }

    // Check for empty variables
    for (const variable of variables) {
      if (!variable.trim()) {
        errors.push('模板中包含空的变量占位符');
        break;
      }
    }

    // Check for potentially dangerous content
    if (template.includes('<script') || template.includes('javascript:')) {
      errors.push('模板包含不安全的内容');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    defaults: Record<string, number>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM prompt_templates');
    const byType = await this.db.all('SELECT type, COUNT(*) as count FROM prompt_templates GROUP BY type');
    const defaults = await this.db.all('SELECT type, COUNT(*) as count FROM prompt_templates WHERE is_default = 1 GROUP BY type');

    return {
      total: total?.total || 0,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>),
      defaults: defaults.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private rowToPromptTemplate(row: any): PromptTemplate {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      template: row.template,
      is_default: row.is_default === 1,
      created_at: row.created_at,
    };
  }
}