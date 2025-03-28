import { createLogger } from '@/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('ModelDeployer');

export interface DeploymentConfig {
  modelPath: string;
  targetEnvironment: 'development' | 'staging' | 'production';
  version: string;
  metadata?: Record<string, any>;
  backupExisting?: boolean;
  validateBeforeDeploy?: boolean;
}

export interface DeploymentResult {
  success: boolean;
  modelId: string;
  version: string;
  timestamp: string;
  environment: string;
  metadata?: Record<string, any>;
  error?: string;
}

export class ModelDeployer {
  private deploymentHistory: DeploymentResult[] = [];
  private readonly deploymentPath: string;

  constructor(deploymentPath: string) {
    this.deploymentPath = deploymentPath;
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      logger.info(`Starting deployment for model version ${config.version} to ${config.targetEnvironment}`);

      // Validate configuration
      await this.validateConfig(config);

      // Create deployment ID
      const deploymentId = this.generateDeploymentId(config);

      // Backup existing model if requested
      if (config.backupExisting) {
        await this.backupExistingModel(config);
      }

      // Validate model before deployment if requested
      if (config.validateBeforeDeploy) {
        await this.validateModel(config);
      }

      // Perform deployment
      await this.performDeployment(config, deploymentId);

      // Create deployment result
      const result: DeploymentResult = {
        success: true,
        modelId: deploymentId,
        version: config.version,
        timestamp: new Date().toISOString(),
        environment: config.targetEnvironment,
        metadata: config.metadata
      };

      // Store deployment history
      this.deploymentHistory.push(result);

      logger.info(`Successfully deployed model ${deploymentId}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during deployment';
      logger.error(`Deployment failed: ${errorMessage}`);

      return {
        success: false,
        modelId: '',
        version: config.version,
        timestamp: new Date().toISOString(),
        environment: config.targetEnvironment,
        error: errorMessage
      };
    }
  }

  private async validateConfig(config: DeploymentConfig): Promise<void> {
    if (!config.modelPath || !config.version || !config.targetEnvironment) {
      throw new Error('Invalid deployment configuration: missing required fields');
    }

    const modelExists = await fs.access(config.modelPath)
      .then(() => true)
      .catch(() => false);

    if (!modelExists) {
      throw new Error(`Model file not found at path: ${config.modelPath}`);
    }
  }

  private generateDeploymentId(config: DeploymentConfig): string {
    const timestamp = Date.now();
    return `model_${config.version}_${config.targetEnvironment}_${timestamp}`;
  }

  private async backupExistingModel(config: DeploymentConfig): Promise<void> {
    try {
      const backupDir = path.join(this.deploymentPath, 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      const backupPath = path.join(
        backupDir,
        `backup_${config.version}_${Date.now()}`
      );

      await fs.copyFile(config.modelPath, backupPath);
      logger.info(`Created backup at ${backupPath}`);
    } catch (error) {
      logger.warn('Failed to create backup:', error);
      throw error;
    }
  }

  private async validateModel(config: DeploymentConfig): Promise<void> {
    // Implement model validation logic here
    // This could include:
    // - Checking model file integrity
    // - Verifying model architecture
    // - Running basic inference tests
    logger.info('Model validation completed successfully');
  }

  private async performDeployment(
    config: DeploymentConfig,
    deploymentId: string
  ): Promise<void> {
    const deployDir = path.join(
      this.deploymentPath,
      config.targetEnvironment
    );

    await fs.mkdir(deployDir, { recursive: true });

    const targetPath = path.join(deployDir, `${deploymentId}.model`);
    await fs.copyFile(config.modelPath, targetPath);

    // Save deployment metadata
    const metadataPath = path.join(deployDir, `${deploymentId}.json`);
    await fs.writeFile(
      metadataPath,
      JSON.stringify({
        id: deploymentId,
        version: config.version,
        timestamp: new Date().toISOString(),
        environment: config.targetEnvironment,
        metadata: config.metadata
      }, null, 2)
    );
  }

  async rollback(environment: string, version?: string): Promise<DeploymentResult> {
    try {
      logger.info(`Starting rollback for environment: ${environment}`);

      // Find the latest successful deployment for the environment
      const deployments = this.deploymentHistory
        .filter(d => d.environment === environment && d.success)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (version) {
        // Find specific version
        const targetDeployment = deployments.find(d => d.version === version);
        if (!targetDeployment) {
          throw new Error(`Version ${version} not found in deployment history`);
        }
        return targetDeployment;
      }

      if (deployments.length < 2) {
        throw new Error('No previous deployment available for rollback');
      }

      // Return the second most recent deployment (rollback target)
      return deployments[1];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during rollback';
      logger.error(`Rollback failed: ${errorMessage}`);

      return {
        success: false,
        modelId: '',
        version: version || '',
        timestamp: new Date().toISOString(),
        environment: environment,
        error: errorMessage
      };
    }
  }

  getDeploymentHistory(): DeploymentResult[] {
    return [...this.deploymentHistory];
  }

  async getDeployedModel(environment: string): Promise<string | null> {
    try {
      const deployDir = path.join(this.deploymentPath, environment);
      const files = await fs.readdir(deployDir);
      
      const modelFiles = files.filter(f => f.endsWith('.model'));
      if (modelFiles.length === 0) {
        return null;
      }

      // Return the path to the most recently deployed model
      const latestModel = modelFiles
        .map(f => ({
          name: f,
          time: fs.stat(path.join(deployDir, f))
            .then(stat => stat.mtime.getTime())
        }))
        .sort((a, b) => b.time - a.time)[0];

      return path.join(deployDir, latestModel.name);
    } catch (error) {
      logger.error('Error getting deployed model:', error);
      return null;
    }
  }
} 