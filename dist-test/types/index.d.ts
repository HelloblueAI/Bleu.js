import { LayerConfig } from '@tensorflow/tfjs';
import { HfInference } from '@huggingface/inference';
import { LayersModel } from '@tensorflow/tfjs';
export interface BleuConfig {
    core: CoreConfig;
    model: ModelConfig;
    training: TrainingConfig;
    security: SecurityConfig;
    performance: PerformanceConfig;
    monitoring: MonitoringConfig;
    deployment: DeploymentConfig;
}
export interface CoreConfig {
    huggingfaceToken: string;
    maxTokens: number;
    temperature: number;
}
export interface ModelConfig {
    inputShape: number[];
    layers: LayerConfig[];
    outputShape: number[];
}
export interface TrainingConfig {
    learningRate: number;
    batchSize: number;
    epochs: number;
    loss: string;
    metrics: string[];
}
export interface SecurityConfig {
    encryptionLevel: 'standard' | 'military' | 'quantum-resistant';
    enableFirewall: boolean;
    enableAudit: boolean;
    maxRetries: number;
}
export interface PerformanceConfig {
    enableGPU: boolean;
    enableTPU: boolean;
    enableDistributedTraining: boolean;
    maxConcurrentRequests: number;
    cacheSize: number;
}
export interface MonitoringConfig {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsPort: number;
    notificationChannels: ('email' | 'slack' | 'webhook')[];
}
export interface DeploymentConfig {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
    healthCheckPath: string;
    metricsPath: string;
}
export interface OptimizationResult {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    executionTime: number;
    memoryUsage: number;
}
export interface ModelMetrics {
    accuracy: number;
    loss: number;
    latency: number;
    throughput: number;
    memoryUsage: number;
}
export interface SecurityReport {
    vulnerabilities: Vulnerability[];
    dependencies: DependencyStatus[];
    compliance: ComplianceStatus;
    systemStatus: SystemStatus;
    recommendations: string[];
}
export interface Vulnerability {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    fix?: string;
    cwe?: string;
    cvss?: number;
    references?: string[];
}
export interface DependencyStatus {
    name: string;
    version: string;
    latestVersion: string;
    vulnerabilities: Vulnerability[];
    outdated: boolean;
}
export interface ComplianceStatus {
    owasp: boolean;
    pci: boolean;
    gdpr: boolean;
    issues: string[];
}
export interface SystemStatus {
    firewall: boolean;
    encryption: boolean;
    authentication: boolean;
    logging: boolean;
}
export interface AIServices {
    hf: HfInference;
    model: LayersModel;
}
//# sourceMappingURL=index.d.ts.map