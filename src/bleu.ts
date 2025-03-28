import { BleuAI } from './ai/models/bleuAI';
import { ModelMonitor } from './monitoring/modelMonitor';
import { ModelDeployer } from './deployment/modelDeployer';
import { SecurityAnalyzer } from './security/securityAnalyzer';
import { PerformanceOptimizer } from './optimization/performanceOptimizer';
import { ClusterManager } from './cluster/clusterManager';
import { createLogger } from './utils/logger';

interface BleuConfig {
  modelPath?: string;
  architecture?: {
    type?: string;
    layers?: number;
    attentionHeads?: number;
    hiddenSize?: number;
    vocabularySize?: number;
    maxSequenceLength?: number;
    useQuantumComputing?: boolean;
    enableMultiModal?: boolean;
    enableReinforcementLearning?: boolean;
  };
  cluster?: {
    enabled?: boolean;
    nodes?: number;
    autoScale?: boolean;
  };
  security?: {
    encryptionLevel?: 'standard' | 'military' | 'quantum';
    enableAuditLogging?: boolean;
    enableThreatDetection?: boolean;
  };
  performance?: {
    enableGPU?: boolean;
    enableTPU?: boolean;
    enableDistributedTraining?: boolean;
    enableAutoOptimization?: boolean;
  };
}

interface ProcessOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  useQuantumComputing?: boolean;
  enableMultiModal?: boolean;
  enableReinforcementLearning?: boolean;
  securityLevel?: 'standard' | 'military' | 'quantum';
}

interface AnalysisResult {
  codeQuality: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  recommendations: string[];
  quantumOptimizations?: string[];
  threatAnalysis?: {
    vulnerabilities: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationStrategies: string[];
  };
}

export class Bleu {
  private config: Required<BleuConfig>;
  private model: BleuAI | null = null;
  private monitor: ModelMonitor;
  private deployer: ModelDeployer;
  private securityAnalyzer: SecurityAnalyzer;
  private performanceOptimizer: PerformanceOptimizer;
  private clusterManager: ClusterManager;
  private logger = createLogger('Bleu');

  constructor(config: BleuConfig = {}) {
    this.config = {
      modelPath: config.modelPath || './models',
      architecture: {
        type: config.architecture?.type || 'transformer',
        layers: config.architecture?.layers || 12,
        attentionHeads: config.architecture?.attentionHeads || 8,
        hiddenSize: config.architecture?.hiddenSize || 768,
        vocabularySize: config.architecture?.vocabularySize || 50000,
        maxSequenceLength: config.architecture?.maxSequenceLength || 2048,
        useQuantumComputing: config.architecture?.useQuantumComputing || false,
        enableMultiModal: config.architecture?.enableMultiModal || false,
        enableReinforcementLearning: config.architecture?.enableReinforcementLearning || false
      },
      cluster: {
        enabled: config.cluster?.enabled || false,
        nodes: config.cluster?.nodes || 1,
        autoScale: config.cluster?.autoScale || false
      },
      security: {
        encryptionLevel: config.security?.encryptionLevel || 'standard',
        enableAuditLogging: config.security?.enableAuditLogging || true,
        enableThreatDetection: config.security?.enableThreatDetection || true
      },
      performance: {
        enableGPU: config.performance?.enableGPU || true,
        enableTPU: config.performance?.enableTPU || false,
        enableDistributedTraining: config.performance?.enableDistributedTraining || false,
        enableAutoOptimization: config.performance?.enableAutoOptimization || true
      }
    };

    this.monitor = new ModelMonitor();
    this.deployer = new ModelDeployer();
    this.securityAnalyzer = new SecurityAnalyzer();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.clusterManager = new ClusterManager();
  }

  async initialize(): Promise<this> {
    this.logger.info('Initializing Bleu AI with advanced capabilities...');
    
    if (!this.model) {
      this.model = new BleuAI(this.config);
      await this.model.initialize();
    }

    if (this.config.cluster.enabled) {
      await this.clusterManager.initialize(this.config.cluster);
    }

    await this.monitor.initialize();
    await this.deployer.initialize();
    await this.securityAnalyzer.initialize();
    await this.performanceOptimizer.initialize();

    this.logger.info('Bleu AI initialized successfully with all advanced features enabled');
    return this;
  }

  async process(input: string, options: ProcessOptions = {}): Promise<string> {
    if (!this.model) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.logger.info('Processing input with advanced AI capabilities...');

    const result = await this.model!.generate({
      prompt: input,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      useQuantumComputing: options.useQuantumComputing,
      enableMultiModal: options.enableMultiModal,
      enableReinforcementLearning: options.enableReinforcementLearning
    });

    const processingTime = Date.now() - startTime;
    this.logger.info(`Processing completed in ${processingTime}ms`);

    return result;
  }

  async analyzeCode(code: string): Promise<AnalysisResult> {
    if (!this.model) {
      await this.initialize();
    }

    this.logger.info('Starting comprehensive code analysis...');

    const [modelAnalysis, securityAnalysis, performanceAnalysis] = await Promise.all([
      this.model!.analyzeCode(code),
      this.securityAnalyzer.analyze(code),
      this.performanceOptimizer.analyze(code)
    ]);

    const result: AnalysisResult = {
      codeQuality: modelAnalysis.quality,
      securityScore: securityAnalysis.score,
      performanceScore: performanceAnalysis.score,
      maintainabilityScore: modelAnalysis.maintainability,
      recommendations: [
        ...modelAnalysis.recommendations,
        ...securityAnalysis.recommendations,
        ...performanceAnalysis.recommendations
      ],
      quantumOptimizations: this.config.architecture.useQuantumComputing 
        ? await this.model!.getQuantumOptimizations(code)
        : undefined,
      threatAnalysis: this.config.security.enableThreatDetection
        ? await this.securityAnalyzer.getThreatAnalysis(code)
        : undefined
    };

    this.logger.info('Code analysis completed successfully');
    return result;
  }

  async optimizePerformance(): Promise<void> {
    if (!this.model) {
      await this.initialize();
    }

    this.logger.info('Starting performance optimization...');
    await this.performanceOptimizer.optimize(this.model);
    this.logger.info('Performance optimization completed');
  }

  async deployModel(): Promise<void> {
    if (!this.model) {
      await this.initialize();
    }

    this.logger.info('Starting model deployment...');
    await this.deployer.deploy(this.model);
    this.logger.info('Model deployed successfully');
  }

  async monitorHealth(): Promise<any> {
    return await this.monitor.getHealthMetrics();
  }

  dispose(): void {
    this.logger.info('Disposing of Bleu AI resources...');
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.monitor.dispose();
    this.deployer.dispose();
    this.securityAnalyzer.dispose();
    this.performanceOptimizer.dispose();
    this.clusterManager.dispose();
    this.logger.info('All resources disposed successfully');
  }
} 