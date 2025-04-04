const { BleuJS } = require('bleujs');

async function main() {
  // Initialize Bleu.js
  const bleu = new BleuJS({
    quantumEnabled: true,
    mlEnabled: true
  });

  // Initialize models
  await bleu.init();
  console.log('✓ Models initialized');

  // Prepare training data
  const trainingData = {
    features: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ],
    labels: [0, 1, 0]
  };

  // Train the model
  console.log('Training model...');
  await bleu.train(trainingData);
  console.log('✓ Model trained successfully');

  // Make predictions
  const input = [[2, 3, 4]];
  const predictions = await bleu.predict(input);
  console.log('Predictions:', predictions);

  // Get performance metrics
  const metrics = await bleu.getPerformanceMetrics();
  console.log('Performance Metrics:', metrics);
}

main().catch(console.error); 