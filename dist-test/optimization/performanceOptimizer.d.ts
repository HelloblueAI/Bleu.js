import * as tf from '@tensorflow/tfjs-node-gpu';
import { BleuConfig } from '../types/config';
import { QuantumCircuit } from '../quantum/circuit';
interface OptimizationMetrics {
    throughput: number;
    latency: number;
    memoryUsage: number;
    gpuUtilization?: number;
    tpuUtilization?: number;
    quantumAcceleration?: number;
    distributedNodes?: number;
}
interface OptimizationResult {
    metrics: OptimizationMetrics;
    recommendations: string[];
    optimizedModel?: tf.LayersModel;
    quantumCircuits?: QuantumCircuit[];
}
export declare class PerformanceOptimizer {
    private config;
    private gpuManager;
    private tpuManager;
    private quantumCircuit;
    private distributedTrainer;
    private hf;
    constructor(config: BleuConfig);
    initialize(): Promise<void>;
    optimizeModel(model: tf.LayersModel): Promise<tf.LayersModel>;
    private applyQuantumOptimization;
    analyze(code: string): Promise<OptimizationResult>;
    private gatherMetrics;
    private measureThroughput;
    private measureLatency;
    private generateRecommendations;
    private parseOptimizationSuggestions;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=performanceOptimizer.d.ts.map