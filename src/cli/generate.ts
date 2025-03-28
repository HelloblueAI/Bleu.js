import { Command } from 'commander';
import inquirer from 'inquirer';
import { Configuration, OpenAIApi } from 'openai';
import { HfInference } from '@huggingface/inference';
import { logger } from '../utils/logger';
import { BleuAI } from '../ai/bleuAI';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { BleuConfig } from '../types';

const execAsync = promisify(exec);

interface GenerateOptions {
  prompt: string;
  template: string;
  language: string;
  framework: string;
  config: BleuConfig;
}

export const generate = new Command()
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
          result = await generateWithBleuAI(
            options.prompt,
            options.bleuKey,
            parseFloat(options.temperature),
            parseInt(options.maxTokens)
          );
          break;
        case 'huggingface':
          result = await generateWithHuggingFace(
            options.prompt,
            parseFloat(options.temperature),
            parseInt(options.maxTokens)
          );
          break;
        default:
          throw new Error(`Unsupported model: ${options.model}`);
      }

      console.log(result);
    } catch (error) {
      logger.error('Code generation failed', { error });
      process.exit(1);
    }
  });

program.parse();

async function generateWithBleuAI(
  prompt: string,
  apiKey?: string,
  temperature: number = 0.7,
  maxTokens: number = 2048
): Promise<string> {
  if (!apiKey && !process.env.BLEU_API_KEY) {
    throw new Error('BleuAI API key is required');
  }

  const bleuAI = new BleuAI({
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

async function generateWithHuggingFace(
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2048
): Promise<string> {
  // Implement HuggingFace generation
  return 'HuggingFace generation not implemented yet';
}

export async function generate(options: GenerateOptions): Promise<void> {
  try {
    logger.info('Initializing BleuAI...');
    const bleuAI = new BleuAI(options.config);
    await bleuAI.initialize();

    logger.info('Generating code...');
    const code = await bleuAI.generateCode(options.prompt);

    logger.info('Generated code:');
    console.log(code);

    await bleuAI.dispose();
  } catch (error) {
    logger.error('Error generating code:', error);
    throw error;
  }
}

export async function generateCode(options: GenerateOptions): Promise<void> {
  const {
    template = 'default',
    language = 'typescript',
    framework = 'express',
    output = 'generated',
  } = options;

  // Create output directory if it doesn't exist
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
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
    const outputPath = path.join(output, 'generated-code.ts');
    fs.writeFileSync(outputPath, generatedCode);

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
    const testOutputPath = path.join(output, 'generated-code.test.ts');
    fs.writeFileSync(testOutputPath, generatedTests);

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
    const docOutputPath = path.join(output, 'README.md');
    fs.writeFileSync(docOutputPath, generatedDocs);

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
    const dockerOutputPath = path.join(output, 'Dockerfile');
    fs.writeFileSync(dockerOutputPath, generatedDocker);

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
    const cicdOutputPath = path.join(output, '.github/workflows/ci.yml');
    fs.mkdirSync(path.dirname(cicdOutputPath), { recursive: true });
    fs.writeFileSync(cicdOutputPath, generatedCICD);

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
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
} 