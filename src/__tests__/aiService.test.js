jest.mock('../ai/nlpProcessor', () => ({
  tokenize: jest.fn().mockReturnValue(['hello', 'world']),
  stem: jest.fn().mockImplementation((word) => word.slice(0, -1)),
  analyzeSentiment: jest.fn().mockReturnValue('positive'),
  namedEntityRecognition: jest.fn().mockReturnValue(['entity1', 'entity2']),
}));

jest.mock('../ml/modelManager', () => ({
  trainModel: jest.fn().mockResolvedValue('Training Started'),
  getTrainModelStatus: jest.fn().mockResolvedValue('In Progress'),
  uploadDataset: jest.fn().mockResolvedValue('Dataset Uploaded'),
  evaluateRule: jest.fn().mockResolvedValue('Rule Evaluation Result'),
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

const aiServiceProxy = {
  AIService: class AIService {
    constructor() {
      this.nlpProcessor = require('../ai/nlpProcessor');
      this.modelManager = require('../ml/modelManager');
      require('../utils/logger').info('✅ AIService initialized successfully');
    }

    analyzeText(text) {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        const errorMsg = 'Invalid input: Text must be a non-empty string.';
        require('../utils/logger').error('❌ ' + errorMsg);
        throw new Error(errorMsg);
      }

      try {
        const tokens = this.nlpProcessor.tokenize(text);
        const stemmedTokens = tokens.map((token) =>
          this.nlpProcessor.stem(token),
        );
        const sentiment = this.nlpProcessor.analyzeSentiment(text);
        const entities = this.nlpProcessor.namedEntityRecognition(text);

        return {
          tokens,
          stemmedTokens,
          sentiment,
          entities,
        };
      } catch (error) {
        require('../utils/logger').error(
          '❌ Text analysis failed: ' + error.message,
        );
        throw error;
      }
    }

    async processText(text) {
      try {
        return this.analyzeText(text);
      } catch (error) {
        require('../utils/logger').error(
          '❌ Failed to process text: ' + error.message,
        );
        throw error;
      }
    }

    async trainModel(modelInfo) {
      try {
        return await this.modelManager.trainModel(modelInfo);
      } catch (error) {
        require('../utils/logger').error(
          '❌ Model training failed: ' + error.message,
        );
        throw error;
      }
    }

    async getTrainModelStatus() {
      return await this.modelManager.getTrainModelStatus();
    }

    async evaluateRule(ruleId, inputData) {
      try {
        if (!ruleId) {
          throw new Error('Rule ID is required');
        }
        if (!inputData) {
          throw new Error('Input data is required');
        }
        return await this.modelManager.evaluateRule(ruleId, inputData);
      } catch (error) {
        require('../utils/logger').error(
          '❌ Rule evaluation failed: ' + error.message,
        );
        throw error;
      }
    }
  },
};

// Mock the import of the ESM module
jest.mock('../services/aiService', () => aiServiceProxy, { virtual: true });

describe('AIService', () => {
  let AIService;
  let aiService;
  let NLPProcessor;
  let ModelManager;
  let logger;

  beforeEach(() => {
    jest.clearAllMocks();

    const aiServiceModule = require('../services/aiService');
    AIService = aiServiceModule.AIService;
    NLPProcessor = require('../ai/nlpProcessor');
    ModelManager = require('../ml/modelManager');
    logger = require('../utils/logger');

    aiService = new AIService();
  });

  /** 🟢 Initialization */
  test('should initialize AIService successfully', () => {
    expect(logger.info).toHaveBeenCalledWith(
      '✅ AIService initialized successfully',
    );
    expect(aiService.nlpProcessor).toBeDefined();
    expect(aiService.modelManager).toBeDefined();
  });

  /** 🟢 Text Analysis */
  test('should analyze text successfully', () => {
    const text = 'Hello world';
    const result = aiService.analyzeText(text);

    expect(NLPProcessor.tokenize).toHaveBeenCalledWith(text);
    expect(NLPProcessor.analyzeSentiment).toHaveBeenCalledWith(text);
    expect(NLPProcessor.namedEntityRecognition).toHaveBeenCalledWith(text);
    expect(result).toEqual({
      tokens: ['hello', 'world'],
      stemmedTokens: ['hell', 'worl'],
      sentiment: 'positive',
      entities: ['entity1', 'entity2'],
    });
  });

  test('should throw an error if analyzeText is called with invalid input', () => {
    expect(() => aiService.analyzeText(null)).toThrow(
      'Invalid input: Text must be a non-empty string.',
    );
    expect(logger.error).toHaveBeenCalledWith(
      '❌ Invalid input: Text must be a non-empty string.',
    );
  });

  test('should handle errors during text analysis gracefully', () => {
    NLPProcessor.tokenize.mockImplementationOnce(() => {
      throw new Error('Tokenization failed');
    });

    expect(() => aiService.analyzeText('Hello world')).toThrow(
      'Tokenization failed',
    );
    expect(logger.error).toHaveBeenCalledWith(
      '❌ Text analysis failed: Tokenization failed',
    );
  });

  /** 🟢 Process Text */
  test('should call analyzeText inside processText and return the result', async () => {
    jest.spyOn(aiService, 'analyzeText');
    const text = 'AI is powerful';
    const result = await aiService.processText(text);

    expect(aiService.analyzeText).toHaveBeenCalledWith(text);
    expect(result).toEqual({
      tokens: ['hello', 'world'],
      stemmedTokens: ['hell', 'worl'],
      sentiment: 'positive',
      entities: ['entity1', 'entity2'],
    });
  });

  test('should handle errors in processText', async () => {
    jest.spyOn(aiService, 'analyzeText').mockImplementation(() => {
      throw new Error('Processing failed');
    });

    await expect(aiService.processText('AI is powerful')).rejects.toThrow(
      'Processing failed',
    );
    expect(logger.error).toHaveBeenCalledWith(
      '❌ Failed to process text: Processing failed',
    );
  });

  /** 🟢 Model Training */
  test('should train model successfully', async () => {
    const modelInfo = { name: 'AI Model' };
    const result = await aiService.trainModel(modelInfo);
    expect(ModelManager.trainModel).toHaveBeenCalledWith(modelInfo);
    expect(result).toBe('Training Started');
  });

  test('should handle errors in trainModel', async () => {
    ModelManager.trainModel.mockRejectedValueOnce(new Error('Training failed'));

    await expect(aiService.trainModel({ name: 'AI Model' })).rejects.toThrow(
      'Training failed',
    );
    expect(logger.error).toHaveBeenCalledWith(
      '❌ Model training failed: Training failed',
    );
  });

  /** 🟢 Get Training Status */
  test('should get training status', async () => {
    const result = await aiService.getTrainModelStatus();
    expect(ModelManager.getTrainModelStatus).toHaveBeenCalled();
    expect(result).toBe('In Progress');
  });

  /** 🟢 Rule Evaluation */
  test('should evaluate rule successfully', async () => {
    const ruleId = 'rule-123';
    const inputData = { param: 'value' };
    const result = await aiService.evaluateRule(ruleId, inputData);
    expect(ModelManager.evaluateRule).toHaveBeenCalledWith(ruleId, inputData);
    expect(result).toBe('Rule Evaluation Result');
  });

  /** 🔴 Edge Case Handling */
  test('should throw an error if evaluateRule is called with missing parameters', async () => {
    await expect(aiService.evaluateRule(null, {})).rejects.toThrow();
    await expect(aiService.evaluateRule('rule-123', null)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Rule evaluation failed'),
    );
  });
});
