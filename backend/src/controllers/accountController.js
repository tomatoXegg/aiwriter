const Account = require('../models/Account');

class AccountController {
  constructor(db) {
    this.accountModel = new Account(db);
  }

  async getAllAccounts(req, res) {
    try {
      const accounts = await this.accountModel.findAll();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAccountById(req, res) {
    try {
      const { id } = req.params;
      const account = await this.accountModel.findById(id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json(account);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createAccount(req, res) {
    try {
      const { name, description, platform } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Account name is required' });
      }

      const account = await this.accountModel.create({
        name,
        description,
        platform
      });

      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const account = await this.accountModel.update(id, updates);
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.accountModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AccountController;