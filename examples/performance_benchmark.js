const { BleuJS } = require('bleujs');

async function benchmark() {
  const bleu = new BleuJS({
    quantumEnabled: true,
    mlEnabled: true,
    maxWorkers: 8
  });

  console.log('Running Bleu.js Performance Benchmark...\n');

  // Initialize and measure startup time
  console.log('1. Initialization Benchmark:');
  const initStart = Date.now();
  await bleu.init();
  const initTime = (Date.now() - initStart) / 1000;
  console.log(`✓ Initialization completed in ${initTime.toFixed(3)}s\n`);

  // Dataset sizes to test
  const sizes = [100, 1000, 10000];
  const results = [];

  for (const size of sizes) {
    console.log(`\n2. Training Benchmark (${size} samples):`);
    
    // Generate dataset
    const features = Array.from({ length: size }, () => 
      Array.from({ length: 10 }, () => Math.random() * 2 - 1)
    );
    const labels = features.map(f => 
      Math.sin(f.reduce((a, b) => a + b, 0)) > 0 ? 1 : 0
    );

    // Benchmark training
    const trainStart = Date.now();
    await bleu.train({ features, labels });
    const trainTime = (Date.now() - trainStart) / 1000;
    console.log(`✓ Training completed in ${trainTime.toFixed(3)}s`);

    // Benchmark prediction
    console.log(`\n3. Prediction Benchmark (${size} samples):`);
    const predictStart = Date.now();
    await bleu.predict(features);
    const predictTime = (Date.now() - predictStart) / 1000;
    console.log(`✓ Prediction completed in ${predictTime.toFixed(3)}s`);

    // Get performance metrics
    const metrics = await bleu.getPerformanceMetrics();
    
    results.push({
      datasetSize: size,
      trainingTime: trainTime,
      predictionTime: predictTime,
      quantumAdvantage: metrics.quantumAdvantage,
      resourceUtilization: metrics.resourceUtilization,
      inferenceTime: metrics.inferenceTime
    });
  }

  // Print summary
  console.log('\n4. Performance Summary:');
  console.log('----------------------------------------');
  console.log('Dataset Size | Train Time | Predict Time | Quantum Advantage');
  console.log('----------------------------------------');
  results.forEach(r => {
    console.log(
      `${r.datasetSize.toString().padStart(11)} | ` +
      `${r.trainingTime.toFixed(3).padStart(9)}s | ` +
      `${r.predictionTime.toFixed(3).padStart(11)}s | ` +
      `${r.quantumAdvantage.toFixed(2)}x`
    );
  });
  console.log('----------------------------------------');

  // Calculate averages
  const avgQuantumAdvantage = results.reduce((a, b) => a + b.quantumAdvantage, 0) / results.length;
  const avgResourceUtilization = results.reduce((a, b) => a + b.resourceUtilization, 0) / results.length;
  
  console.log('\n5. Average Performance Metrics:');
  console.log(`✓ Quantum Advantage: ${avgQuantumAdvantage.toFixed(2)}x speedup`);
  console.log(`✓ Resource Utilization: ${(avgResourceUtilization * 100).toFixed(1)}%`);
  console.log(`✓ Average Inference Time: ${results[results.length - 1].inferenceTime.toFixed(3)}ms`);
}

benchmark().catch(console.error); 