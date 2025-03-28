"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bleu_1 = require("./bleu");
async function runTest(name, testFn) {
    try {
        await testFn();
        return { success: true, message: `✓ ${name} successful` };
    }
    catch (error) {
        return {
            success: false,
            message: `✗ ${name} failed`,
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}
async function runTests() {
    console.log('Starting Bleu.js tests...\n');
    const bleu = new bleu_1.Bleu({
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
    const tests = [
        {
            name: 'Text Processing',
            run: async () => {
                await bleu.process('Hello, world!', {
                    maxTokens: 100,
                    temperature: 0.7
                });
            }
        },
        {
            name: 'Code Analysis',
            run: async () => {
                const code = `
          function add(a: number, b: number): number {
            return a + b;
          }
        `;
                await bleu.analyzeCode(code);
            }
        },
        {
            name: 'Cleanup',
            run: async () => {
                bleu.dispose();
            }
        }
    ];
    let allTestsPassed = true;
    for (const test of tests) {
        const result = await runTest(test.name, test.run);
        console.log(result.message);
        if (!result.success) {
            allTestsPassed = false;
            console.error('Error:', result.error?.message);
            break;
        }
        console.log(''); // Add newline between tests
    }
    if (allTestsPassed) {
        console.log('All tests passed successfully! 🎉\n');
    }
    else {
        process.exit(1);
    }
}
runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-bleu.js.map