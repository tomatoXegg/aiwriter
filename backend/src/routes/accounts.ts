import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { validate, validationSchemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import ResponseBuilder from '../utils/responseBuilder';
import databaseConfig from '../config/database';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../types/models';

const router = Router();

// GET /api/accounts - Get all accounts
router.get('/', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    const accounts = await db.all('SELECT * FROM accounts ORDER BY created_at DESC');
    
    ResponseBuilder.success(res, accounts, 'Accounts retrieved successfully');
  } catch (error) {
    throw new AppError('Failed to retrieve accounts', 500);
  }
}));

// GET /api/accounts/:id - Get specific account
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    
    if (!account) {
      throw new AppError('Account not found', 404);
    }
    
    ResponseBuilder.success(res, account, 'Account retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve account', 500);
  }
}));

// POST /api/accounts - Create new account
router.post('/', validate(validationSchemas.account), asyncHandler(async (req, res) => {
  try {
    const { name, description, platform = 'wechat' } = req.body as CreateAccountRequest;
    
    const newAccount: Account = {
      id: uuidv4(),
      name,
      description: description || '',
      platform,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      content_count: 0
    };

    const db = databaseConfig.getInstance();
    const result = await db.run(
      `INSERT INTO accounts (id, name, description, platform, status, created_at, updated_at, content_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newAccount.id, newAccount.name, newAccount.description, newAccount.platform, 
       newAccount.status, newAccount.created_at, newAccount.updated_at, newAccount.content_count]
    );

    ResponseBuilder.created(res, newAccount, 'Account created successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create account', 500);
  }
}));

// PUT /api/accounts/:id - Update account
router.put('/:id', validate(validationSchemas.account), asyncHandler(async (req, res) => {
  try {
    const { name, description, status } = req.body as UpdateAccountRequest;
    const db = databaseConfig.getInstance();
    
    // Check if account exists
    const existingAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    if (!existingAccount) {
      throw new AppError('Account not found', 404);
    }

    const updatedAccount = {
      ...existingAccount,
      name: name || existingAccount.name,
      description: description !== undefined ? description : existingAccount.description,
      status: status || existingAccount.status,
      updated_at: new Date().toISOString()
    };

    await db.run(
      `UPDATE accounts SET name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?`,
      [updatedAccount.name, updatedAccount.description, updatedAccount.status, 
       updatedAccount.updated_at, req.params.id]
    );

    ResponseBuilder.success(res, updatedAccount, 'Account updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update account', 500);
  }
}));

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const db = databaseConfig.getInstance();
    
    // Check if account exists
    const existingAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    if (!existingAccount) {
      throw new AppError('Account not found', 404);
    }

    await db.run('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    
    ResponseBuilder.noContent(res);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete account', 500);
  }
}));

export default router;