import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { AccountModel } from '../database/models/account';
import { CreateAccountDto, UpdateAccountDto } from '../database/models/types';
import ResponseBuilder from '../utils/responseBuilder';
import databaseConfig from '../config/database';

export class AccountController {
  private accountModel: AccountModel;

  constructor() {
    const db = databaseConfig.getInstance();
    this.accountModel = new AccountModel(db as any);
  }

  /**
   * 创建账号
   */
  createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountData: CreateAccountDto = req.body;
      
      // 验证平台类型
      if (accountData.platform && !['wechat', 'weibo', 'zhihu', 'other'].includes(accountData.platform)) {
        throw new AppError('Invalid platform type', 400);
      }

      const account = await this.accountModel.create(accountData);
      
      ResponseBuilder.created(res, account, 'Account created successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to create account', 500));
      }
    }
  };

  /**
   * 获取账号列表
   */
  getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const platform = req.query.platform as string;
      const search = req.query.search as string;

      const result = await this.accountModel.findAll({
        page,
        limit,
        status,
        platform,
        search
      });

      const response = {
        accounts: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      };

      ResponseBuilder.success(res, response, 'Accounts retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve accounts', 500));
      }
    }
  };

  /**
   * 获取账号详情
   */
  getAccountById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const account = await this.accountModel.findById(id);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      ResponseBuilder.success(res, account, 'Account retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve account', 500));
      }
    }
  };

  /**
   * 更新账号
   */
  updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData: UpdateAccountDto = req.body;

      // 验证状态类型
      if (updateData.status && !['active', 'inactive', 'suspended'].includes(updateData.status)) {
        throw new AppError('Invalid status type', 400);
      }

      // 验证平台类型
      if (updateData.platform && !['wechat', 'weibo', 'zhihu', 'other'].includes(updateData.platform)) {
        throw new AppError('Invalid platform type', 400);
      }

      const account = await this.accountModel.update(id, updateData);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      ResponseBuilder.success(res, account, 'Account updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to update account', 500));
      }
    }
  };

  /**
   * 删除账号
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // 检查账号是否存在
      const existingAccount = await this.accountModel.findById(id);
      if (!existingAccount) {
        throw new AppError('Account not found', 404);
      }

      const deleted = await this.accountModel.delete(id);

      if (!deleted) {
        throw new AppError('Failed to delete account', 500);
      }

      ResponseBuilder.noContent(res);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to delete account', 500));
      }
    }
  };

  /**
   * 激活账号
   */
  activateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const account = await this.accountModel.update(id, { status: 'active' });

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      ResponseBuilder.success(res, account, 'Account activated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to activate account', 500));
      }
    }
  };

  /**
   * 停用账号
   */
  deactivateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const account = await this.accountModel.update(id, { status: 'inactive' });

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      ResponseBuilder.success(res, account, 'Account deactivated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to deactivate account', 500));
      }
    }
  };

  /**
   * 获取账号状态
   */
  getAccountStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const account = await this.accountModel.findById(id);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      const status = {
        id: account.id,
        name: account.name,
        status: account.status,
        platform: account.platform,
        contentCount: account.content_count,
        lastUpdated: account.created_at
      };

      ResponseBuilder.success(res, status, 'Account status retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve account status', 500));
      }
    }
  };

  /**
   * 批量更新账号状态
   */
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountIds, status } = req.body;

      if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
        throw new AppError('Account IDs array is required', 400);
      }

      if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
        throw new AppError('Invalid status type', 400);
      }

      const results = await Promise.allSettled(
        accountIds.map(id => this.accountModel.update(id, { status }))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      ResponseBuilder.success(res, {
        successCount,
        failureCount,
        total: accountIds.length,
        status
      }, `Bulk status update completed: ${successCount} succeeded, ${failureCount} failed`);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to bulk update account status', 500));
      }
    }
  };

  /**
   * 获取账号统计信息
   */
  getAccountStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const account = await this.accountModel.findById(id);

      if (!account) {
        throw new AppError('Account not found', 404);
      }

      const stats = {
        accountId: account.id,
        accountName: account.name,
        totalContent: account.content_count,
        platform: account.platform,
        status: account.status,
        createdAt: account.created_at
      };

      ResponseBuilder.success(res, stats, 'Account statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve account statistics', 500));
      }
    }
  };

  /**
   * 获取所有账号统计
   */
  getAllAccountsStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.accountModel.getStats();

      ResponseBuilder.success(res, stats, 'Accounts statistics retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve accounts statistics', 500));
      }
    }
  };

  /**
   * 获取账号活跃度统计
   */
  getAccountsActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = databaseConfig.getInstance();
      
      // 获取最近30天的活跃账号
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeAccounts = await db.all(`
        SELECT a.id, a.name, a.platform, a.status, a.content_count,
               MAX(c.created_at) as last_activity
        FROM accounts a
        LEFT JOIN contents c ON a.id = c.account_id
        WHERE a.status = 'active' 
          AND (c.created_at >= ? OR a.content_count > 0)
        GROUP BY a.id, a.name, a.platform, a.status, a.content_count
        ORDER BY last_activity DESC
      `, [thirtyDaysAgo.toISOString()]);

      const inactiveAccounts = await db.all(`
        SELECT id, name, platform, status, content_count, created_at
        FROM accounts 
        WHERE status = 'inactive' 
           OR (status = 'active' AND content_count = 0)
        ORDER BY created_at DESC
      `);

      const activity = {
        activeAccounts: activeAccounts.length,
        inactiveAccounts: inactiveAccounts.length,
        recentActivity: activeAccounts.slice(0, 10),
        inactiveList: inactiveAccounts.slice(0, 10)
      };

      ResponseBuilder.success(res, activity, 'Accounts activity retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve accounts activity', 500));
      }
    }
  };

  /**
   * 获取账号创建趋势
   */
  getAccountsTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = databaseConfig.getInstance();
      const days = parseInt(req.query.days as string) || 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await db.all(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN platform = 'wechat' THEN 1 ELSE 0 END) as wechat_count,
          SUM(CASE WHEN platform = 'weibo' THEN 1 ELSE 0 END) as weibo_count,
          SUM(CASE WHEN platform = 'zhihu' THEN 1 ELSE 0 END) as zhihu_count
        FROM accounts 
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate.toISOString()]);

      ResponseBuilder.success(res, {
        trends,
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days
        }
      }, 'Accounts trends retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to retrieve accounts trends', 500));
      }
    }
  };
}