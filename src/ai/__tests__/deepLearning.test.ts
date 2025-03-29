import { jest } from '@jest/globals';
import * as tf from '@tensorflow/tfjs-node';
import { DeepLearning } from '../deepLearning';
import { createLogger } from '../../utils/logger';

jest.mock('@tensorflow/tfjs-node');
jest.mock('../../utils/logger');

describe('DeepLearning', () => {
  let deepLearning: DeepLearning;
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
    (tf.setBackend as jest.Mock).mockResolvedValue(undefined);
    deepLearning = new DeepLearning();
  });

  describe('initialize', () => {
    it('should initialize TensorFlow.js backend', async () => {
      await deepLearning.initialize();

      expect(tf.setBackend).toHaveBeenCalledWith('cpu');
      expect(mockLogger.info).toHaveBeenCalledWith('TensorFlow backend initialized successfully');
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Failed to initialize TensorFlow.js');
      (tf.setBackend as jest.Mock).mockRejectedValue(error);

      await expect(deepLearning.initialize()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize TensorFlow backend:', error);
    });

    it('should not initialize twice', async () => {
      await deepLearning.initialize();
      await deepLearning.initialize();

      expect(tf.setBackend).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('TensorFlow backend already initialized');
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await deepLearning.initialize();
    });

    it('should clean up resources', async () => {
      await deepLearning.cleanup();

      expect(tf.dispose).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('TensorFlow resources cleaned up');
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      (tf.dispose as jest.Mock).mockImplementation(() => { throw error; });

      await expect(deepLearning.cleanup()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith('Error during cleanup:', error);
    });
  });
}); 