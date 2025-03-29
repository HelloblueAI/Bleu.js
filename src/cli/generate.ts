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

export interface GenerateOptions {
  type: 'bleu' | 'huggingface';
  config: Record<string, unknown>;
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
          result = await generateBleu(options);
          break;
        case 'huggingface':
          result = await generateHuggingFace(options);
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

async function generateBleu(options: GenerateOptions) {
  try {
    logger.info('Initializing BleuAI...');
    const bleuAI = new BleuAI(options.config);
    await bleuAI.initialize();
    
    logger.info('Generating code...');
    const result = await bleuAI.generate();
    
    logger.info('Code generation completed successfully');
    return result;
  } catch (error) {
    logger.error('Failed to generate code with BleuAI', { error });
    throw error;
  }
}

async function generateHuggingFace(options: GenerateOptions) {
  return 'HuggingFace generation not implemented yet';
}

export async function generateFullProject(options: GenerateOptions) {
  try {
    logger.info('Initializing BleuAI...');
    const bleuAI = new BleuAI(options.config);
    await bleuAI.initialize();
    
    logger.info('Generating project...');
    const result = await bleuAI.generate();
    
    logger.info('Project generation completed successfully');
    return result;
  } catch (error) {
    logger.error('Failed to generate project', { error });
    throw error;
  }
} 