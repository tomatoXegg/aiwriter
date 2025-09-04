import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadOptions {
  maxSize?: number; // 最大文件大小（字节）
  allowedTypes?: string[]; // 允许的文件类型
  uploadDir?: string; // 上传目录
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  extension: string;
}

export interface ParsedContent {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    pageCount?: number;
    wordCount?: number;
    [key: string]: any;
  };
}

export class FileUploadService {
  private options: Required<FileUploadOptions>;

  constructor(options: FileUploadOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 50 * 1024 * 1024, // 默认50MB
      allowedTypes: options.allowedTypes || [
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/markdown',
        'application/json'
      ],
      uploadDir: options.uploadDir || path.join(process.cwd(), 'uploads')
    };

    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.options.uploadDir)) {
      fs.mkdirSync(this.options.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimetype: string): Promise<UploadedFile> {
    // 验证文件类型
    if (!this.options.allowedTypes.includes(mimetype)) {
      throw new Error(`不支持的文件类型: ${mimetype}`);
    }

    // 验证文件大小
    if (buffer.length > this.options.maxSize) {
      throw new Error(`文件大小超过限制: ${buffer.length} > ${this.options.maxSize}`);
    }

    // 生成文件名
    const extension = path.extname(originalName);
    const filename = `${uuidv4()}${extension}`;
    const filePath = path.join(this.options.uploadDir, filename);

    // 保存文件
    await fs.promises.writeFile(filePath, buffer);

    return {
      originalName,
      filename,
      path: filePath,
      size: buffer.length,
      mimetype,
      extension
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error('删除文件失败');
    }
  }

  async parseFile(filePath: string, mimetype: string): Promise<ParsedContent> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      
      switch (mimetype) {
        case 'text/plain':
          return this.parseTextFile(buffer);
        case 'text/markdown':
          return this.parseMarkdownFile(buffer);
        case 'application/json':
          return this.parseJsonFile(buffer);
        case 'application/pdf':
          return this.parsePdfFile(buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return this.parseDocxFile(buffer);
        default:
          throw new Error(`不支持的文件类型: ${mimetype}`);
      }
    } catch (error) {
      console.error('解析文件失败:', error);
      throw new Error('解析文件失败');
    }
  }

  private parseTextFile(buffer: Buffer): ParsedContent {
    const text = buffer.toString('utf-8');
    const wordCount = this.countWords(text);
    
    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length
      }
    };
  }

  private parseMarkdownFile(buffer: Buffer): ParsedContent {
    const text = buffer.toString('utf-8');
    const wordCount = this.countWords(text);
    
    // 简单的Markdown标题提取
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : undefined;
    
    return {
      text,
      metadata: {
        title,
        wordCount,
        characterCount: text.length
      }
    };
  }

  private parseJsonFile(buffer: Buffer): ParsedContent {
    const jsonData = JSON.parse(buffer.toString('utf-8'));
    let text = '';
    
    if (typeof jsonData === 'string') {
      text = jsonData;
    } else if (typeof jsonData === 'object') {
      // 尝试从JSON对象中提取文本内容
      const possibleTextFields = ['content', 'text', 'body', 'description', 'title'];
      for (const field of possibleTextFields) {
        if (typeof jsonData[field] === 'string') {
          text = jsonData[field];
          break;
        }
      }
      
      if (!text) {
        text = JSON.stringify(jsonData, null, 2);
      }
    } else {
      text = String(jsonData);
    }
    
    const wordCount = this.countWords(text);
    
    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length,
        ...jsonData
      }
    };
  }

  private async parsePdfFile(buffer: Buffer): Promise<ParsedContent> {
    // 由于pdf-parse可能不可用，我们提供一个简化的实现
    // 在实际项目中，应该安装并使用pdf-parse
    try {
      // 这里应该使用pdf-parse库
      // 由于npm安装问题，我们先返回一个占位符
      const text = '[PDF文件内容 - 需要安装pdf-parse库来解析]';
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          characterCount: text.length,
          note: '需要安装pdf-parse库来解析PDF文件'
        }
      };
    } catch (error) {
      return {
        text: '[PDF文件解析失败]',
        metadata: {
          error: 'PDF解析失败',
          wordCount: 0
        }
      };
    }
  }

  private async parseDocxFile(buffer: Buffer): Promise<ParsedContent> {
    // 由于mammoth可能不可用，我们提供一个简化的实现
    // 在实际项目中，应该安装并使用mammoth
    try {
      // 这里应该使用mammoth库
      // 由于npm安装问题，我们先返回一个占位符
      const text = '[DOCX文件内容 - 需要安装mammoth库来解析]';
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          characterCount: text.length,
          note: '需要安装mammoth库来解析DOCX文件'
        }
      };
    } catch (error) {
      return {
        text: '[DOCX文件解析失败]',
        metadata: {
          error: 'DOCX解析失败',
          wordCount: 0
        }
      };
    }
  }

  private countWords(text: string): number {
    if (!text) return 0;
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }

  async getFileInfo(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    exists: boolean;
  }> {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return {
        size: 0,
        created: new Date(),
        modified: new Date(),
        exists: false
      };
    }
  }

  async cleanupOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    // 清理超过指定时间的文件
    const now = Date.now();
    let deletedCount = 0;

    try {
      const files = await fs.promises.readdir(this.options.uploadDir);
      
      for (const file of files) {
        const filePath = path.join(this.options.uploadDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('清理文件失败:', error);
    }

    return deletedCount;
  }

  getUploadDir(): string {
    return this.options.uploadDir;
  }

  getAllowedTypes(): string[] {
    return this.options.allowedTypes;
  }

  getMaxSize(): number {
    return this.options.maxSize;
  }
}