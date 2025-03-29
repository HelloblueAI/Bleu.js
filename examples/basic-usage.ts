import { BleuClient } from '../src/core/bleuClient.js';

// Initialize the Bleu.js client with your API key
const client = new BleuClient({
  apiKey: 'your-api-key', // Replace with your actual API key
  plan: 'basic', // or 'enterprise' for advanced features
});

async function main() {
  try {
    // Example 1: Generate text using AI
    console.log('Generating text...');
    const aiResponse = await client.generateText('Write a story about a robot learning to paint', {
      maxTokens: 100,
      temperature: 0.7,
    });
    console.log('AI Response:', aiResponse);

    // Example 2: Run a quantum circuit
    console.log('\nRunning quantum circuit...');
    const quantumResponse = await client.runQuantumCircuit('H|0⟩', {
      shots: 1000,
    });
    console.log('Quantum Response:', quantumResponse);

    // Example 3: Check usage stats
    console.log('\nChecking usage stats...');
    const usage = await client.getUsageStats();
    console.log('Usage Stats:', usage);

    // Example 4: Enterprise features (only available with enterprise plan)
    if (client.plan === 'enterprise') {
      console.log('\nTraining custom model...');
      const trainingResponse = await client.trainCustomModel(
        { /* your training data */ },
        {
          modelType: 'text-generation',
          epochs: 10,
          batchSize: 32,
        }
      );
      console.log('Training Response:', trainingResponse);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the examples
main(); 