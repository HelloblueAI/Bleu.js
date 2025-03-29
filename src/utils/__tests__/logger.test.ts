import { jest } from '@jest/globals';
import winston from 'winston';
import { CustomLogger, MockLogger, createLogger } from '../logger';

describe('CustomLogger', () => {
  let customLogger: CustomLogger;
  let mockWinstonLogger: winston.Logger;

  beforeEach(() => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    customLogger = new CustomLogger(mockWinstonLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      customLogger.info(message);
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message);
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');
      customLogger.error(message, error);
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, error);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      customLogger.warn(message);
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      customLogger.debug(message);
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message);
    });
  });
});

describe('createLogger', () => {
  it('should create logger with default options', () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should create logger with custom options', () => {
    const options = {
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'test.log' })
      ]
    };
    const logger = createLogger(options);
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
  });
});

describe('MockLogger', () => {
  let mockLogger: MockLogger;
  let mockConsole: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    mockConsole = {
      log: jest.spyOn(console, 'log'),
      error: jest.spyOn(console, 'error'),
      warn: jest.spyOn(console, 'warn'),
      debug: jest.spyOn(console, 'debug')
    };
    mockLogger = new MockLogger({ ...console, ...mockConsole });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      mockLogger.info(message);
      expect(mockConsole.log).toHaveBeenCalledWith('[test] INFO: Test info message');
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');
      mockLogger.error(message, error);
      expect(mockConsole.error).toHaveBeenCalledWith('[test] ERROR: Test error message', error);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      mockLogger.warn(message);
      expect(mockConsole.warn).toHaveBeenCalledWith('[test] WARN: Test warning message');
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      mockLogger.debug(message);
      expect(mockConsole.debug).toHaveBeenCalledWith('[test] DEBUG: Test debug message');
    });
  });

  describe('specialized logging methods', () => {
    it('should log security messages', () => {
      const message = 'Test security message';
      mockLogger.security(message);
      expect(mockConsole.warn).toHaveBeenCalledWith('[test] SECURITY: Test security message');
    });

    it('should log audit messages', () => {
      const message = 'Test audit message';
      mockLogger.audit(message);
      expect(mockConsole.log).toHaveBeenCalledWith('[test] AUDIT: Test audit message');
    });

    it('should log performance messages', () => {
      const message = 'Test performance message';
      mockLogger.performance(message);
      expect(mockConsole.log).toHaveBeenCalledWith('[test] PERFORMANCE: Test performance message');
    });
  });

  describe('error handling', () => {
    it('should handle logging errors gracefully', () => {
      mockConsole.log.mockImplementation(() => {
        throw new Error('Logging failed');
      });
      expect(() => mockLogger.info('Test message')).not.toThrow();
    });
  });
}); 