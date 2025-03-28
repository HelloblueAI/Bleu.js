import { Express } from 'express';
import { DeepLearningModel } from '../ai/deepLearning';

export interface DeploymentConfig {
  port: number;
  host: string;
  modelPath: string;
  enableCors: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  app?: Express;
  model?: DeepLearningModel;
} 