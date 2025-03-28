"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    core: {
        port: 3000,
        environment: 'development',
        logLevel: 'info',
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100
    },
    model: 'bleu-ai',
    modelPath: './models',
    architecture: {
        type: 'transformer',
        layers: [512, 256, 128],
        attentionHeads: 8,
        hiddenSize: 512,
        maxSequenceLength: 1024
    },
    training: {
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    },
    monitoring: {
        enabled: true,
        interval: 60000, // 1 minute
        metrics: ['accuracy', 'loss', 'latency'],
        notificationChannels: ['email', 'slack']
    }
};
//# sourceMappingURL=config.js.map