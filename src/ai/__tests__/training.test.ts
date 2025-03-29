import { ModelTrainer } from '../training/modelTrainer';
import { DataPreprocessor } from '../training/dataPreprocessor';
import { ValidationMetrics } from '../../types/training';
import { createLogger } from '../../utils/logger';

const logger = createLogger('TrainingTests');

describe('AI Model Training', () => {
  let trainer: ModelTrainer;
  let preprocessor: DataPreprocessor;

  beforeEach(() => {
    trainer = new ModelTrainer({
      modelType: 'transformer',
      batchSize: 32,
      epochs: 10,
      learningRate: 0.001,
      validationSplit: 0.2
    });
    preprocessor = new DataPreprocessor();
  });

  describe('Model Architecture', () => {
    test('should create transformer model architecture', async () => {
      const model = await trainer.createModel();
      expect(model).toBeDefined();
      expect(model.layers.length).toBeGreaterThan(0);
    });

    test('should configure model with correct hyperparameters', () => {
      const config = trainer.getModelConfig();
      expect(config.batchSize).toBe(32);
      expect(config.epochs).toBe(10);
      expect(config.learningRate).toBe(0.001);
    });

    test('should support custom layer configurations', async () => {
      const customLayers = [
        { type: 'dense', units: 128, activation: 'relu' },
        { type: 'dropout', rate: 0.3 },
        { type: 'dense', units: 64, activation: 'relu' }
      ];
      const model = await trainer.createModel(customLayers);
      expect(model.layers.length).toBe(customLayers.length);
    });
  });

  describe('Data Preprocessing', () => {
    test('should preprocess training data correctly', async () => {
      const rawData = [
        { text: 'Sample text 1', label: 1 },
        { text: 'Sample text 2', label: 0 }
      ];
      const processed = await preprocessor.prepare(rawData);
      expect(processed.features).toBeDefined();
      expect(processed.labels).toBeDefined();
    });

    test('should handle different data formats', async () => {
      const textData = ['text1', 'text2'];
      const processed = await preprocessor.processText(textData);
      expect(processed.length).toBe(textData.length);
    });

    test('should perform data augmentation', async () => {
      const originalData = ['sample text'];
      const augmented = await preprocessor.augment(originalData);
      expect(augmented.length).toBeGreaterThan(originalData.length);
    });
  });

  describe('Training Process', () => {
    test('should train model with validation', async () => {
      const trainingData = {
        features: [[1, 2, 3], [4, 5, 6]],
        labels: [0, 1]
      };
      const result = await trainer.train(trainingData);
      expect(result.history).toBeDefined();
      expect(result.metrics.accuracy).toBeGreaterThan(0);
    });

    test('should handle early stopping', async () => {
      trainer.setEarlyStoppingConfig({
        patience: 3,
        minDelta: 0.01
      });
      const result = await trainer.train({
        features: [[1, 2], [3, 4]],
        labels: [0, 1]
      });
      expect(result.stoppedEarly).toBeDefined();
    });

    test('should save checkpoints during training', async () => {
      trainer.enableCheckpointing({
        frequency: 'epoch',
        maxCheckpoints: 3
      });
      const checkpoints = await trainer.getCheckpoints();
      expect(checkpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Model Evaluation', () => {
    test('should evaluate model performance', async () => {
      const testData = {
        features: [[1, 2], [3, 4]],
        labels: [0, 1]
      };
      const metrics = await trainer.evaluate(testData);
      expect(metrics.accuracy).toBeDefined();
      expect(metrics.loss).toBeDefined();
    });

    test('should generate performance reports', async () => {
      const report = await trainer.generateReport();
      expect(report.metrics).toBeDefined();
      expect(report.confusionMatrix).toBeDefined();
    });

    test('should track training progress', async () => {
      const progress = await trainer.getTrainingProgress();
      expect(progress.currentEpoch).toBeDefined();
      expect(progress.metrics).toBeDefined();
    });
  });

  describe('Model Export and Deployment', () => {
    test('should export trained model', async () => {
      const exportPath = await trainer.exportModel('savedModel');
      expect(exportPath).toBeDefined();
      expect(typeof exportPath).toBe('string');
    });

    test('should optimize model for deployment', async () => {
      const optimized = await trainer.optimizeForDeployment({
        quantize: true,
        pruning: true
      });
      expect(optimized.sizeReduction).toBeGreaterThan(0);
    });

    test('should support different export formats', async () => {
      const formats = ['tfjs', 'onnx', 'savedModel'];
      for (const format of formats) {
        const exported = await trainer.exportModel(format);
        expect(exported).toBeDefined();
      }
    });
  });
}); 