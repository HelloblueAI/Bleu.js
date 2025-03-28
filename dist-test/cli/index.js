"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const analyze_1 = require("./analyze");
const generate_1 = require("./generate");
const optimize_1 = require("./optimize");
const package_json_1 = require("../../package.json");
const program = new commander_1.Command();
async function displayBanner() {
    console.log(figlet_1.default.textSync('Bleu.js', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }));
    console.log(`Version: ${package_json_1.version}\n`);
}
async function main() {
    await displayBanner();
    program
        .version(package_json_1.version)
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
            const config = {
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
            await (0, generate_1.generate)({
                prompt: options.prompt,
                template: options.template,
                language: options.language,
                framework: options.framework,
                config
            });
        }
        catch (error) {
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
            const config = {
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
            await (0, analyze_1.analyze)({
                path: options.path,
                recursive: options.recursive,
                output: options.output,
                config
            });
        }
        catch (error) {
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
            const config = {
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
            await (0, optimize_1.optimize)({
                path: options.path,
                recursive: options.recursive,
                output: options.output,
                config
            });
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map