import { jest } from '@jest/globals';
import { NLPProcessor } from '../processor';
import { Logger } from '../../../utils/logger';
import { ProcessingError } from '../../../utils/errors';

jest.mock('../../../utils/logger');
jest.mock('natural');

describe('NLPProcessor', () => {
  let nlpProcessor: NLPProcessor;
  let logger: Logger;

  beforeEach(async () => {
    logger = new Logger('NLPProcessorTest');
    nlpProcessor = new NLPProcessor(logger);
    await nlpProcessor.initialize();
  });

  afterEach(async () => {
    await nlpProcessor.cleanup();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const processor = new NLPProcessor(logger);
      await processor.initialize();

      // Verify initialization by checking if we can process text
      const result = await processor.processText('Test text');
      expect(result).toBeDefined();
      expect(result.text).toBe('Test text');
    });

    it('should handle initialization errors', async () => {
      const processor = new NLPProcessor(logger);
      // Force an initialization error by providing invalid config
      await expect(processor.initialize({ language: 'invalid', maxTokens: -1, model: 'invalid' }))
        .rejects.toThrow('Failed to initialize NLP Processor');
    });
  });

  describe('text processing', () => {
    it('should process text correctly', async () => {
      const text = 'Hello world! How are you?';
      const result = await nlpProcessor.processText(text);
      
      expect(result.text).toBe(text);
      expect(result.tokens).toBeDefined();
      expect(result.embeddings).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.entities).toBeDefined();
    });

    it('should analyze text', async () => {
      const text = 'Hello world! How are you?';
      const result = await nlpProcessor.analyzeText(text);
      
      expect(result.sentiment).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.keywords).toBeDefined();
    });

    it('should summarize text', async () => {
      const text = 'This is a long text. It has multiple sentences. We want to summarize it.';
      const summary = await nlpProcessor.summarizeText(text);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeLessThan(text.length);
    });

    it('should throw error when processing without initialization', async () => {
      const processor = new NLPProcessor(logger);
      await expect(processor.processText('test')).rejects.toThrow('NLP processor not initialized');
    });
  });

  describe('training', () => {
    it('should train models successfully', async () => {
      const texts = ['This is positive', 'This is negative'];
      const labels = {
        sentiment: [1, -1],
        entities: [[{ type: 'test', start: 0, end: 4 }], [{ type: 'test', start: 0, end: 4 }]]
      };

      await nlpProcessor.train(texts, labels);
      
      // Verify training by checking if we can process text with the trained model
      const result = await nlpProcessor.processText('Test text');
      expect(result).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await nlpProcessor.cleanup();
      
      // Verify cleanup by checking if we can't process text anymore
      await expect(nlpProcessor.processText('test')).rejects.toThrow('NLP processor not initialized');
    });

    it('should handle cleanup errors', async () => {
      // Force a cleanup error by providing invalid state
      nlpProcessor['initialized'] = false;
      await expect(nlpProcessor.cleanup()).rejects.toThrow('Failed to cleanup NLP Processor');
    });
  });
}); 