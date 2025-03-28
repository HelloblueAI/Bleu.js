"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock objects
const mockTensor = {
    dispose: globals_1.jest.fn(),
    dataSync: globals_1.jest.fn().mockReturnValue([]),
    shape: [1, 1],
};
const mockModel = {
    predict: globals_1.jest.fn().mockReturnValue(mockTensor),
    compile: globals_1.jest.fn(),
    fit: globals_1.jest.fn().mockResolvedValue({ history: {} }),
    evaluate: globals_1.jest.fn().mockResolvedValue([0]),
    save: globals_1.jest.fn().mockResolvedValue(undefined),
    dispose: globals_1.jest.fn(),
};
const mockSequential = {
    add: globals_1.jest.fn().mockReturnThis(),
    compile: globals_1.jest.fn(),
    fit: globals_1.jest.fn().mockResolvedValue({ history: {} }),
    predict: globals_1.jest.fn().mockReturnValue(mockTensor),
    evaluate: globals_1.jest.fn().mockResolvedValue([0]),
    save: globals_1.jest.fn().mockResolvedValue(undefined),
    dispose: globals_1.jest.fn(),
};
// Mock TensorFlow.js
globals_1.jest.mock('@tensorflow/tfjs-node', () => {
    const mockTensor = {
        dispose: globals_1.jest.fn(),
        dataSync: globals_1.jest.fn().mockReturnValue([0.8])
    };
    return {
        callbacks: {
            earlyStopping: globals_1.jest.fn().mockImplementation(() => ({
                onEpochEnd: globals_1.jest.fn()
            })),
            modelCheckpoint: globals_1.jest.fn().mockImplementation(() => ({
                onEpochEnd: globals_1.jest.fn()
            }))
        },
        sequential: globals_1.jest.fn().mockImplementation(() => ({
            add: globals_1.jest.fn(),
            compile: globals_1.jest.fn(),
            fit: globals_1.jest.fn().mockResolvedValue({ history: { loss: [0.1], accuracy: [0.9] } }),
            predict: globals_1.jest.fn().mockReturnValue(mockTensor),
            evaluate: globals_1.jest.fn().mockResolvedValue([0.1, 0.9]),
            save: globals_1.jest.fn().mockResolvedValue(undefined),
            loadLayersModel: globals_1.jest.fn().mockResolvedValue({
                predict: globals_1.jest.fn().mockReturnValue(mockTensor)
            })
        })),
        layers: {
            dense: globals_1.jest.fn(),
            embedding: globals_1.jest.fn(),
            lstm: globals_1.jest.fn()
        },
        tensor: globals_1.jest.fn().mockReturnValue(mockTensor),
        tensor2d: globals_1.jest.fn().mockReturnValue(mockTensor)
    };
});
// Mock HuggingFace
globals_1.jest.mock('@huggingface/inference', () => ({
    HfInference: globals_1.jest.fn().mockImplementation(() => ({
        textClassification: globals_1.jest.fn().mockResolvedValue([{ label: 'positive', score: 0.9 }]),
        tokenClassification: globals_1.jest.fn().mockResolvedValue([{ entity: 'PERSON', word: 'John' }]),
    })),
}));
// Environment setup
process.env.NODE_ENV = 'test';
process.env.HUGGINGFACE_API_KEY = 'test-key';
// Console mocks
global.console = {
    ...console,
    log: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
};
// Cleanup
(0, globals_1.afterEach)(() => {
    globals_1.jest.clearAllMocks();
});
// Mock Logger
globals_1.jest.mock('../utils/logger', () => {
    const mockLogger = {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    };
    return {
        logger: mockLogger,
        createLogger: globals_1.jest.fn().mockReturnValue(mockLogger),
        LogLevel: {
            ERROR: 'error',
            WARN: 'warn',
            INFO: 'info',
            DEBUG: 'debug'
        }
    };
});
// Mock classes
class MockNLPProcessor {
    constructor(config) {
        this.config = config;
        this.logger = {
            info: globals_1.jest.fn(),
            error: globals_1.jest.fn(),
            warn: globals_1.jest.fn(),
            debug: globals_1.jest.fn()
        };
    }
    async initialize() { }
    async processText() { return { prediction: 0.5 }; }
    async analyzeText() { return { sentiment: 'positive' }; }
    async train() { return { history: { loss: [0.1], accuracy: [0.9] } }; }
    async evaluate() { return { loss: 0.1, accuracy: 0.9 }; }
    async dispose() { }
}
class MockModelMonitor {
    constructor(config) {
        this.config = config;
        this.isMonitoring = false;
        this.logger = {
            info: globals_1.jest.fn(),
            error: globals_1.jest.fn(),
            warn: globals_1.jest.fn(),
            debug: globals_1.jest.fn()
        };
    }
    async initialize() { }
    async startMonitoring() { this.isMonitoring = true; }
    async stopMonitoring() { this.isMonitoring = false; }
    async collectMetrics() { return { accuracy: 0.9, latency: 100 }; }
}
class MockDeepLearningModel {
    constructor(config) {
        this.config = config;
        this.logger = {
            info: globals_1.jest.fn(),
            error: globals_1.jest.fn(),
            warn: globals_1.jest.fn(),
            debug: globals_1.jest.fn()
        };
    }
    async initialize() { }
    async train() { return { history: { loss: [0.1], accuracy: [0.9] } }; }
    async predict() { return [0.5]; }
    async evaluate() { return { loss: 0.1, accuracy: 0.9 }; }
    async save() { }
    async load() { }
    async dispose() { }
}
class MockModelDeployer {
    constructor(config) {
        this.config = config;
        this.logger = {
            info: globals_1.jest.fn(),
            error: globals_1.jest.fn(),
            warn: globals_1.jest.fn(),
            debug: globals_1.jest.fn()
        };
    }
    async initialize() { }
    async deploy() { }
    async start() { }
    async stop() { }
}
class MockBleuAI {
    constructor(config) {
        this.config = config;
        this.logger = {
            info: globals_1.jest.fn(),
            error: globals_1.jest.fn(),
            warn: globals_1.jest.fn(),
            debug: globals_1.jest.fn()
        };
    }
    async initialize() { }
    async train() { return { history: { loss: [0.1], accuracy: [0.9] } }; }
    async predict() { return [0.5]; }
    async evaluate() { return { loss: 0.1, accuracy: 0.9 }; }
    async dispose() { }
}
// Mock NLPProcessor
globals_1.jest.mock('../ai/nlpProcessor', () => ({
    NLPProcessor: globals_1.jest.fn().mockImplementation(() => ({
        initialize: globals_1.jest.fn().mockResolvedValue(undefined),
        processText: globals_1.jest.fn().mockResolvedValue({ prediction: 0.8 }),
        analyzeText: globals_1.jest.fn().mockResolvedValue({ sentiment: 'positive' }),
        train: globals_1.jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
        evaluate: globals_1.jest.fn().mockResolvedValue([0.1, 0.9]),
        dispose: globals_1.jest.fn()
    }))
}));
// Mock ModelMonitor
globals_1.jest.mock('../monitoring/modelMonitor', () => ({
    ModelMonitor: globals_1.jest.fn().mockImplementation(() => ({
        initialize: globals_1.jest.fn().mockResolvedValue(undefined),
        startMonitoring: globals_1.jest.fn().mockResolvedValue(undefined),
        stopMonitoring: globals_1.jest.fn().mockResolvedValue(undefined),
        collectMetrics: globals_1.jest.fn().mockResolvedValue({
            accuracy: 0.9,
            latency: 100
        })
    }))
}));
// Mock DeepLearningModel
globals_1.jest.mock('../ai/deepLearning', () => ({
    DeepLearningModel: globals_1.jest.fn().mockImplementation(() => ({
        initialize: globals_1.jest.fn().mockResolvedValue(undefined),
        train: globals_1.jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
        predict: globals_1.jest.fn().mockResolvedValue([0.8]),
        evaluate: globals_1.jest.fn().mockResolvedValue([0.1, 0.9]),
        save: globals_1.jest.fn().mockResolvedValue(undefined),
        load: globals_1.jest.fn().mockResolvedValue(undefined),
        dispose: globals_1.jest.fn()
    }))
}));
// Mock ModelDeployer
globals_1.jest.mock('../deployment/modelDeployer', () => ({
    ModelDeployer: globals_1.jest.fn().mockImplementation(() => ({
        initialize: globals_1.jest.fn().mockResolvedValue(undefined),
        deploy: globals_1.jest.fn().mockResolvedValue({ status: 'success' }),
        start: globals_1.jest.fn().mockResolvedValue(undefined),
        stop: globals_1.jest.fn().mockResolvedValue(undefined)
    }))
}));
// Mock BleuAI
globals_1.jest.mock('../ai/models/bleuAI', () => ({
    BleuAI: globals_1.jest.fn().mockImplementation(() => ({
        initialize: globals_1.jest.fn().mockResolvedValue(undefined),
        train: globals_1.jest.fn().mockResolvedValue({ history: { loss: [0.1] } }),
        predict: globals_1.jest.fn().mockResolvedValue([0.8]),
        evaluate: globals_1.jest.fn().mockResolvedValue([0.1, 0.9]),
        dispose: globals_1.jest.fn()
    }))
}));
//# sourceMappingURL=setup.js.map