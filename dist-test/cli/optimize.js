"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize = optimize;
exports.optimizeCode = optimizeCode;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const openai_1 = require("openai");
const inference_1 = require("@huggingface/inference");
const perf_hooks_1 = require("perf_hooks");
const commander_1 = require("commander");
const bleuAI_1 = require("../ai/bleuAI");
const logger_1 = require("../utils/logger");
const promises_1 = __importDefault(require("fs/promises"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const openai = new openai_1.OpenAI();
const hf = new inference_1.HfInference(process.env.HUGGINGFACE_API_KEY);
const program = new commander_1.Command();
program
    .name('bleu optimize')
    .description('Optimize code using BleuAI')
    .option('-f, --file <file>', 'File to optimize')
    .option('-c, --code <code>', 'Code to optimize')
    .option('-t, --temperature <temperature>', 'Temperature for generation', '0.7')
    .option('-m, --max-tokens <maxTokens>', 'Maximum tokens to generate', '2048')
    .option('--bleu-key <key>', 'BleuAI API key')
    .action(async (options) => {
    try {
        const bleuAI = new bleuAI_1.BleuAI({
            apiKey: options.bleuKey || process.env.BLEU_API_KEY,
            model: 'bleu-code-optimizer',
            maxTokens: parseInt(options.maxTokens),
            temperature: parseFloat(options.temperature)
        });
        let code = options.code;
        if (options.file) {
            code = await fs_1.default.readFile(options.file, 'utf-8');
        }
        if (!code) {
            throw new Error('No code provided');
        }
        // Use BleuAI for code optimization suggestions
        const completion = await bleuAI.optimize({
            prompt: `Optimize this code:\n${code}`,
            maxTokens: parseInt(options.maxTokens),
            temperature: parseFloat(options.temperature)
        });
        console.log(completion);
    }
    catch (error) {
        logger_1.logger.error('Code optimization failed', { error });
        process.exit(1);
    }
});
program.parse();
async function optimize(options) {
    try {
        logger_1.logger.info('Initializing BleuAI...');
        const bleuAI = new bleuAI_1.BleuAI(options.config);
        await bleuAI.initialize();
        logger_1.logger.info(`Reading code from ${options.path}...`);
        const code = await promises_1.default.readFile(options.path, 'utf-8');
        logger_1.logger.info('Optimizing code...');
        const optimizedCode = await bleuAI.optimizeCode(code);
        const outputPath = path_1.default.join(options.output, path_1.default.basename(options.path));
        await promises_1.default.mkdir(options.output, { recursive: true });
        await promises_1.default.writeFile(outputPath, optimizedCode);
        logger_1.logger.info(`Optimized code saved to ${outputPath}`);
        await bleuAI.dispose();
    }
    catch (error) {
        logger_1.logger.error('Error optimizing code:', error);
        throw error;
    }
}
async function optimizeCode(options) {
    const { path: optimizePath, recursive = false, output = 'optimized' } = options;
    try {
        // Create output directory if it doesn't exist
        if (!fs_1.default.existsSync(output)) {
            fs_1.default.mkdirSync(output, { recursive: true });
        }
        const results = {
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0,
            performanceImprovement: {
                executionTime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
            },
            optimizations: [],
        };
        // Read original code
        const originalCode = fs_1.default.readFileSync(optimizePath, 'utf-8');
        results.originalSize = originalCode.length;
        // Get original performance metrics
        const originalStartTime = perf_hooks_1.performance.now();
        const originalStartMemory = process.memoryUsage();
        const originalStartCPU = process.cpuUsage();
        await execAsync(`node ${optimizePath}`);
        const originalEndTime = perf_hooks_1.performance.now();
        const originalEndMemory = process.memoryUsage();
        const originalEndCPU = process.cpuUsage();
        // Use OpenAI for code optimization suggestions
        const optimizationPrompt = `Optimize the following code for better performance, memory usage, and maintainability:\n${originalCode}`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert code optimizer and performance engineer.',
                },
                {
                    role: 'user',
                    content: optimizationPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });
        const optimizedCode = completion.choices[0].message.content;
        // Use Hugging Face for additional optimizations
        const hfOptimization = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: `Optimize the following code for better performance and memory efficiency:\n${optimizedCode}`,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7,
            },
        });
        const finalOptimizedCode = hfOptimization.generated_text;
        // Save optimized code
        const outputPath = path_1.default.join(output, path_1.default.basename(optimizePath));
        fs_1.default.writeFileSync(outputPath, finalOptimizedCode);
        // Get optimized performance metrics
        const optimizedStartTime = perf_hooks_1.performance.now();
        const optimizedStartMemory = process.memoryUsage();
        const optimizedStartCPU = process.cpuUsage();
        await execAsync(`node ${outputPath}`);
        const optimizedEndTime = perf_hooks_1.performance.now();
        const optimizedEndMemory = process.memoryUsage();
        const optimizedEndCPU = process.cpuUsage();
        // Calculate performance improvements
        results.performanceImprovement = {
            executionTime: (originalEndTime - originalStartTime) - (optimizedEndTime - optimizedStartTime),
            memoryUsage: (originalEndMemory.heapUsed - originalStartMemory.heapUsed) -
                (optimizedEndMemory.heapUsed - optimizedStartMemory.heapUsed),
            cpuUsage: ((originalEndCPU.user - originalStartCPU.user) -
                (optimizedEndCPU.user - optimizedStartCPU.user)) / 1000000,
        };
        // Calculate size improvements
        results.optimizedSize = finalOptimizedCode.length;
        results.compressionRatio = (results.originalSize - results.optimizedSize) / results.originalSize * 100;
        // Run additional optimizations
        await execAsync(`npx terser ${outputPath} -o ${outputPath.replace('.js', '.min.js')} -c -m`);
        await execAsync(`npx prettier --write ${outputPath}`);
        // Analyze optimizations
        const optimizationAnalysis = await hf.textGeneration({
            model: 'bigscience/bloom',
            inputs: `Analyze the optimizations made to the following code and describe their impact:\n${finalOptimizedCode}`,
            parameters: {
                max_new_tokens: 1000,
                temperature: 0.7,
            },
        });
        // Parse optimization results
        const optimizationLines = optimizationAnalysis.generated_text.split('\n');
        results.optimizations = optimizationLines
            .filter(line => line.includes('optimization'))
            .map(line => ({
            type: line.split(':')[0].trim(),
            description: line.split(':')[1].trim(),
            impact: line.split('impact:')[1]?.trim() || 'Not specified',
        }));
        // Generate optimization report
        const report = generateOptimizationReport(results);
        fs_1.default.writeFileSync(path_1.default.join(output, 'optimization-report.html'), report);
        console.log('✨ Optimization completed!');
        console.log(`📦 Original size: ${results.originalSize} bytes`);
        console.log(`📦 Optimized size: ${results.optimizedSize} bytes`);
        console.log(`📊 Compression ratio: ${results.compressionRatio.toFixed(2)}%`);
        console.log(`⚡ Performance improvements:`);
        console.log(`  - Execution time: ${results.performanceImprovement.executionTime.toFixed(2)}ms`);
        console.log(`  - Memory usage: ${results.performanceImprovement.memoryUsage.toFixed(2)}MB`);
        console.log(`  - CPU usage: ${results.performanceImprovement.cpuUsage.toFixed(2)}ms`);
        console.log(`📄 Report saved to: ${path_1.default.join(output, 'optimization-report.html')}`);
    }
    catch (error) {
        console.error('Error optimizing code:', error);
        throw error;
    }
}
function generateOptimizationReport(results) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Code Optimization Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .score { font-weight: bold; color: #2196F3; }
    .improvement { color: #4CAF50; }
    .optimization { margin: 10px 0; padding: 10px; background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Code Optimization Report</h1>
  
  <h2>Size Optimization</h2>
  <div class="metric">
    <p>Original size: <span class="score">${results.originalSize} bytes</span></p>
    <p>Optimized size: <span class="score">${results.optimizedSize} bytes</span></p>
    <p>Compression ratio: <span class="improvement">${results.compressionRatio.toFixed(2)}%</span></p>
  </div>

  <h2>Performance Improvements</h2>
  <div class="metric">
    <p>Execution time improvement: <span class="improvement">${results.performanceImprovement.executionTime.toFixed(2)}ms</span></p>
    <p>Memory usage improvement: <span class="improvement">${results.performanceImprovement.memoryUsage.toFixed(2)}MB</span></p>
    <p>CPU usage improvement: <span class="improvement">${results.performanceImprovement.cpuUsage.toFixed(2)}ms</span></p>
  </div>

  <h2>Optimizations Applied</h2>
  ${results.optimizations.map(opt => `
    <div class="optimization">
      <h3>${opt.type}</h3>
      <p>${opt.description}</p>
      <p><strong>Impact:</strong> ${opt.impact}</p>
    </div>
  `).join('')}
</body>
</html>
  `;
}
//# sourceMappingURL=optimize.js.map