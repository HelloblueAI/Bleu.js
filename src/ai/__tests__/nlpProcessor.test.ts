import { jest } from '@jest/globals';
import { NLPProcessor } from '../nlpProcessor';
import { Logger } from '../../utils/logger';
import { Storage } from '../../storage/storage';

jest.mock('../../utils/logger');
jest.mock('../../storage/storage');

describe('NLPProcessor', () => {
  let nlpProcessor: NLPProcessor;
  let mockLogger: Logger;
  let mockStorage: Storage;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    mockStorage = {
      initialize: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({
        weights: Array(100).fill(0).map(() => Array(100).fill(0)),
        biases: Array(100).fill(0),
        vocabulary: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I']
      }),
      delete: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
      clear: jest.fn().mockResolvedValue(undefined)
    } as any;

    nlpProcessor = new NLPProcessor(mockLogger, mockStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(nlpProcessor.initialize()).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('NLPProcessor initialized');
      expect(mockStorage.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockStorage.initialize.mockRejectedValue(new Error('Storage initialization failed'));

      await expect(nlpProcessor.initialize()).rejects.toThrow('NLPProcessor initialization failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize NLPProcessor');
    });
  });

  describe('process', () => {
    beforeEach(async () => {
      await nlpProcessor.initialize();
    });

    it('should process text successfully', async () => {
      const text = 'Hello world';
      const result = await nlpProcessor.process(text);

      expect(result).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
      expect(Array.isArray(result.entities)).toBe(true);
      expect(typeof result.sentiment).toBe('number');
      expect(result.language).toBe('en');
    });

    it('should throw error when not initialized', async () => {
      const nlp = new NLPProcessor(mockLogger, mockStorage);
      await expect(nlp.process('test')).rejects.toThrow('NLPProcessor not initialized');
    });

    it('should handle invalid input', async () => {
      await expect(nlpProcessor.process(null as any)).rejects.toThrow('Failed to process text');
      await expect(nlpProcessor.process(undefined as any)).rejects.toThrow('Failed to process text');
    });
  });

  describe('train', () => {
    beforeEach(async () => {
      await nlpProcessor.initialize();
    });

    it('should train the model with provided data', async () => {
      const trainingData = [
        { text: 'Hello', labels: ['greeting'] },
        { text: 'Goodbye', labels: ['farewell'] }
      ];

      await expect(nlpProcessor.train(trainingData)).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('Training completed');
      expect(mockStorage.save).toHaveBeenCalledWith('nlp_model', expect.any(Object));
    });

    it('should throw error when not initialized', async () => {
      const nlp = new NLPProcessor(mockLogger, mockStorage);
      const trainingData = [{ text: 'Hello', labels: ['greeting'] }];
      await expect(nlp.train(trainingData)).rejects.toThrow('NLPProcessor not initialized');
    });

    it('should handle invalid training data', async () => {
      await expect(nlpProcessor.train(null as any)).rejects.toThrow('Failed to train model');
      await expect(nlpProcessor.train([] as any)).rejects.toThrow('Failed to train model');
    });
  });

  describe('evaluate', () => {
    beforeEach(async () => {
      await nlpProcessor.initialize();
    });

    it('should evaluate model performance', async () => {
      const testData = [
        { text: 'Hello', labels: ['greeting'] },
        { text: 'Goodbye', labels: ['farewell'] }
      ];

      const metrics = await nlpProcessor.evaluate(testData);

      expect(metrics).toEqual({
        accuracy: expect.any(Number),
        loss: expect.any(Number)
      });
    });

    it('should throw error when not initialized', async () => {
      const nlp = new NLPProcessor(mockLogger, mockStorage);
      const testData = [{ text: 'Hello', labels: ['greeting'] }];
      await expect(nlp.evaluate(testData)).rejects.toThrow('NLPProcessor not initialized');
    });

    it('should handle invalid evaluation data', async () => {
      await expect(nlpProcessor.evaluate(null as any)).rejects.toThrow('Failed to evaluate model');
      await expect(nlpProcessor.evaluate([] as any)).rejects.toThrow('Failed to evaluate model');
    });
  });

  describe('model persistence', () => {
    beforeEach(async () => {
      await nlpProcessor.initialize();
    });

    it('should save model state', async () => {
      await expect(nlpProcessor.saveModel()).resolves.not.toThrow();
      expect(mockStorage.save).toHaveBeenCalledWith('nlp_model', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('Model saved successfully');
    });

    it('should load model state', async () => {
      const modelState = {
        weights: Array(100).fill(0).map(() => Array(100).fill(0)),
        biases: Array(100).fill(0),
        vocabulary: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I']
      };
      mockStorage.get.mockResolvedValueOnce(modelState);

      const loadedState = await nlpProcessor.loadModel();
      expect(loadedState).toEqual(modelState);
    });

    it('should handle save errors', async () => {
      mockStorage.save.mockRejectedValue(new Error('Failed to save'));
      await expect(nlpProcessor.saveModel()).rejects.toThrow('Failed to save model');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save model');
    });

    it('should handle load errors', async () => {
      mockStorage.get.mockRejectedValue(new Error('Failed to load'));
      await expect(nlpProcessor.loadModel()).rejects.toThrow('Failed to load model');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load model');
    });
  });
}); 