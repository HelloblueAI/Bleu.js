import { LogLevel } from '../utils/logger';
export interface CoreConfig {
    port: number;
    environment: 'development' | 'production' | 'test';
    logLevel: LogLevel;
    rateLimitWindow: number;
    rateLimitMax: number;
}
export interface ModelConfig {
    type: string;
    layers: number[];
    attentionHeads?: number;
    hiddenSize?: number;
    maxSequenceLength?: number;
}
export interface TrainingConfig {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer?: string;
    loss?: string;
    metrics?: string[];
}
export interface MonitoringConfig {
    enabled: boolean;
    interval: number;
    metrics: string[];
    notificationChannels: ('email' | 'slack' | 'webhook')[];
}
export interface BleuConfig {
    core: CoreConfig;
    model: string;
    modelPath: string;
    architecture: ModelConfig;
    training: TrainingConfig;
    monitoring: MonitoringConfig;
}
export declare const DEFAULT_CONFIG: BleuConfig;
//# sourceMappingURL=config.d.ts.map