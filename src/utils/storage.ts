import fs from 'fs';
import path from 'path';
import { createLogger } from './logger';

const logger = createLogger('Storage');

export interface StorageConfig {
  basePath: string;
  maxFileSize?: number;
  allowedExtensions?: string[];
}

export class Storage {
  private readonly config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = {
      basePath: config.basePath,
      maxFileSize: config.maxFileSize ?? 100 * 1024 * 1024, // 100MB
      allowedExtensions: config.allowedExtensions ?? ['.txt', '.json', '.csv', '.model']
    };

    // Create base directory if it doesn't exist
    if (!fs.existsSync(this.config.basePath)) {
      fs.mkdirSync(this.config.basePath, { recursive: true });
    }
  }

  async saveFile(filename: string, data: Buffer | string): Promise<string> {
    const filePath = path.join(this.config.basePath, filename);
    const ext = path.extname(filename);

    if (!this.config.allowedExtensions.includes(ext)) {
      throw new Error(`File extension ${ext} not allowed`);
    }

    if (Buffer.byteLength(data) > this.config.maxFileSize) {
      throw new Error('File size exceeds maximum allowed size');
    }

    await fs.promises.writeFile(filePath, data);
    return filePath;
  }

  async readFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.config.basePath, filename);
    return fs.promises.readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.config.basePath, filename);
    await fs.promises.unlink(filePath);
  }

  async listFiles(): Promise<string[]> {
    return fs.promises.readdir(this.config.basePath);
  }

  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.config.basePath, filename);
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filename: string): Promise<number> {
    const filePath = path.join(this.config.basePath, filename);
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }

  async cleanup(): Promise<void> {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(this.config.basePath)) {
        fs.mkdirSync(this.config.basePath, { recursive: true });
        return;
      }

      const files = await this.listFiles();
      const deletePromises = files.map(async (file) => {
        try {
          await this.deleteFile(file);
        } catch (error) {
          logger.warn(`Failed to delete file ${file}:`, error);
        }
      });

      await Promise.all(deletePromises);
      logger.info('Storage cleanup completed successfully');
    } catch (error) {
      logger.error('Storage cleanup failed:', error);
      // Don't throw error, just log it
    }
  }
} 