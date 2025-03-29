import { promises as fs } from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { StorageConfig } from './types';

export class Storage {
  private initialized: boolean = false;
  private readonly path: string;
  private readonly retentionDays: number;
  private readonly compression: boolean;
  private readonly logger: Logger;

  constructor(config: StorageConfig, logger: Logger) {
    this.path = config.path;
    this.retentionDays = config.retentionDays;
    this.compression = config.compression;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.path, { recursive: true });
      this.initialized = true;
      this.logger.info('Storage initialized', {
        type: 'storage',
        path: this.path
      });
    } catch (error) {
      this.logger.error('Failed to initialize storage', { error });
      throw new Error('Failed to initialize storage');
    }
  }

  private checkInitialized() {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.path, `${key}.json`);
  }

  async save(key: string, data: any): Promise<void> {
    this.checkInitialized();
    try {
      const filePath = this.getFilePath(key);
      const fileData = {
        ...data,
        timestamp: Date.now()
      };
      await fs.writeFile(filePath, JSON.stringify(fileData));
      this.logger.info('Data saved successfully', { key });
    } catch (error) {
      this.logger.error('Failed to save data', { error, key });
      throw new Error('Failed to save data');
    }
  }

  async get(key: string): Promise<any> {
    this.checkInitialized();
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.logger.info('Data retrieved successfully', { key });
      return parsedData;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.error('File not found', { key });
        throw new Error('File not found');
      }
      this.logger.error('Failed to retrieve data', { error, key });
      throw new Error('Failed to retrieve data');
    }
  }

  async delete(key: string): Promise<void> {
    this.checkInitialized();
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      this.logger.info('Data deleted successfully', { key });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn('File not found during deletion', { key });
        return;
      }
      this.logger.error('Failed to delete data', { error, key });
      throw new Error('Failed to delete data');
    }
  }

  async list(): Promise<string[]> {
    this.checkInitialized();
    try {
      const files = await fs.readdir(this.path);
      this.logger.info('Files listed successfully');
      return files.map(file => path.parse(file).name);
    } catch (error) {
      this.logger.error('Failed to list files', { error });
      throw new Error('Failed to list files');
    }
  }

  async cleanup(): Promise<void> {
    this.checkInitialized();
    try {
      const files = await fs.readdir(this.path);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.path, file);
        try {
          const data = await fs.readFile(filePath, 'utf-8');
          const parsedData = JSON.parse(data);
          
          if (now - parsedData.timestamp > retentionMs) {
            await fs.unlink(filePath);
          }
        } catch (error) {
          this.logger.warn('Failed to process file during cleanup', { file, error });
        }
      }
      
      this.logger.info('Old files cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup storage', { error });
      throw new Error('Failed to cleanup storage');
    }
  }
} 