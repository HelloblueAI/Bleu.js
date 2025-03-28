import { logger } from '../../config/logger.mjs';
import { Configuration, OpenAIApi } from 'openai';

export class AIOptimizer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.initialized = false;
    this.openai = null;
    this.model = 'gpt-4';
    this.temperature = 0.7;
    this.maxTokens = 2000;
  }

  /**
   * Initialize AI optimizer
   */
  async initialize() {
    try {
      const configuration = new Configuration({
        apiKey: this.apiKey,
      });
      this.openai = new OpenAIApi(configuration);
      this.initialized = true;
      logger.info('✅ AI optimizer initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize AI optimizer:', error);
      throw error;
    }
  }

  /**
   * Optimize code using AI
   */
  async optimizeCode(code, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const prompt = this._generateOptimizationPrompt(code, options);
      const completion = await this.openai.createCompletion({
        model: this.model,
        prompt,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const optimizedCode = completion.data.choices[0].text.trim();
      return this._validateOptimizedCode(optimizedCode, code);
    } catch (error) {
      logger.error('❌ Failed to optimize code:', error);
      throw error;
    }
  }

  /**
   * Generate code using AI
   */
  async generateCode(description, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const prompt = this._generateCodePrompt(description, options);
      const completion = await this.openai.createCompletion({
        model: this.model,
        prompt,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      return completion.data.choices[0].text.trim();
    } catch (error) {
      logger.error('❌ Failed to generate code:', error);
      throw error;
    }
  }

  /**
   * Analyze code quality using AI
   */
  async analyzeCode(code) {
    try {
      if (!this.initialized) await this.initialize();

      const prompt = this._generateAnalysisPrompt(code);
      const completion = await this.openai.createCompletion({
        model: this.model,
        prompt,
        temperature: 0.3,
        max_tokens: 500,
      });

      return this._parseAnalysis(completion.data.choices[0].text);
    } catch (error) {
      logger.error('❌ Failed to analyze code:', error);
      throw error;
    }
  }

  /**
   * Generate documentation using AI
   */
  async generateDocumentation(code) {
    try {
      if (!this.initialized) await this.initialize();

      const prompt = this._generateDocumentationPrompt(code);
      const completion = await this.openai.createCompletion({
        model: this.model,
        prompt,
        temperature: 0.5,
        max_tokens: 1000,
      });

      return completion.data.choices[0].text.trim();
    } catch (error) {
      logger.error('❌ Failed to generate documentation:', error);
      throw error;
    }
  }

  /**
   * Update AI settings
   */
  async updateSettings(settings) {
    try {
      this.model = settings.model || this.model;
      this.temperature = settings.temperature || this.temperature;
      this.maxTokens = settings.maxTokens || this.maxTokens;
      if (settings.apiKey) {
        this.apiKey = settings.apiKey;
        await this.initialize();
      }
      logger.info('✅ AI settings updated');
    } catch (error) {
      logger.error('❌ Failed to update AI settings:', error);
      throw error;
    }
  }

  /**
   * Get AI metrics
   */
  async getMetrics() {
    return {
      initialized: this.initialized,
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      lastUpdate: new Date().toISOString()
    };
  }

  // Private methods

  _generateOptimizationPrompt(code, options) {
    return `Optimize the following code for ${options.optimizationType || 'performance'}:
    
    Original code:
    ${code}
    
    Requirements:
    - Maintain functionality
    - Improve ${options.optimizationType || 'performance'}
    - Follow best practices
    - Add comments for clarity
    
    Optimized code:`;
  }

  _generateCodePrompt(description, options) {
    return `Generate code based on the following description:
    
    Description: ${description}
    
    Requirements:
    - Use ${options.language || 'JavaScript'}
    - Follow best practices
    - Include error handling
    - Add comments for clarity
    
    Generated code:`;
  }

  _generateAnalysisPrompt(code) {
    return `Analyze the following code and provide a detailed assessment:
    
    Code:
    ${code}
    
    Please provide:
    1. Code quality score (0-100)
    2. Performance assessment
    3. Security considerations
    4. Maintainability score
    5. Suggested improvements
    
    Analysis:`;
  }

  _generateDocumentationPrompt(code) {
    return `Generate comprehensive documentation for the following code:
    
    Code:
    ${code}
    
    Please include:
    1. Overview
    2. Function/class descriptions
    3. Parameters and return values
    4. Usage examples
    5. Dependencies
    
    Documentation:`;
  }

  _validateOptimizedCode(optimizedCode, originalCode) {
    // Basic validation to ensure the optimized code maintains functionality
    if (!optimizedCode || optimizedCode.length < 10) {
      throw new Error('Invalid optimized code generated');
    }

    // Check if the optimized code contains the main functionality
    const originalFunctions = this._extractFunctions(originalCode);
    const optimizedFunctions = this._extractFunctions(optimizedCode);

    if (!this._compareFunctions(originalFunctions, optimizedFunctions)) {
      throw new Error('Optimized code does not maintain original functionality');
    }

    return optimizedCode;
  }

  _extractFunctions(code) {
    // Extract function names from code
    const functionRegex = /function\s+(\w+)\s*\(/g;
    const functions = [];
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  _compareFunctions(original, optimized) {
    // Compare function names between original and optimized code
    return original.every(func => optimized.includes(func));
  }

  _parseAnalysis(analysis) {
    // Parse the AI analysis into a structured format
    const lines = analysis.split('\n');
    const result = {
      qualityScore: 0,
      performance: '',
      security: '',
      maintainability: 0,
      improvements: []
    };

    lines.forEach(line => {
      if (line.includes('quality score')) {
        result.qualityScore = parseInt(line.match(/\d+/)[0]);
      } else if (line.includes('performance')) {
        result.performance = line.split(':')[1].trim();
      } else if (line.includes('security')) {
        result.security = line.split(':')[1].trim();
      } else if (line.includes('maintainability')) {
        result.maintainability = parseInt(line.match(/\d+/)[0]);
      } else if (line.includes('improvement')) {
        result.improvements.push(line.split('-')[1].trim());
      }
    });

    return result;
  }
} 