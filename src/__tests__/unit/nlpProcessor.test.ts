import { NLPProcessor } from '../../ai/nlp/nlpProcessor';
import { createLogger } from '../../utils/logger';

const logger = createLogger('NLPTests');

describe('NLP Processing', () => {
  let processor: NLPProcessor;

  beforeEach(async () => {
    processor = new NLPProcessor(logger);
    await processor.initialize();
  });

  describe('Text Processing', () => {
    test('should tokenize text correctly', async () => {
      const text = 'Hello world! How are you?';
      const tokens = await processor.tokenize(text);
      expect(tokens).toHaveLength(7);
      expect(tokens).toContain('Hello');
      expect(tokens).toContain('world');
    });

    test('should handle multilingual text', async () => {
      const texts = [
        { text: 'Hello world', lang: 'en' },
        { text: 'Bonjour le monde', lang: 'fr' },
        { text: 'Hola mundo', lang: 'es' }
      ];
      
      for (const { text, lang } of texts) {
        const processed = await processor.process(text, lang);
        expect(processed.language).toBe(lang);
        expect(processed.tokens.length).toBeGreaterThan(0);
      }
    });

    test('should normalize text', async () => {
      const text = '  Hello   World!  ';
      const normalized = await processor.normalize(text);
      expect(normalized).toBe('hello   world!');
    });

    test('should remove stop words', async () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const processed = await processor.removeStopWords(text);
      expect(processed).not.toContain('the');
      expect(processed).toContain('quick');
      expect(processed).toContain('brown');
      expect(processed).toContain('fox');
    });
  });

  describe('Text Analysis', () => {
    test('should analyze text complexity', async () => {
      const text = 'The quick brown fox jumps over the lazy dog. It was a beautiful day.';
      const analysis = await processor.analyzeComplexity(text);
      expect(analysis.readabilityScore).toBeDefined();
      expect(analysis.sentenceCount).toBe(2);
      expect(analysis.averageWordLength).toBeGreaterThan(0);
    });

    test('should detect text language', async () => {
      const text = 'Hello world';
      const detected = await processor.detectLanguage(text);
      expect(detected).toBe('en');
    });

    test('should extract keywords', async () => {
      const text = 'Artificial intelligence and machine learning are transforming the technology landscape';
      const keywords = await processor.extractKeywords(text);
      expect(keywords.length).toBeLessThanOrEqual(5);
      expect(keywords).toContain('artificial');
      expect(keywords).toContain('intelligence');
    });
  });

  describe('Sentiment Analysis', () => {
    test('should analyze sentiment', async () => {
      const texts = [
        { text: 'I love this product!', expected: 'positive' },
        { text: 'This is terrible.', expected: 'negative' },
        { text: 'The weather is okay.', expected: 'neutral' }
      ];

      for (const { text, expected } of texts) {
        const result = await processor.analyzeSentiment(text);
        expect(result).toBe(expected);
      }
    });

    test('should detect emotion', async () => {
      const text = 'I am so happy today!';
      const emotions = await processor.detectEmotions(text);
      expect(emotions).toHaveProperty('joy');
      expect(emotions.joy).toBeGreaterThan(0.5);
    });
  });

  describe('Cleanup', () => {
    test('should clean up resources', async () => {
      await processor.cleanup();
      await expect(processor.tokenize('test')).rejects.toThrow('NLP Processor not initialized');
    });
  });
}); 