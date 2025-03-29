import fs from 'fs/promises';
import path from 'path';
import { Storage } from '../../storage/storage';
import { Logger } from '../../utils/logger';
import { StorageError } from '../../utils/errors';

jest.mock('fs/promises');
jest.mock('path');

describe('Storage', () => {
  let storage: Storage;
  let mockLogger: jest.Mocked<Logger>;
  let mockFsPromises: jest.Mocked<typeof fs>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    mockFsPromises = fs as jest.Mocked<typeof fs>;
    mockFsPromises.mkdir.mockResolvedValue(undefined);
    mockFsPromises.writeFile.mockResolvedValue(undefined);
    mockFsPromises.readFile.mockResolvedValue(Buffer.from('{"test": "data"}'));
    mockFsPromises.unlink.mockResolvedValue(undefined);
    mockFsPromises.readdir.mockResolvedValue(['test.json']);
    mockFsPromises.stat.mockResolvedValue({ mtimeMs: Date.now() } as fs.Stats);

    storage = new Storage({
      storagePath: '/test/storage',
      compression: false,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create storage directory if it does not exist', async () => {
      await storage.initialize();

      expect(mockFsPromises.mkdir).toHaveBeenCalledWith('/test/storage', { recursive: true });
      expect(mockLogger.info).toHaveBeenCalledWith('Storage initialized', {
        type: 'storage',
        path: '/test/storage'
      });
    });

    it('should handle initialization errors', async () => {
      mockFsPromises.mkdir.mockRejectedValue(new Error('Failed to create directory'));

      await expect(storage.initialize()).rejects.toThrow('Failed to initialize storage');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save data to file', async () => {
      await storage.initialize();
      const data = { test: 'data' };
      await storage.save('test-key', data);

      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-key'),
        JSON.stringify(data)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Data saved successfully', { key: 'test-key' });
    });

    it('should handle save errors', async () => {
      await storage.initialize();
      mockFsPromises.writeFile.mockRejectedValue(new Error('Failed to write file'));

      await expect(storage.save('test-key', {})).rejects.toThrow('Failed to save data');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should retrieve data from file', async () => {
      await storage.initialize();
      const result = await storage.get('test-key');

      expect(result).toEqual({ test: 'data' });
      expect(mockFsPromises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-key')
      );
    });

    it('should handle file not found', async () => {
      await storage.initialize();
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      mockFsPromises.readFile.mockRejectedValue(error);

      await expect(storage.get('non-existent')).rejects.toThrow('File not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle read errors', async () => {
      await storage.initialize();
      mockFsPromises.readFile.mockRejectedValue(new Error('Failed to read file'));

      await expect(storage.get('test-key')).rejects.toThrow('Failed to read data');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete file if it exists', async () => {
      await storage.initialize();
      await storage.delete('test-key');

      expect(mockFsPromises.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-key')
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Data deleted successfully', { key: 'test-key' });
    });

    it('should handle file not found during deletion', async () => {
      await storage.initialize();
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      mockFsPromises.unlink.mockRejectedValue(error);

      await storage.delete('non-existent');
      expect(mockLogger.info).toHaveBeenCalledWith('Data deleted successfully', { key: 'non-existent' });
    });

    it('should handle delete errors', async () => {
      await storage.initialize();
      mockFsPromises.unlink.mockRejectedValue(new Error('Failed to delete file'));

      await expect(storage.delete('test-key')).rejects.toThrow('Failed to delete data');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should list all files in storage', async () => {
      await storage.initialize();
      const files = await storage.list();

      expect(files).toEqual(['test.json']);
      expect(mockFsPromises.readdir).toHaveBeenCalledWith('/test/storage');
      expect(mockLogger.info).toHaveBeenCalledWith('Files listed successfully', {
        count: 1,
        prefix: ''
      });
    });

    it('should handle list errors', async () => {
      await storage.initialize();
      mockFsPromises.readdir.mockRejectedValue(new Error('Failed to read directory'));

      await expect(storage.list()).rejects.toThrow('Failed to list files');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should delete old files', async () => {
      await storage.initialize();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      mockFsPromises.stat.mockResolvedValue({ mtimeMs: oldDate.getTime() } as fs.Stats);

      await storage.cleanup();

      expect(mockFsPromises.unlink).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Storage cleanup completed');
    });

    it('should handle cleanup errors', async () => {
      await storage.initialize();
      mockFsPromises.readdir.mockRejectedValue(new Error('Failed to read directory'));

      await expect(storage.cleanup()).rejects.toThrow('Failed to cleanup storage');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should respect custom retention period', async () => {
      await storage.initialize();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);
      mockFsPromises.stat.mockResolvedValue({ mtimeMs: oldDate.getTime() } as fs.Stats);

      await storage.cleanup();

      expect(mockFsPromises.unlink).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Storage cleanup completed');
    });
  });
}); 