"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
exports.generate = generate;
exports.generateCode = generateCode;
const commander_1 = require("commander");
const logger_1 = require("../utils/logger");
const bleuAI_1 = require("../ai/bleuAI");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
exports.generate = new commander_1.Command()
    .name('bleu generate')
    .description('Generate code using BleuAI')
    .option('-p, --prompt <prompt>', 'Prompt for code generation')
    .option('-t, --temperature <temperature>', 'Temperature for generation', '0.7')
    .option('-m, --max-tokens <maxTokens>', 'Maximum tokens to generate', '2048')
    .option('-m, --model <model>', 'AI model to use (bleu or huggingface)', 'bleu')
    .option('--bleu-key <key>', 'BleuAI API key')
    .action(async (options) => {
    try {
        if (!options.prompt) {
            throw new Error('No prompt provided');
        }
        let result;
        switch (options.model) {
            case 'bleu':
                result = await generateWithBleuAI(options.prompt, options.bleuKey, parseFloat(options.temperature), parseInt(options.maxTokens));
                break;
            case 'huggingface':
                result = await generateWithHuggingFace(options.prompt, parseFloat(options.temperature), parseInt(options.maxTokens));
                break;
            default:
                throw new Error(`Unsupported model: ${options.model}`);
        }
        console.log(result);
    }
    catch (error) {
        logger_1.logger.error('Code generation failed', { error });
        process.exit(1);
    }
});
program.parse();
async function generateWithBleuAI(prompt, apiKey, temperature = 0.7, maxTokens = 2048) {
    if (!apiKey && !process.env.BLEU_API_KEY) {
        throw new Error('BleuAI API key is required');
    }
    const bleuAI = new bleuAI_1.BleuAI({
        apiKey: apiKey || process.env.BLEU_API_KEY,
        model: 'bleu-code-generator',
        maxTokens,
        temperature
    });
    const response = await bleuAI.generate({
        prompt,
        maxTokens,
        temperature
    });
    return response;
}
async function generateWithHuggingFace(prompt, temperature = 0.7, maxTokens = 2048) {
    // Implement HuggingFace generation
    return 'HuggingFace generation not implemented yet';
}
async function generate(options) {
    try {
        logger_1.logger.info('Initializing BleuAI...');
        const bleuAI = new bleuAI_1.BleuAI(options.config);
        await bleuAI.initialize();
        logger_1.logger.info('Generating code...');
        const code = await bleuAI.generateCode(options.prompt);
        logger_1.logger.info('Generated code:');
        console.log(code);
        await bleuAI.dispose();
    }
    catch (error) {
        logger_1.logger.error('Error generating code:', error);
        throw error;
    }
}
async function generateCode(options) {
    const { template = 'default', language = 'typescript', framework = 'express', output = 'generated', } = options;
    // Create output directory if it doesn't exist
    if (!fs_1.default.existsSync(output)) {
        fs_1.default.mkdirSync(output, { recursive: true });
    }
    // Generate code using OpenAI
    const prompt = `Generate a ${language} application using ${framework} framework with the following features:
1. Clean architecture
2. Type safety
3. Error handling
4. Logging
5. Testing setup
6. Documentation
7. Security best practices
8. Performance optimization
9. CI/CD configuration
10. Docker support`;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert software architect and developer.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });
        const generatedCode = completion.choices[0].message.content;
        // Save the generated code
        const outputPath = path_1.default.join(output, 'generated-code.ts');
        fs_1.default.writeFileSync(outputPath, generatedCode);
        // Format the code using Prettier
        await execAsync(`npx prettier --write ${outputPath}`);
        // Generate tests using Hugging Face
        const testPrompt = `Generate unit tests for the following ${language} code:\n${generatedCode}`;
        const testCompletion = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: testPrompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7,
            },
        });
        const generatedTests = testCompletion.generated_text;
        const testOutputPath = path_1.default.join(output, 'generated-code.test.ts');
        fs_1.default.writeFileSync(testOutputPath, generatedTests);
        // Format the tests
        await execAsync(`npx prettier --write ${testOutputPath}`);
        // Generate documentation
        const docPrompt = `Generate comprehensive documentation for the following ${language} code:\n${generatedCode}`;
        const docCompletion = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: docPrompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7,
            },
        });
        const generatedDocs = docCompletion.generated_text;
        const docOutputPath = path_1.default.join(output, 'README.md');
        fs_1.default.writeFileSync(docOutputPath, generatedDocs);
        // Generate Docker configuration
        const dockerPrompt = `Generate a Dockerfile and docker-compose.yml for the following ${language} application:\n${generatedCode}`;
        const dockerCompletion = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: dockerPrompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7,
            },
        });
        const generatedDocker = dockerCompletion.generated_text;
        const dockerOutputPath = path_1.default.join(output, 'Dockerfile');
        fs_1.default.writeFileSync(dockerOutputPath, generatedDocker);
        // Generate CI/CD configuration
        const cicdPrompt = `Generate GitHub Actions workflow for the following ${language} application:\n${generatedCode}`;
        const cicdCompletion = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: cicdPrompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7,
            },
        });
        const generatedCICD = cicdCompletion.generated_text;
        const cicdOutputPath = path_1.default.join(output, '.github/workflows/ci.yml');
        fs_1.default.mkdirSync(path_1.default.dirname(cicdOutputPath), { recursive: true });
        fs_1.default.writeFileSync(cicdOutputPath, generatedCICD);
        // Initialize git repository
        await execAsync(`cd ${output} && git init && git add . && git commit -m "Initial commit"`);
        // Install dependencies
        await execAsync(`cd ${output} && pnpm install`);
        console.log('✨ Generated files:');
        console.log(`- ${outputPath}`);
        console.log(`- ${testOutputPath}`);
        console.log(`- ${docOutputPath}`);
        console.log(`- ${dockerOutputPath}`);
        console.log(`- ${cicdOutputPath}`);
    }
    catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
}
//# sourceMappingURL=generate.js.map