import { AdvancedXGBoost } from '../src/ml/xgboost/advanced';
import { ModelConfig, TrainingData } from '../src/types';

async function generateTestData(size: number): Promise<TrainingData> {
  const features: number[][] = [];
  const labels: number[] = [];

  for (let i = 0; i < size; i++) {
    const feature = Array(10).fill(0).map(() => Math.random());
    features.push(feature);
    labels.push(Math.random() > 0.5 ? 1 : 0);
  }

  return { features, labels };
}

async function runBenchmark() {
  const sizes = [100, 1000, 10000];
  const configs: ModelConfig[] = [
    { learningRate: 0.1, maxDepth: 6, nEstimators: 100, quantumEnabled: false },
    { learningRate: 0.1, maxDepth: 6, nEstimators: 100, quantumEnabled: true }
  ];

  console.log('Performance Benchmark Results:');
  console.log('=============================');

  for (const size of sizes) {
    console.log(`\nDataset Size: ${size}`);
    const data = await generateTestData(size);

    for (const config of configs) {
      console.log(`\nConfiguration: ${config.quantumEnabled ? 'Quantum' : 'Classical'}`);
      const model = new AdvancedXGBoost(config);

      // Training benchmark
      console.log('Training...');
      const trainStart = Date.now();
      await model.train(data);
      const trainTime = Date.now() - trainStart;
      console.log(`Training Time: ${trainTime}ms`);

      // Prediction benchmark
      console.log('Predicting...');
      const predictStart = Date.now();
      await model.predict(data.features.slice(0, 100));
      const predictTime = Date.now() - predictStart;
      console.log(`Prediction Time: ${predictTime}ms`);

      // Memory usage
      const memoryUsage = process.memoryUsage();
      console.log(`Memory Usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }
}

runBenchmark().catch(console.error); 