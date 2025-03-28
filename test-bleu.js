import Bleu from './src/bleu.js';

async function runTests() {
  console.log('Starting Bleu.js tests...\n');

  try {
    // Initialize Bleu
    const bleu = new Bleu({
      modelPath: './models',
      architecture: {
        type: 'transformer',
        layers: 12,
        attentionHeads: 8,
        hiddenSize: 768,
        vocabularySize: 50000,
        maxSequenceLength: 2048
      }
    });

    // Test 1: Text Processing
    console.log('Test 1: Text Processing');
    const textResult = await bleu.process('Hello, world!', {
      maxTokens: 100,
      temperature: 0.7
    });
    console.log('Result:', textResult);
    console.log('Status: ✓\n');

    // Test 2: Code Analysis
    console.log('Test 2: Code Analysis');
    const code = `
      function add(a, b) {
        return a + b;
      }
    `;
    const analysisResult = await bleu.analyzeCode(code);
    console.log('Result:', analysisResult);
    console.log('Status: ✓\n');

    // Test 3: Model Cleanup
    console.log('Test 3: Model Cleanup');
    bleu.dispose();
    console.log('Status: ✓\n');

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests(); 