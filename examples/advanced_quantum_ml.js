const { BleuJS } = require('bleujs');

async function main() {
  // Initialize with advanced configuration
  const bleu = new BleuJS({
    quantumEnabled: true,
    mlEnabled: true,
    maxWorkers: 8
  });

  console.log('Initializing Bleu.js with quantum enhancement...');
  await bleu.init();
  console.log('✓ Quantum and ML models initialized');

  // Generate synthetic quantum-enhanced dataset
  const datasetSize = 1000;
  const features = Array.from({ length: datasetSize }, () => 
    Array.from({ length: 10 }, () => Math.random() * 2 - 1)
  );
  const labels = features.map(f => 
    Math.sin(f.reduce((a, b) => a + b, 0)) > 0 ? 1 : 0
  );

  // Split into training and testing sets
  const splitIndex = Math.floor(datasetSize * 0.8);
  const trainingData = {
    features: features.slice(0, splitIndex),
    labels: labels.slice(0, splitIndex)
  };
  const testData = {
    features: features.slice(splitIndex),
    labels: labels.slice(splitIndex)
  };

  // Train with quantum enhancement
  console.log('Training quantum-enhanced model...');
  const startTime = Date.now();
  await bleu.train(trainingData);
  const trainingTime = (Date.now() - startTime) / 1000;
  console.log(`✓ Training completed in ${trainingTime.toFixed(2)}s`);

  // Evaluate on test set
  console.log('Evaluating model performance...');
  const predictions = await bleu.predict(testData.features);
  const accuracy = predictions.reduce((acc, pred, i) => 
    acc + (pred === testData.labels[i] ? 1 : 0), 0) / predictions.length;
  console.log(`✓ Test accuracy: ${(accuracy * 100).toFixed(2)}%`);

  // Get detailed performance metrics
  const metrics = await bleu.getPerformanceMetrics();
  console.log('Performance Metrics:', {
    ...metrics,
    trainingTime,
    testAccuracy: accuracy
  });

  // Demonstrate quantum advantage
  console.log('\nDemonstrating Quantum Advantage:');
  const classicalInput = testData.features[0];
  const quantumInput = await bleu.quantumProcessor.process(classicalInput);
  
  console.log('Classical Input:', classicalInput);
  console.log('Quantum-Enhanced Input:', quantumInput);
  console.log('Quantum Advantage Factor:', metrics.quantumAdvantage);
}

main().catch(console.error); 