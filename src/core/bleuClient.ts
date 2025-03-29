import { createLogger } from '../utils/logger.js';
import { APITestHelper } from '../__tests__/helpers/apiTestHelper.js';

const logger = createLogger('BleuClient');

interface BleuClientConfig {
  apiKey: string;
  environment?: 'development' | 'production' | 'staging';
  plan?: 'basic' | 'enterprise';
  maxRetries?: number;
  timeout?: number;
  baseUrl?: string;
}

interface AIResponse {
  text: string;
  confidence: number;
  processingTime: number;
  model: string;
}

interface QuantumResponse {
  state: number[];
  measurement: number;
  confidence: number;
  processingTime: number;
}

export class BleuClient {
  private readonly apiKey: string;
  private readonly environment: 'development' | 'production' | 'staging';
  private readonly plan: string;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly baseUrl: string;

  constructor(config: BleuClientConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment ?? 'production';
    this.plan = config.plan ?? 'basic';
    this.maxRetries = config.maxRetries ?? 3;
    this.timeout = config.timeout ?? 30000;
    this.baseUrl = config.baseUrl ?? 'https://api.bleu.ai';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'x-plan': this.plan,
      'x-client': 'bleu-js',
      'x-version': '1.0.0',
    };
  }

  // AI Services
  async generateText(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}): Promise<AIResponse> {
    try {
      const response = await APITestHelper.ai.post('/predict', {
        input: prompt,
        ...options,
      }, {
        headers: this.getHeaders(),
      });

      return {
        text: response.data.output,
        confidence: response.data.confidence,
        processingTime: response.data.processingTime,
        model: response.data.model,
      };
    } catch (error) {
      logger.error('Error generating text:', error);
      throw error;
    }
  }

  // Quantum Services
  async runQuantumCircuit(circuit: string, options: {
    shots?: number;
    backend?: string;
  } = {}): Promise<QuantumResponse> {
    try {
      const response = await APITestHelper.quantum.post('/compute', {
        circuit,
        ...options,
      }, {
        headers: this.getHeaders(),
      });

      return {
        state: response.data.state,
        measurement: response.data.measurement,
        confidence: response.data.confidence,
        processingTime: response.data.processingTime,
      };
    } catch (error) {
      logger.error('Error running quantum circuit:', error);
      throw error;
    }
  }

  // Enterprise Features
  async trainCustomModel(data: any, options: {
    modelType: string;
    epochs?: number;
    batchSize?: number;
  }): Promise<any> {
    if (this.plan !== 'enterprise') {
      throw new Error('Custom model training is only available in the Enterprise plan');
    }

    try {
      const response = await APITestHelper.ai.post('/train', {
        data,
        ...options,
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      logger.error('Error training custom model:', error);
      throw error;
    }
  }

  // Usage Tracking
  async getUsageStats(): Promise<{
    totalCalls: number;
    remainingCalls: number;
    resetDate: string;
  }> {
    try {
      const response = await APITestHelper.aws.get('/usage', {
        headers: this.getHeaders(),
      });

      return {
        totalCalls: response.data.totalCalls,
        remainingCalls: response.data.remainingCalls,
        resetDate: response.data.resetDate,
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      throw error;
    }
  }

  // Plan Management
  async upgradePlan(newPlan: 'basic' | 'enterprise'): Promise<void> {
    try {
      await APITestHelper.aws.post('/plan/upgrade', {
        plan: newPlan,
      }, {
        headers: this.getHeaders(),
      });

      this.plan = newPlan;
    } catch (error) {
      logger.error('Error upgrading plan:', error);
      throw error;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, this.timeout));
      return this.retryWithBackoff(operation, retries - 1);
    }
  }
}

// Export a singleton instance
export const bleu = new BleuClient({
  apiKey: process.env.BLEU_API_KEY || '',
  environment: process.env.NODE_ENV as 'development' | 'production' | 'staging',
  plan: process.env.BLEU_PLAN as 'basic' | 'enterprise',
}); 