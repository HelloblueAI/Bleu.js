import { jest } from '@jest/globals';
import { SelfLearningCore } from '../selfLearningCore';
import { Storage } from '../../storage/storage';
import { ILogger } from '../../utils/logger';
import { CoreConfig } from '../../types/core';
import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow/tfjs');
jest.mock('../../storage/storage');
jest.mock('../../utils/logger');

describe('SelfLearningCore', () => {
  let core: SelfLearningCore;
  let mockStorage: jest.Mocked<Storage>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockModel: tf.LayersModel;
  let config: CoreConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      security: jest.fn(),
      audit: jest.fn(),
      performance: jest.fn()
    } as unknown as jest.Mocked<ILogger>;

    mockStorage = {
      get: jest.fn(),
      save: jest.fn(),
      initialize: jest.fn()
    } as unknown as jest.Mocked<Storage>;

    mockModel = {
      compile: jest.fn(),
      fit: jest.fn().mockResolvedValue({ history: { loss: [0.1], accuracy: [0.9] } }),
      predict: jest.fn().mockReturnValue(tf.tensor([0.1, 0.2, 0.7])),
      evaluate: jest.fn().mockResolvedValue([0.1, 0.9]),
      save: jest.fn().mockResolvedValue({ modelArtifactsInfo: {} }),
      dispose: jest.fn(),
      toJSON: jest.fn()
    } as unknown as tf.LayersModel;

    config = {
      inputDimension: 10,
      outputDimension: 3,
      learningRate: 0.001,
      learningInterval: 1000,
      epochs: 1,
      batchSize: 32,
      targetLoss: 0.01
    };

    core = new SelfLearningCore(mockStorage, mockLogger, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockStorage.get.mockResolvedValue(null);
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      await core.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing self-learning core');
      expect(mockModel.compile).toHaveBeenCalled();
    });

    it('should load existing model if available', async () => {
      mockStorage.get.mockResolvedValue({ model: 'test' });
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      await core.initialize();

      expect(mockStorage.get).toHaveBeenCalledWith('model');
      expect(tf.loadLayersModel).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockStorage.get.mockRejectedValue(new Error('Failed to load model'));

      await expect(core.initialize()).rejects.toThrow('Failed to initialize self-learning core');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('model operations', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue(null);
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);
      await core.initialize();
    });

    it('should process metrics and update model', async () => {
      const metrics = [
        { input: [0.1, 0.2], output: [1, 0, 0] },
        { input: [0.3, 0.4], output: [0, 1, 0] }
      ];
      mockStorage.get.mockResolvedValue(metrics);

      await core.processMetrics();

      expect(mockModel.fit).toHaveBeenCalled();
      expect(mockStorage.save).toHaveBeenCalledWith('metrics', []);
    });

    it('should make predictions', async () => {
      const input = [0.1, 0.2, 0.3];
      const prediction = await core.predict(input);

      expect(prediction).toEqual([0.1, 0.2, 0.7]);
      expect(mockModel.predict).toHaveBeenCalled();
    });

    it('should handle prediction errors', async () => {
      mockModel.predict.mockImplementation(() => {
        throw new Error('Prediction failed');
      });

      await expect(core.predict([0.1, 0.2])).rejects.toThrow('Failed to make prediction');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      mockStorage.get.mockResolvedValue(null);
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);
      await core.initialize();
    });

    it('should cleanup resources', async () => {
      await core.cleanup();

      expect(mockModel.dispose).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up self-learning core');
    });

    it('should handle cleanup errors', async () => {
      mockModel.dispose.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      await expect(core.cleanup()).rejects.toThrow('Failed to cleanup self-learning core');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 