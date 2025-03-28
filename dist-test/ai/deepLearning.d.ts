import * as tf from '@tensorflow/tfjs';
export interface DeepLearningConfig {
    modelPath?: string;
    inputShape?: number[];
    outputShape?: number[];
    layers?: Array<{
        units: number;
        activation: string;
    }>;
    batchSize?: number;
    epochs?: number;
    learningRate?: number;
    validationSplit?: number;
    earlyStopping?: boolean;
    modelCheckpoint?: boolean;
    dropout?: number;
    regularization?: number;
    architecture?: {
        type: 'sequential' | 'functional';
        layers: number[];
        activation: string;
        inputShape: number[];
    };
    training?: {
        optimizer: 'adam' | 'sgd' | 'rmsprop';
        loss: string;
        metrics: string[];
        epochs: number;
        batchSize: number;
        validationSplit: number;
    };
}
export declare class DeepLearningModel {
    private model;
    private config;
    private logger;
    private isCompiled;
    private isTrained;
    constructor(config?: DeepLearningConfig);
    getConfig(): DeepLearningConfig;
    isModelCompiled(): boolean;
    isModelTrained(): boolean;
    getModel(): tf.LayersModel | null;
    initialize(): Promise<void>;
    private createModel;
    compile(): Promise<void>;
    train(x: tf.Tensor | tf.Tensor[], y: tf.Tensor | tf.Tensor[], validationData?: [tf.Tensor, tf.Tensor]): Promise<tf.History>;
    predict(x: tf.Tensor | tf.Tensor[]): Promise<tf.Tensor | tf.Tensor[]>;
    evaluate(x: tf.Tensor | tf.Tensor[], y: tf.Tensor | tf.Tensor[]): Promise<number[]>;
    saveModel(path: string): Promise<void>;
    dispose(): void;
    static load(path: string): Promise<DeepLearningModel>;
}
export default DeepLearningModel;
//# sourceMappingURL=deepLearning.d.ts.map