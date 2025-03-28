import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../utils/logger';

export interface TensorFlowConfig {
  memoryLimit?: number;
  numThreads?: number;
  enableGPU?: boolean;
  gpuMemoryLimit?: number;
  enableWebGL?: boolean;
  webGLMemoryLimit?: number;
}

export class TensorFlowError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TensorFlowError';
  }
}

export class TensorFlowManager {
  private static instance: TensorFlowManager;
  private logger = createLogger('TensorFlowManager');
  private initialized = false;
  private config: Required<TensorFlowConfig>;

  private constructor(config: TensorFlowConfig = {}) {
    this.config = {
      memoryLimit: config.memoryLimit || 1024 * 1024 * 1024, // 1GB default
      numThreads: config.numThreads || 4,
      enableGPU: config.enableGPU || false,
      gpuMemoryLimit: config.gpuMemoryLimit || 1024 * 1024 * 512, // 512MB default
      enableWebGL: config.enableWebGL || false,
      webGLMemoryLimit: config.webGLMemoryLimit || 1024 * 1024 * 256 // 256MB default
    };
  }

  public static getInstance(config?: TensorFlowConfig): TensorFlowManager {
    if (!TensorFlowManager.instance) {
      TensorFlowManager.instance = new TensorFlowManager(config);
    }
    return TensorFlowManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      throw new TensorFlowError('TensorFlow already initialized', 'ALREADY_INITIALIZED');
    }

    try {
      // Configure memory limits
      await tf.setBackend('tensorflow');
      await tf.engine().startScope();
      
      // Set memory limits
      tf.engine().setMemoryLimit(this.config.memoryLimit);
      
      // Configure threading
      if (this.config.numThreads > 0) {
        await tf.setNumThreads(this.config.numThreads);
      }

      // Configure GPU if enabled
      if (this.config.enableGPU) {
        const gpuDevices = await tf.getBackend().getGpuDevices();
        if (gpuDevices.length > 0) {
          await tf.setBackend('tensorflow');
          await tf.engine().setGpuMemoryLimit(this.config.gpuMemoryLimit);
        } else {
          this.logger.warn('GPU requested but no GPU devices found');
        }
      }

      // Configure WebGL if enabled
      if (this.config.enableWebGL) {
        await tf.setBackend('webgl');
        await tf.engine().setWebGLMemoryLimit(this.config.webGLMemoryLimit);
      }

      this.initialized = true;
      this.logger.info('TensorFlow initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TensorFlow:', error);
      throw new TensorFlowError('Failed to initialize TensorFlow', 'INIT_ERROR');
    }
  }

  public async dispose(): Promise<void> {
    if (!this.initialized) {
      throw new TensorFlowError('TensorFlow not initialized', 'NOT_INITIALIZED');
    }

    try {
      await tf.engine().endScope();
      await tf.disposeVariables();
      this.initialized = false;
      this.logger.info('TensorFlow disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose TensorFlow:', error);
      throw new TensorFlowError('Failed to dispose TensorFlow', 'DISPOSE_ERROR');
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getConfig(): Readonly<TensorFlowConfig> {
    return { ...this.config };
  }

  public async getMemoryUsage(): Promise<{
    total: number;
    used: number;
    free: number;
  }> {
    if (!this.initialized) {
      throw new TensorFlowError('TensorFlow not initialized', 'NOT_INITIALIZED');
    }

    try {
      const memoryInfo = await tf.engine().memory();
      return {
        total: memoryInfo.numBytes,
        used: memoryInfo.numBytes - memoryInfo.numFreeBytes,
        free: memoryInfo.numFreeBytes
      };
    } catch (error) {
      this.logger.error('Failed to get memory usage:', error);
      throw new TensorFlowError('Failed to get memory usage', 'MEMORY_ERROR');
    }
  }

  public async getBackendInfo(): Promise<{
    backend: string;
    devices: string[];
    gpuAvailable: boolean;
  }> {
    if (!this.initialized) {
      throw new TensorFlowError('TensorFlow not initialized', 'NOT_INITIALIZED');
    }

    try {
      const backend = tf.getBackend();
      const devices = await tf.engine().getDevices();
      const gpuDevices = await tf.getBackend().getGpuDevices();

      return {
        backend,
        devices: devices.map(d => d.deviceId),
        gpuAvailable: gpuDevices.length > 0
      };
    } catch (error) {
      this.logger.error('Failed to get backend info:', error);
      throw new TensorFlowError('Failed to get backend info', 'BACKEND_ERROR');
    }
  }
} 