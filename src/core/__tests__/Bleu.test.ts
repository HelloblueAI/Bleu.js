import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Bleu } from '../Bleu';
import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

jest.mock('express', () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn().mockReturnValue({
      on: jest.fn(),
      close: jest.fn().mockImplementation(cb => cb?.())
    })
  }));
  mockExpress.json = jest.fn();
  mockExpress.urlencoded = jest.fn();
  return mockExpress;
});

jest.mock('mongoose');
jest.mock('../../utils/logger');

describe('Bleu', () => {
  let bleu: Bleu;
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn().mockReturnValue({
        on: jest.fn(),
        close: jest.fn().mockImplementation(cb => cb?.())
      })
    };
    (express as jest.Mock).mockReturnValue(mockApp);
    (express.json as jest.Mock).mockReturnValue(jest.fn());
    (express.urlencoded as jest.Mock).mockReturnValue(jest.fn());
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    bleu = new Bleu();
  });

  it('should initialize with default config', () => {
    const config = bleu.getConfig();
    expect(config.core.port).toBe(3000);
    expect(config.core.environment).toBe('development');
    expect(express).toHaveBeenCalled();
    expect(express.json).toHaveBeenCalled();
    expect(express.urlencoded).toHaveBeenCalledWith({ extended: true });
  });

  it('should start server and connect to MongoDB', async () => {
    await bleu.start();
    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/bleu');
  });

  it('should handle graceful shutdown', async () => {
    await bleu.start();
    await bleu.stop();
    expect(mockApp.listen().close).toHaveBeenCalled();
    expect(mongoose.disconnect).toHaveBeenCalled();
  });

  it('should expose app instance', () => {
    const app = bleu.getApp();
    expect(app).toBeDefined();
    expect(app).toBe(mockApp);
  });

  it('should setup health check route', () => {
    expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
  });

  it('should setup error handling middleware', () => {
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
  });
}); 