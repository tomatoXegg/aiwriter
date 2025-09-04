import { Request, Response } from 'express';
import { CreateContentVersionRequest } from '../database/models/types';
import { Models } from '../database/models';

export class ContentVersionController {
  private models: Models;

  constructor(models: Models) {
    this.models = models;
  }

  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const request: CreateContentVersionRequest = {
        title: req.body.title,
        body: req.body.body,
        changeLog: req.body.changeLog,
      };

      const createdBy = req.user?.id || 'unknown';
      const version = await this.models.contentVersion.createVersion(contentId, request, createdBy);

      res.json({
        success: true,
        data: {
          version,
          currentVersion: version.version,
        },
        message: '创建内容版本成功',
      });
    } catch (error) {
      console.error('Create version error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '创建内容版本失败',
      });
    }
  }

  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const versions = await this.models.contentVersion.findByContentId(contentId);

      res.json({
        success: true,
        data: {
          versions,
          total: versions.length,
        },
        message: '获取内容版本列表成功',
      });
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取内容版本列表失败',
      });
    }
  }

  async getVersion(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const version = parseInt(req.params.version);
      const contentVersion = await this.models.contentVersion.getVersion(contentId, version);

      if (!contentVersion) {
        res.status(404).json({
          success: false,
          message: '版本不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: contentVersion,
        message: '获取内容版本成功',
      });
    } catch (error) {
      console.error('Get version error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取内容版本失败',
      });
    }
  }

  async getLatestVersion(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const latestVersion = await this.models.contentVersion.getLatestVersion(contentId);

      if (!latestVersion) {
        res.status(404).json({
          success: false,
          message: '内容不存在版本',
        });
        return;
      }

      res.json({
        success: true,
        data: latestVersion,
        message: '获取最新版本成功',
      });
    } catch (error) {
      console.error('Get latest version error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取最新版本失败',
      });
    }
  }

  async compareVersions(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const version1 = parseInt(req.query.version1 as string);
      const version2 = parseInt(req.query.version2 as string);

      if (!version1 || !version2) {
        res.status(400).json({
          success: false,
          message: '请提供要比较的版本号',
        });
        return;
      }

      const comparison = await this.models.contentVersion.compareVersions(contentId, version1, version2);

      res.json({
        success: true,
        data: comparison,
        message: '版本比较完成',
      });
    } catch (error) {
      console.error('Compare versions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '版本比较失败',
      });
    }
  }

  async rollbackVersion(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const version = parseInt(req.params.version);
      const reason = req.body.reason || '手动回滚';

      const rollbackVersion = await this.models.contentVersion.rollbackToVersion(contentId, version, reason);

      if (!rollbackVersion) {
        res.status(404).json({
          success: false,
          message: '回滚失败，目标版本不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          rollbackVersion,
          targetVersion: version,
        },
        message: '版本回滚成功',
      });
    } catch (error) {
      console.error('Rollback version error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '版本回滚失败',
      });
    }
  }

  async deleteVersion(req: Request, res: Response): Promise<void> {
    try {
      const versionId = req.params.versionId;
      const success = await this.models.contentVersion.deleteVersion(versionId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: '版本不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '删除版本成功',
      });
    } catch (error) {
      console.error('Delete version error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '删除版本失败',
      });
    }
  }

  async getVersionHistory(req: Request, res: Response): Promise<void> {
    try {
      const contentId = req.params.id;
      const history = await this.models.contentVersion.getVersionHistory(contentId);

      res.json({
        success: true,
        data: history,
        message: '获取版本历史成功',
      });
    } catch (error) {
      console.error('Get version history error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取版本历史失败',
      });
    }
  }

  async getVersionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.models.contentVersion.getStats();

      res.json({
        success: true,
        data: stats,
        message: '获取版本统计成功',
      });
    } catch (error) {
      console.error('Get version stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '获取版本统计失败',
      });
    }
  }
}