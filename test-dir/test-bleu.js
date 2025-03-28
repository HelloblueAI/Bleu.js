import Bleu from 'bleu.js';

async function testBleu() {
  try {
    // Initialize Bleu with test API key
    const bleu = new Bleu({
      apiKey: 'test_api_key',
      version: 'v2',
      timeout: 30000,
      retries: 3
    });

    console.log('Testing text processing...');
    const textResult = await bleu.process('Hello, world!');
    console.log('Text processing result:', textResult);

    console.log('\nTesting code analysis...');
    const codeResult = await bleu.analyzeCode(`
      function add(a, b) {
        return a + b;
      }
    `);
    console.log('Code analysis result:', codeResult);

    console.log('\nTesting code generation...');
    const generatedCode = await bleu.generateCode('Create a function to calculate factorial');
    console.log('Generated code:', generatedCode);

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testBleu(); 