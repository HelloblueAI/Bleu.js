import { jest } from '@jest/globals';
import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../utils/logger';
import { BleuAI } from '../ai/models/bleuAI';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-node', () => {
  const mockTensor = {
    dispose: jest.fn(),
    dataSync: jest.fn().mockReturnValue([]),
    shape: [1, 1],
  };

  const mockModel = {
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn().mockResolvedValue({ history: {} }),
    predict: jest.fn().mockReturnValue(mockTensor),
    evaluate: jest.fn().mockResolvedValue([0]),
    save: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn(),
  };

  return {
    sequential: jest.fn().mockReturnValue(mockModel),
    layers: {
      dense: jest.fn(),
      dropout: jest.fn()
    },
    callbacks: {
      earlyStopping: jest.fn(),
      ModelCheckpoint: jest.fn(),
      onEpochEnd: jest.fn()
    },
    tensor2d: jest.fn().mockReturnValue(mockTensor),
    dispose: jest.fn()
  };
});

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Mock BleuAI
jest.mock('../ai/models/bleuAI', () => ({
  BleuAI: jest.fn().mockImplementation(() => ({
    textClassification: jest.fn().mockResolvedValue([{ label: 'positive', score: 0.9 }]),
    tokenClassification: jest.fn().mockResolvedValue([{ entity: 'PERSON', word: 'John' }]),
    initialize: jest.fn().mockResolvedValue(undefined),
    train: jest.fn().mockResolvedValue(undefined),
    predict: jest.fn().mockResolvedValue({ result: 'test result' }),
    save: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('Test Environment Setup', () => {
  beforeAll(() => {
    // Set environment variables
    process.env.NODE_ENV = 'test';
    
    // Mock console methods
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should have logger configured', () => {
    const logger = createLogger('test');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should have TensorFlow.js configured', () => {
    const model = tf.sequential();
    expect(model).toBeDefined();
    expect(typeof model.add).toBe('function');
    expect(typeof model.compile).toBe('function');
    expect(typeof model.fit).toBe('function');
    expect(typeof model.predict).toBe('function');
    expect(typeof model.evaluate).toBe('function');
    expect(typeof model.dispose).toBe('function');
  });

  it('should have BleuAI configured', () => {
    const bleuAI = new BleuAI();
    expect(bleuAI).toBeDefined();
    expect(typeof bleuAI.textClassification).toBe('function');
    expect(typeof bleuAI.tokenClassification).toBe('function');
    expect(typeof bleuAI.initialize).toBe('function');
    expect(typeof bleuAI.train).toBe('function');
    expect(typeof bleuAI.predict).toBe('function');
  });

  it('should handle environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have console methods mocked', () => {
    expect(typeof console.log).toBe('function');
    expect(typeof console.error).toBe('function');
    expect(typeof console.warn).toBe('function');
    expect(typeof console.info).toBe('function');
    expect(typeof console.debug).toBe('function');
  });
}); 