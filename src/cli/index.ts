import { Command } from 'commander';
import figlet from 'figlet';
import { analyze } from './analyze';
import { generate } from './generate';
import { optimize } from './optimize';
import { version } from '../../package.json';
import { BleuConfig } from '../types';

const program = new Command();

async function displayBanner(): Promise<void> {
  console.log(
    figlet.textSync('Bleu.js', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  );
  console.log(`Version: ${version}\n`);
}

async function main(): Promise<void> {
  await displayBanner();

  program
    .version(version)
    .description('Bleu.js - Advanced AI Code Generation and Optimization');

  program
    .command('generate')
    .description('Generate code using AI')
    .option('-p, --prompt <prompt>', 'Code generation prompt')
    .option('-t, --template <template>', 'Code template to use', 'default')
    .option('-l, --language <language>', 'Programming language', 'typescript')
    .option('-f, --framework <framework>', 'Framework to use', 'express')
    .option('--max-tokens <maxTokens>', 'Maximum tokens to generate', '2048')
    .option('--temperature <temperature>', 'Generation temperature', '0.7')
    .action(async (options) => {
      try {
        const config: BleuConfig = {
          core: {
            huggingfaceToken: process.env.HUGGINGFACE_TOKEN || '',
            maxTokens: parseInt(options.maxTokens),
            temperature: parseFloat(options.temperature)
          },
          model: {
            inputShape: [1, 512],
            layers: [],
            outputShape: [1, 512]
          },
          training: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 10,
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
          },
          security: {
            encryptionLevel: 'standard',
            enableFirewall: true,
            enableAudit: true,
            maxRetries: 3
          },
          performance: {
            enableGPU: false,
            enableTPU: false,
            enableDistributedTraining: false,
            maxConcurrentRequests: 10,
            cacheSize: 1024
          },
          monitoring: {
            enableMetrics: true,
            enableLogging: true,
            logLevel: 'info',
            metricsPort: 9090,
            notificationChannels: ['console']
          },
          deployment: {
            port: 3000,
            host: 'localhost',
            environment: 'development',
            healthCheckPath: '/health',
            metricsPath: '/metrics'
          }
        };

        await generate({
          prompt: options.prompt,
          template: options.template,
          language: options.language,
          framework: options.framework,
          config
        });
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  program
    .command('analyze')
    .description('Analyze code using AI')
    .option('-p, --path <path>', 'Path to code file or directory')
    .option('-r, --recursive', 'Analyze directory recursively')
    .option('-o, --output <output>', 'Output format (json, text)', 'text')
    .action(async (options) => {
      try {
        const config: BleuConfig = {
          core: {
            huggingfaceToken: process.env.HUGGINGFACE_TOKEN || '',
            maxTokens: 2048,
            temperature: 0.7
          },
          model: {
            inputShape: [1, 512],
            layers: [],
            outputShape: [1, 512]
          },
          training: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 10,
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
          },
          security: {
            encryptionLevel: 'standard',
            enableFirewall: true,
            enableAudit: true,
            maxRetries: 3
          },
          performance: {
            enableGPU: false,
            enableTPU: false,
            enableDistributedTraining: false,
            maxConcurrentRequests: 10,
            cacheSize: 1024
          },
          monitoring: {
            enableMetrics: true,
            enableLogging: true,
            logLevel: 'info',
            metricsPort: 9090,
            notificationChannels: ['console']
          },
          deployment: {
            port: 3000,
            host: 'localhost',
            environment: 'development',
            healthCheckPath: '/health',
            metricsPath: '/metrics'
          }
        };

        await analyze({
          path: options.path,
          recursive: options.recursive,
          output: options.output,
          config
        });
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  program
    .command('optimize')
    .description('Optimize code using AI')
    .option('-p, --path <path>', 'Path to code file or directory')
    .option('-r, --recursive', 'Optimize directory recursively')
    .option('-o, --output <output>', 'Output directory', 'optimized')
    .action(async (options) => {
      try {
        const config: BleuConfig = {
          core: {
            huggingfaceToken: process.env.HUGGINGFACE_TOKEN || '',
            maxTokens: 2048,
            temperature: 0.7
          },
          model: {
            inputShape: [1, 512],
            layers: [],
            outputShape: [1, 512]
          },
          training: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 10,
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
          },
          security: {
            encryptionLevel: 'standard',
            enableFirewall: true,
            enableAudit: true,
            maxRetries: 3
          },
          performance: {
            enableGPU: false,
            enableTPU: false,
            enableDistributedTraining: false,
            maxConcurrentRequests: 10,
            cacheSize: 1024
          },
          monitoring: {
            enableMetrics: true,
            enableLogging: true,
            logLevel: 'info',
            metricsPort: 9090,
            notificationChannels: ['console']
          },
          deployment: {
            port: 3000,
            host: 'localhost',
            environment: 'development',
            healthCheckPath: '/health',
            metricsPath: '/metrics'
          }
        };

        await optimize({
          path: options.path,
          recursive: options.recursive,
          output: options.output,
          config
        });
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}); 