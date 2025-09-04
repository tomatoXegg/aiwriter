const { v4: uuidv4 } = require('uuid');

class Account {
  constructor(db) {
    this.db = db;
  }

  async create(accountData) {
    const { name, description, platform = 'wechat' } = accountData;
    
    const account = {
      id: uuidv4(),
      name,
      description: description || '',
      platform,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      content_count: 0
    };

    await this.db.run(
      `INSERT INTO accounts (id, name, description, platform, status, created_at, updated_at, content_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [account.id, account.name, account.description, account.platform, account.status, 
       account.created_at, account.updated_at, account.content_count]
    );

    return account;
  }

  async findAll() {
    return await this.db.all('SELECT * FROM accounts ORDER BY created_at DESC');
  }

  async findById(id) {
    return await this.db.get('SELECT * FROM accounts WHERE id = ?', [id]);
  }

  async update(id, updates) {
    const allowedUpdates = ['name', 'description', 'status'];
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
      `UPDATE accounts SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  async delete(id) {
    const result = await this.db.run('DELETE FROM accounts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async updateContentCount(id) {
    const count = await this.db.get(
      'SELECT COUNT(*) as count FROM contents WHERE account_id = ?',
      [id]
    );
    
    await this.db.run(
      'UPDATE accounts SET content_count = ?, updated_at = ? WHERE id = ?',
      [count.count, new Date().toISOString(), id]
    );
  }
}

module.exports = Account;