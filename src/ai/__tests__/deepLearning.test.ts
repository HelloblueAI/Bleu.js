import * as tf from '@tensorflow/tfjs-node';
import { DeepLearningModel, DeepLearningConfig } from '../deepLearning';

describe('DeepLearningModel', () => {
  let model: DeepLearningModel;
  const defaultConfig: DeepLearningConfig = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    hiddenUnits: [64, 32],
    dropout: 0.2,
    validationSplit: 0.2
  };

  beforeEach(() => {
    model = new DeepLearningModel(defaultConfig);
  });

  afterEach(async () => {
    if (model) {
      await model.dispose().catch(() => {});
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(model.initialize([10])).resolves.not.toThrow();
    });

    it('should create model with correct architecture', async () => {
      await model.initialize([10]);
      expect(model['isInitialized']).toBe(true);
    });

    it('should handle reinitialization gracefully', async () => {
      await model.initialize([10]);
      await model.initialize([10]); // Should not throw
      expect(model['isInitialized']).toBe(true);
    });

    it('should initialize with default config when not provided', async () => {
      const defaultModel = new DeepLearningModel();
      await expect(defaultModel.initialize([10])).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      jest.spyOn(tf, 'setBackend').mockImplementationOnce(() => {
        throw new Error('Backend error');
      });
      await expect(model.initialize([10])).rejects.toThrow('Backend error');
    });
  });

  describe('training', () => {
    beforeEach(async () => {
      await model.initialize([10]);
    });

    it('should train successfully', async () => {
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      const y = [1];
      await expect(model.train(x, y)).resolves.not.toThrow();
    });

    it('should update metrics during training', async () => {
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      const y = [1];
      await model.train(x, y);
      const metrics = model.getMetrics();
      expect(metrics.has('loss')).toBe(true);
      expect(metrics.has('acc')).toBe(true);
    });

    it('should handle tensor inputs', async () => {
      const x = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
      const y = tf.tensor1d([1]);
      await expect(model.train(x, y)).resolves.not.toThrow();
    });

    it('should throw error when training without initialization', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.train([[1]], [1])).rejects.toThrow('Model not initialized');
    });
  });

  describe('prediction', () => {
    beforeEach(async () => {
      await model.initialize([10]);
    });

    it('should make predictions', async () => {
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      const predictions = await model.predict(x);
      expect(predictions).toHaveLength(1);
      expect(typeof predictions[0]).toBe('number');
    });

    it('should update inference time metrics', async () => {
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      await model.predict(x);
      const metrics = model.getMetrics();
      expect(metrics.has('inferenceTime')).toBe(true);
    });

    it('should handle tensor input for prediction', async () => {
      const x = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
      const predictions = await model.predict(x);
      expect(predictions).toHaveLength(1);
    });
  });

  describe('evaluation', () => {
    beforeEach(async () => {
      await model.initialize([10]);
    });

    it('should evaluate model performance', async () => {
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      const y = [1];
      const metrics = await model.evaluate(x, y);
      expect(metrics).toHaveProperty('loss');
      expect(metrics).toHaveProperty('accuracy');
    });

    it('should handle tensor inputs for evaluation', async () => {
      const x = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
      const y = tf.tensor1d([1]);
      const metrics = await model.evaluate(x, y);
      expect(metrics).toHaveProperty('loss');
      expect(metrics).toHaveProperty('accuracy');
    });

    it('should throw error when evaluating without initialization', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.evaluate([[1]], [1])).rejects.toThrow('Model not initialized');
    });
  });

  describe('state management', () => {
    beforeEach(async () => {
      await model.initialize([10]);
    });

    it('should save and load model state', async () => {
      await expect(model.saveState()).resolves.not.toThrow();
      await expect(model.loadState()).resolves.not.toThrow();
    });

    it('should throw error when saving state without initialization', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.saveState()).rejects.toThrow('Model not initialized');
    });

    it('should handle load state errors gracefully', async () => {
      jest.spyOn(tf, 'loadLayersModel').mockImplementationOnce(() => {
        throw new Error('Load error');
      });
      await expect(model.loadState()).rejects.toThrow('Failed to load model state: Load error');
    });
  });

  describe('error handling', () => {
    it('should throw error when predicting without initialization', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.predict([[1]])).rejects.toThrow('Model not initialized');
    });

    it('should throw error when training without initialization', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.train([[1]], [1])).rejects.toThrow('Model not initialized');
    });
  });

  describe('model disposal', () => {
    it('should dispose model successfully', async () => {
      await model.initialize([10]);
      await expect(model.dispose()).resolves.not.toThrow();
      expect(model['isInitialized']).toBe(false);
      expect(model['model']).toBeNull();
    });

    it('should handle disposal of uninitialized model', async () => {
      const newModel = new DeepLearningModel(defaultConfig);
      await expect(newModel.dispose()).resolves.not.toThrow();
    });

    it('should clear metrics on disposal', async () => {
      await model.initialize([10]);
      const x = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
      const y = [1];
      await model.train(x, y);
      expect(model.getMetrics().size).toBeGreaterThan(0);
      await model.dispose();
      expect(model.getMetrics().size).toBe(0);
    });
  });

  describe('metrics management', () => {
    it('should record and retrieve metrics correctly', async () => {
      await model.initialize([10]);
      model['recordMetric']('testMetric', 0.5);
      const metrics = model.getMetrics();
      expect(metrics.get('testMetric')).toEqual([0.5]);
    });

    it('should append multiple values to the same metric', async () => {
      await model.initialize([10]);
      model['recordMetric']('testMetric', 0.5);
      model['recordMetric']('testMetric', 0.7);
      const metrics = model.getMetrics();
      expect(metrics.get('testMetric')).toEqual([0.5, 0.7]);
    });

    it('should return a copy of metrics to prevent external modification', async () => {
      await model.initialize([10]);
      model['recordMetric']('testMetric', 0.5);
      const metrics = model.getMetrics();
      metrics.set('newMetric', [0.9]);
      expect(model.getMetrics().has('newMetric')).toBe(false);
    });
  });
}); 