import { Command } from 'commander';
import inquirer from 'inquirer';
import { Configuration, OpenAIApi } from 'openai';
import { HfInference } from '@huggingface/inference';
import { logger } from '../utils/logger';
import { BleuAI } from '../ai/bleuAI';
import { NLPProcessor } from '../ai/nlpProcessor';
import { BleuConfig } from '../types';

interface AnalyzeOptions {
  path: string;
  recursive: boolean;
  output: 'json' | 'text';
  config: BleuConfig;
}

export const analyze = new Command()
  .name('bleu analyze')
  .description('Analyze code using BleuAI')
  .option('-f, --file <file>', 'File to analyze')
  .option('-c, --code <code>', 'Code to analyze')
  .option('-m, --model <model>', 'AI model to use (bleu or huggingface)', 'bleu')
  .option('--bleu-key <key>', 'BleuAI API key')
  .action(async (options: AnalyzeOptions) => {
    try {
      let text = options.code;
      if (options.file) {
        text = await readFile(options.file);
      }

      if (!text) {
        throw new Error('No code provided');
      }

      let result;
      switch (options.model) {
        case 'bleu':
          result = await analyzeWithBleuAI(text, options.bleuKey);
          break;
        case 'huggingface':
          result = await analyzeWithHuggingFace(text);
          break;
        default:
          throw new Error(`Unsupported model: ${options.model}`);
      }

      console.log(result);
    } catch (error) {
      logger.error('Code analysis failed', { error });
      process.exit(1);
    }
  });

async function readFile(filePath: string): Promise<string> {
  try {
    const fs = await import('fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    logger.error('Failed to read file', { error, filePath });
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

async function analyzeWithBleuAI(text: string, apiKey?: string): Promise<any> {
  if (!apiKey && !process.env.BLEU_API_KEY) {
    throw new Error('BleuAI API key is required');
  }

  const bleuAI = new BleuAI({
    apiKey: apiKey || process.env.BLEU_API_KEY,
    model: 'bleu-code-analyzer',
    maxTokens: 2048,
    temperature: 0.7
  });

  const response = await bleuAI.analyze({
    prompt: `Analyze this code:\n${text}`,
    maxTokens: 2048,
    temperature: 0.7
  });

  return response;
}

async function analyzeWithHuggingFace(text: string): Promise<any> {
  // Implement HuggingFace analysis
  return { message: 'HuggingFace analysis not implemented yet' };
}

export async function analyzeCode(options: AnalyzeOptions): Promise<void> {
  try {
    logger.info('Initializing BleuAI...');
    const bleuAI = new BleuAI(options.config);
    await bleuAI.initialize();

    logger.info(`Analyzing code at ${options.path}...`);
    const result = await bleuAI.processInput(options.path);

    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }

    await bleuAI.dispose();
  } catch (error) {
    logger.error('Error analyzing code:', error);
    throw error;
  }
} 