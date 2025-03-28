import { BleuConfig } from '../types';

export abstract class BleuCore {
  protected config: BleuConfig;

  constructor(config: BleuConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract process(input: string | object): Promise<any>;
  abstract generateCode(prompt: string, options?: any): Promise<string>;
  abstract analyzeCode(code: string, options?: any): Promise<any>;
} 