import { v4 as uuidv4 } from 'uuid';
import { 
  ContentVersion, 
  CreateContentVersionRequest 
} from './types';
import Database from '../init';

export class ContentVersionModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async createVersion(contentId: string, request: CreateContentVersionRequest, createdBy: string): Promise<ContentVersion> {
    // 获取当前最新版本号
    const latestVersion = await this.getLatestVersion(contentId);
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    const version: ContentVersion = {
      id: uuidv4(),
      contentId,
      version: nextVersion,
      title: request.title,
      body: request.body,
      changeLog: request.changeLog,
      createdAt: new Date(),
      createdBy,
    };

    await this.db.run(
      `INSERT INTO content_versions (
        id, content_id, version, title, body, change_log, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        version.id,
        version.contentId,
        version.version,
        version.title,
        version.body,
        version.changeLog,
        version.createdAt.toISOString(),
        version.createdBy,
      ]
    );

    return version;
  }

  async findById(id: string): Promise<ContentVersion | null> {
    const row = await this.db.get('SELECT * FROM content_versions WHERE id = ?', [id]);
    return row ? this.rowToContentVersion(row) : null;
  }

  async findByContentId(contentId: string): Promise<ContentVersion[]> {
    const rows = await this.db.all(
      'SELECT * FROM content_versions WHERE content_id = ? ORDER BY version DESC',
      [contentId]
    );
    return rows.map(this.rowToContentVersion);
  }

  async getLatestVersion(contentId: string): Promise<ContentVersion | null> {
    const row = await this.db.get(
      'SELECT * FROM content_versions WHERE content_id = ? ORDER BY version DESC LIMIT 1',
      [contentId]
    );
    return row ? this.rowToContentVersion(row) : null;
  }

  async getVersion(contentId: string, version: number): Promise<ContentVersion | null> {
    const row = await this.db.get(
      'SELECT * FROM content_versions WHERE content_id = ? AND version = ?',
      [contentId, version]
    );
    return row ? this.rowToContentVersion(row) : null;
  }

  async compareVersions(contentId: string, version1: number, version2: number): Promise<{
    version1: ContentVersion | null;
    version2: ContentVersion | null;
    differences: {
      titleChanged: boolean;
      bodyChanged: boolean;
      wordCountDiff: number;
    };
  }> {
    const v1 = await this.getVersion(contentId, version1);
    const v2 = await this.getVersion(contentId, version2);

    if (!v1 || !v2) {
      return {
        version1: v1,
        version2: v2,
        differences: {
          titleChanged: false,
          bodyChanged: false,
          wordCountDiff: 0
        }
      };
    }

    const wordCount1 = this.countWords(v1.body);
    const wordCount2 = this.countWords(v2.body);

    return {
      version1: v1,
      version2: v2,
      differences: {
        titleChanged: v1.title !== v2.title,
        bodyChanged: v1.body !== v2.body,
        wordCountDiff: wordCount2 - wordCount1
      }
    };
  }

  async getVersionHistory(contentId: string): Promise<{
    versions: ContentVersion[];
    totalVersions: number;
    latestVersion: number;
    firstVersion: ContentVersion | null;
    latestVersionInfo: ContentVersion | null;
  }> {
    const versions = await this.findByContentId(contentId);
    const totalVersions = versions.length;
    const latestVersion = totalVersions > 0 ? versions[0].version : 0;
    
    return {
      versions,
      totalVersions,
      latestVersion,
      firstVersion: versions.length > 0 ? versions[versions.length - 1] : null,
      latestVersionInfo: versions.length > 0 ? versions[0] : null,
    };
  }

  async rollbackToVersion(contentId: string, version: number, reason: string): Promise<ContentVersion | null> {
    const targetVersion = await this.getVersion(contentId, version);
    if (!targetVersion) {
      return null;
    }

    // 创建新的版本作为回滚
    const rollbackVersion = await this.createVersion(
      contentId,
      {
        title: targetVersion.title,
        body: targetVersion.body,
        changeLog: `回滚到版本 ${version}: ${reason}`
      },
      'system'
    );

    return rollbackVersion;
  }

  async deleteVersion(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM content_versions WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async getStats(): Promise<{
    totalVersions: number;
    byContentId: Record<string, number>;
    averageVersionsPerContent: number;
    mostVersionedContent: Array<{ contentId: string; versionCount: number }>;
  }> {
    const total = await this.db.get('SELECT COUNT(*) as total FROM content_versions');
    const byContentId = await this.db.all(
      'SELECT content_id, COUNT(*) as count FROM content_versions GROUP BY content_id'
    );
    
    const averageVersionsPerContent = byContentId.length > 0 
      ? Math.round(byContentId.reduce((sum, item) => sum + item.count, 0) / byContentId.length)
      : 0;

    const mostVersionedContent = byContentId
      .map(item => ({ contentId: item.content_id, versionCount: item.count }))
      .sort((a, b) => b.versionCount - a.versionCount)
      .slice(0, 10);

    return {
      totalVersions: total?.total || 0,
      byContentId: byContentId.reduce((acc, row) => {
        acc[row.content_id] = row.count;
        return acc;
      }, {} as Record<string, number>),
      averageVersionsPerContent,
      mostVersionedContent
    };
  }

  async cleanupOldVersions(contentId: string, keepVersions: number = 10): Promise<number> {
    const versions = await this.findByContentId(contentId);
    if (versions.length <= keepVersions) {
      return 0;
    }

    // 保留最新的N个版本
    const versionsToDelete = versions.slice(keepVersions);
    let deletedCount = 0;

    for (const version of versionsToDelete) {
      const result = await this.deleteVersion(version.id);
      if (result) deletedCount++;
    }

    return deletedCount;
  }

  private countWords(text: string): number {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }

  private rowToContentVersion(row: any): ContentVersion {
    return {
      id: row.id,
      contentId: row.content_id,
      version: row.version,
      title: row.title,
      body: row.body,
      changeLog: row.change_log,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
    };
  }
}