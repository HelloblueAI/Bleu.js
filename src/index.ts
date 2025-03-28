import { BleuCore } from './core/BleuCore';
import { ServiceManager } from './core/ServiceManager';
import { DEFAULT_CONFIG } from './config/defaultConfig';
import { BleuConfig, ModelConfig, SecurityConfig, MonitoringConfig, DeploymentConfig, PerformanceConfig } from './types';

// Core exports
export { BleuCore } from './core/BleuCore';
export { ServiceManager } from './core/ServiceManager';
export { DEFAULT_CONFIG } from './config/defaultConfig';

// Configuration types
export type {
  BleuConfig,
  ModelConfig,
  SecurityConfig,
  MonitoringConfig,
  DeploymentConfig,
  PerformanceConfig
} from './types';

// Version
export const VERSION = '1.1.2';

// Main class
export class Bleu extends BleuCore {
  private serviceManager: ServiceManager;

  constructor(config: Partial<BleuConfig> = {}) {
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...config
    };
    super(mergedConfig);
    this.serviceManager = new ServiceManager(mergedConfig);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize service manager
      await this.serviceManager.initialize();
      
      // Initialize monitoring
      if (this.config.monitoring.metrics.enabled) {
        await this.initializeMonitoring();
      }

      // Initialize security
      await this.initializeSecurity();

      // Initialize performance optimizations
      if (this.config.performance.enableGPU || this.config.performance.enableTPU) {
        await this.initializeHardware();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  private async initializeMonitoring(): Promise<void> {
    // Placeholder for monitoring initialization
  }

  private async initializeSecurity(): Promise<void> {
    // Placeholder for security initialization
  }

  private async initializeHardware(): Promise<void> {
    // Placeholder for hardware initialization
  }

  async process(input: string | object): Promise<any> {
    try {
      if (typeof input === 'string') {
        return await this.processText(input);
      } else if (typeof input === 'object') {
        return await this.processObject(input);
      }
      throw new Error('Invalid input type');
    } catch (error) {
      console.error('Error processing input:', error);
      throw error;
    }
  }

  private async processText(text: string): Promise<any> {
    // Placeholder for text processing
    return {
      text,
      processed: true,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'text',
        length: text.length,
        language: 'en' // placeholder
      }
    };
  }

  private async processObject(obj: object): Promise<any> {
    // Placeholder for object processing
    return {
      data: obj,
      processed: true,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'object',
        keys: Object.keys(obj)
      }
    };
  }

  async generateCode(prompt: string, options: any = {}): Promise<string> {
    try {
      // Placeholder for code generation
      const timestamp = new Date().toISOString();
      return [
        `// Generated code for: ${prompt}`,
        `// Generated at: ${timestamp}`,
        `// Options: ${JSON.stringify(options)}`,
        '',
        '// TODO: Implement actual code generation',
        'function placeholder() {',
        '  console.log("Code generation not yet implemented");',
        '}'
      ].join('\n');
    } catch (error) {
      console.error('Code generation error:', error);
      throw error;
    }
  }

  async analyzeCode(code: string, options: any = {}): Promise<any> {
    try {
      // Placeholder for code analysis
      return {
        timestamp: new Date().toISOString(),
        complexity: {
          cyclomatic: 0,
          cognitive: 0,
          halstead: 0
        },
        maintainability: {
          score: 0,
          rating: 'A',
          issues: []
        },
        security: {
          vulnerabilities: [],
          dependencies: [],
          score: 100
        },
        quality: {
          issues: [],
          suggestions: [],
          score: 100
        },
        metadata: {
          lines: code.split('\n').length,
          characters: code.length,
          language: options.language || 'unknown'
        }
      };
    } catch (error) {
      console.error('Code analysis error:', error);
      throw error;
    }
  }

  // Service management methods
  async addService(name: string, service: any): Promise<void> {
    await this.serviceManager.addService(name, service);
  }

  getService(name: string): any {
    return this.serviceManager.getService(name);
  }

  hasService(name: string): boolean {
    return this.serviceManager.hasService(name);
  }

  async dispose(): Promise<void> {
    await this.serviceManager.dispose();
  }
}

// Factory function
export async function createBleuApp(config: Partial<BleuConfig> = {}): Promise<Bleu> {
  const app = new Bleu(config);
  await app.initialize();
  return app;
} 