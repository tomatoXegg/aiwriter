const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock data for demonstration
let accounts = [
  {
    id: '1',
    name: '科技前沿',
    description: '分享最新科技资讯',
    platform: 'wechat',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content_count: 5
  },
  {
    id: '2',
    name: '生活美学',
    description: '探讨生活美学与设计',
    platform: 'wechat',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content_count: 3
  }
];

// GET /api/accounts - Get all accounts
router.get('/', (req, res) => {
  res.json(accounts);
});

// POST /api/accounts - Create new account
router.post('/', (req, res) => {
  const { name, description, platform = 'wechat' } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Account name is required' });
  }

  const newAccount = {
    id: uuidv4(),
    name,
    description: description || '',
    platform,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content_count: 0
  };

  accounts.push(newAccount);
  res.status(201).json(newAccount);
});

// GET /api/accounts/:id - Get specific account
router.get('/:id', (req, res) => {
  const account = accounts.find(acc => acc.id === req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

// PUT /api/accounts/:id - Update account
router.put('/:id', (req, res) => {
  const { name, description, status } = req.body;
  const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const updatedAccount = {
    ...accounts[accountIndex],
    name: name || accounts[accountIndex].name,
    description: description || accounts[accountIndex].description,
    status: status || accounts[accountIndex].status,
    updated_at: new Date().toISOString()
  };

  accounts[accountIndex] = updatedAccount;
  res.json(updatedAccount);
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', (req, res) => {
  const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  accounts.splice(accountIndex, 1);
  res.status(204).send();
});

module.exports = router;