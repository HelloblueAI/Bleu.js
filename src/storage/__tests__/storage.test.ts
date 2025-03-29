import { promises as fs } from 'fs';
import { Storage } from '../storage';
import { Logger } from '../../utils/logger';
import { StorageConfig } from '../types';
import path from 'path';
import os from 'os';

describe('Storage', () => {
  let storage: Storage;
  let logger: Logger;
  let testDir: string;

  beforeEach(async () => {
    logger = new Logger('StorageTest');
    testDir = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
    
    const config: StorageConfig = {
      path: testDir,
      retentionDays: 30,
      compression: false
    };

    storage = new Storage(config, logger);
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.cleanup();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should create storage directory if it does not exist', async () => {
      // Verify directory exists
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const invalidConfig: StorageConfig = {
        path: '/invalid/path/that/should/fail',
        retentionDays: 30,
        compression: false
      };
      const invalidStorage = new Storage(invalidConfig, logger);
      await expect(invalidStorage.initialize()).rejects.toThrow('Failed to initialize storage');
    });
  });

  describe('save', () => {
    it('should save data to file', async () => {
      const data = { test: 'data' };
      await storage.save('test-key', data);

      // Verify file exists and contains correct data
      const filePath = path.join(testDir, 'test-key.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(JSON.parse(fileContent)).toEqual(data);
    });

    it('should handle save errors', async () => {
      // Force a save error by making the directory read-only
      await fs.chmod(testDir, 0o444);
      await expect(storage.save('test-key', {})).rejects.toThrow('Failed to save data');
    });
  });

  describe('get', () => {
    it('should retrieve data from file', async () => {
      const data = { test: 'data' };
      await storage.save('test-key', data);
      
      const retrieved = await storage.get('test-key');
      expect(retrieved).toEqual(data);
    });

    it('should handle file not found', async () => {
      await expect(storage.get('non-existent')).rejects.toThrow('File not found');
    });
  });

  describe('delete', () => {
    it('should delete file if it exists', async () => {
      const data = { test: 'data' };
      await storage.save('test-key', data);
      
      await storage.delete('test-key');
      await expect(storage.get('test-key')).rejects.toThrow('File not found');
    });

    it('should handle file not found during deletion', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should list all files in storage', async () => {
      const data = { test: 'data' };
      await storage.save('file1', data);
      await storage.save('file2', data);
      
      const files = await storage.list();
      expect(files).toContain('file1.json');
      expect(files).toContain('file2.json');
    });

    it('should handle listing errors', async () => {
      // Force a listing error by making the directory inaccessible
      await fs.chmod(testDir, 0o000);
      await expect(storage.list()).rejects.toThrow('Failed to list files');
    });
  });

  describe('cleanup', () => {
    it('should delete old files', async () => {
      const data = { timestamp: Date.now() - 32 * 24 * 60 * 60 * 1000 }; // 32 days old
      await storage.save('old-file', data);
      
      await storage.cleanup();
      const files = await storage.list();
      expect(files).not.toContain('old-file.json');
    });

    it('should respect custom retention period', async () => {
      const config: StorageConfig = {
        path: testDir,
        retentionDays: 7,
        compression: false
      };
      storage = new Storage(config, logger);
      await storage.initialize();

      const data = { timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 }; // 8 days old
      await storage.save('old-file', data);
      
      await storage.cleanup();
      const files = await storage.list();
      expect(files).not.toContain('old-file.json');
    });
  });
}); 