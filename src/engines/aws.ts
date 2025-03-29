import { Logger } from '../utils/logger';
import { AWSEngineConfig } from '../types/config';
import { AWSError } from '../types/errors';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AWSEngine {
  private logger: Logger;
  private config: AWSEngineConfig;
  private initialized: boolean = false;
  private readonly API_URL = 'https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod';
  private readonly API_KEY = 'JeF8N9VobS6OlgTFiAuba99hRX47e70R9b5ivnBR';
  private readonly SSO_PROFILE = 'Bleujs-SSO';
  private lastTokenRefresh: Date | null = null;
  private readonly TOKEN_REFRESH_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

  constructor(config: AWSEngineConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.region) {
        throw new AWSError('AWS region not specified');
      }

      // Initialize AWS SSO
      await this.initializeSSO();
      
      // Test API connection
      await this.testConnection();
      
      this.initialized = true;
      this.logger.info('AWS engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize AWS engine', error);
      throw new AWSError('Failed to initialize AWS engine');
    }
  }

  private async initializeSSO(): Promise<void> {
    try {
      // Check if we need to refresh the token
      if (this.shouldRefreshToken()) {
        await this.refreshSSOToken();
      }

      // Set up periodic token refresh
      setInterval(() => this.checkAndRefreshToken(), 60 * 60 * 1000); // Check every hour
    } catch (error) {
      this.logger.error('Failed to initialize AWS SSO', error);
      throw new AWSError('Failed to initialize AWS SSO');
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.lastTokenRefresh) return true;
    const timeSinceLastRefresh = Date.now() - this.lastTokenRefresh.getTime();
    return timeSinceLastRefresh >= this.TOKEN_REFRESH_INTERVAL;
  }

  private async checkAndRefreshToken(): Promise<void> {
    if (this.shouldRefreshToken()) {
      await this.refreshSSOToken();
    }
  }

  private async refreshSSOToken(): Promise<void> {
    try {
      this.logger.info('Refreshing AWS SSO token');
      await execAsync(`aws sso login --profile ${this.SSO_PROFILE}`);
      this.lastTokenRefresh = new Date();
      this.logger.info('AWS SSO token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh AWS SSO token', error);
      throw new AWSError('Failed to refresh AWS SSO token');
    }
  }

  async connectToEC2(instanceId: string): Promise<void> {
    if (!this.initialized) {
      throw new AWSError('AWS engine not initialized');
    }

    try {
      this.logger.info(`Connecting to EC2 instance ${instanceId}`);
      
      // Ensure SSO token is valid
      if (this.shouldRefreshToken()) {
        await this.refreshSSOToken();
      }

      // Connect to EC2 instance
      await execAsync(`aws ssm start-session --target ${instanceId} --profile ${this.SSO_PROFILE}`);
      this.logger.info(`Successfully connected to EC2 instance ${instanceId}`);
    } catch (error) {
      this.logger.error('Failed to connect to EC2 instance', error);
      throw new AWSError('Failed to connect to EC2 instance');
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.API_URL}/api`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        throw new AWSError('Failed to connect to AWS API');
      }
    } catch (error) {
      throw new AWSError('Failed to connect to AWS API');
    }
  }

  async deployModel(modelConfig: any): Promise<string> {
    if (!this.initialized) {
      throw new AWSError('AWS engine not initialized');
    }

    try {
      this.logger.info('Deploying model to AWS');
      
      // Ensure SSO token is valid
      if (this.shouldRefreshToken()) {
        await this.refreshSSOToken();
      }

      // Make API call to deploy model
      const response = await axios.post(`${this.API_URL}/api/ai/predict`, {
        input: modelConfig
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        }
      });

      if (response.status !== 200) {
        throw new AWSError('Failed to deploy model');
      }

      return response.data.endpoint;
    } catch (error) {
      this.logger.error('Failed to deploy model', error);
      throw new AWSError('Failed to deploy model');
    }
  }

  async scaleModel(modelId: string, instances: number): Promise<void> {
    if (!this.initialized) {
      throw new AWSError('AWS engine not initialized');
    }

    try {
      this.logger.info(`Scaling model ${modelId} to ${instances} instances`);
      
      // Ensure SSO token is valid
      if (this.shouldRefreshToken()) {
        await this.refreshSSOToken();
      }

      // Make API call to scale model
      const response = await axios.post(`${this.API_URL}/api/ai/scale`, {
        modelId,
        instances
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        }
      });

      if (response.status !== 200) {
        throw new AWSError('Failed to scale model');
      }
    } catch (error) {
      this.logger.error('Failed to scale model', error);
      throw new AWSError('Failed to scale model');
    }
  }

  async monitorModel(modelId: string): Promise<{
    latency: number;
    throughput: number;
    errorRate: number;
  }> {
    if (!this.initialized) {
      throw new AWSError('AWS engine not initialized');
    }

    try {
      this.logger.info(`Monitoring model ${modelId}`);
      
      // Ensure SSO token is valid
      if (this.shouldRefreshToken()) {
        await this.refreshSSOToken();
      }

      // Make API call to get model metrics
      const response = await axios.get(`${this.API_URL}/api/ai/metrics/${modelId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY
        }
      });

      if (response.status !== 200) {
        throw new AWSError('Failed to get model metrics');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to monitor model', error);
      throw new AWSError('Failed to monitor model');
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.initialized = false;
      this.lastTokenRefresh = null;
      this.logger.info('AWS engine cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup AWS engine', error);
      throw new AWSError('Failed to cleanup AWS engine');
    }
  }
} 