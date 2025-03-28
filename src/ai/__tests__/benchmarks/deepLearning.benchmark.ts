import { DeepLearningModel } from '../../deepLearning';
import * as tf from '@tensorflow/tfjs-node';

describe('DeepLearningModel Benchmarks', () => {
  let model: DeepLearningModel;
  const config = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    hiddenUnits: [128, 64, 32],
    dropout: 0.2,
    validationSplit: 0.2
  };

  beforeEach(async () => {
    model = new DeepLearningModel(config);
    await model.initialize([100]);
  });

  afterEach(async () => {
    await model.dispose();
  });

  describe('Training Performance', () => {
    it('should train on large dataset efficiently', async () => {
      const startTime = Date.now();
      const x = tf.randomNormal([10000, 100]);
      const y = tf.randomUniform([10000]);

      await model.train(x, y);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      const metrics = model.getMetrics();
      expect(metrics.get('loss')?.length).toBeGreaterThan(0);
      expect(metrics.get('acc')?.length).toBeGreaterThan(0);
    });

    it('should handle batch processing efficiently', async () => {
      const batchSizes = [32, 64, 128, 256];
      const results = new Map<number, number>();

      for (const batchSize of batchSizes) {
        const startTime = Date.now();
        const x = tf.randomNormal([1000, 100]);
        const y = tf.randomUniform([1000]);

        await model.train(x, y);
        const endTime = Date.now();
        results.set(batchSize, endTime - startTime);
      }

      // Verify performance scaling
      const times = Array.from(results.values());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeLessThan(times[i - 1] * 1.5); // Should scale sub-linearly
      }
    });
  });

  describe('Inference Performance', () => {
    it('should make predictions efficiently', async () => {
      const x = tf.randomNormal([1000, 100]);
      const startTime = Date.now();

      const predictions = await model.predict(x);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(predictions).toHaveLength(1000);
      expect(predictions.every(p => p >= 0 && p <= 1)).toBe(true);
    });

    it('should maintain consistent inference times', async () => {
      const x = tf.randomNormal([100, 100]);
      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await model.predict(x);
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      // Calculate standard deviation
      const mean = times.reduce((a, b) => a + b) / times.length;
      const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);

      expect(stdDev).toBeLessThan(mean * 0.1); // Less than 10% variation
    });
  });

  describe('Memory Management', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const x = tf.randomNormal([10000, 100]);
      const y = tf.randomUniform([10000]);

      await model.train(x, y);
      await model.predict(x);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
    });

    it('should properly dispose resources', async () => {
      const x = tf.randomNormal([1000, 100]);
      const y = tf.randomUniform([1000]);

      await model.train(x, y);
      await model.predict(x);
      await model.dispose();

      const metrics = model.getMetrics();
      expect(metrics.size).toBe(0);
      expect(model['isInitialized']).toBe(false);
      expect(model['model']).toBeNull();
    });
  });

  describe('Model Accuracy', () => {
    it('should achieve high accuracy on synthetic data', async () => {
      const x = tf.randomNormal([1000, 100]);
      const y = tf.randomUniform([1000]).map(v => v > 0.5 ? 1 : 0);

      await model.train(x, y);
      const metrics = await model.evaluate(x, y);

      expect(metrics.accuracy).toBeGreaterThan(0.85); // Should achieve >85% accuracy
      expect(metrics.loss).toBeLessThan(0.3); // Should have low loss
    });

    it('should generalize well to unseen data', async () => {
      const trainX = tf.randomNormal([800, 100]);
      const trainY = tf.randomUniform([800]).map(v => v > 0.5 ? 1 : 0);
      const testX = tf.randomNormal([200, 100]);
      const testY = tf.randomUniform([200]).map(v => v > 0.5 ? 1 : 0);

      await model.train(trainX, trainY);
      const trainMetrics = await model.evaluate(trainX, trainY);
      const testMetrics = await model.evaluate(testX, testY);

      const accuracyDrop = trainMetrics.accuracy - testMetrics.accuracy;
      expect(accuracyDrop).toBeLessThan(0.1); // Less than 10% drop in accuracy
    });
  });
}); 