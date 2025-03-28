import { QuantumCrypto } from '../quantumCrypto';
import { EncryptionConfig } from '../../types/security';
import { Logger } from '../../utils/logger';
import crypto from 'crypto';

// Create mock logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  log: jest.fn()
} as unknown as Logger;

// Mock the logger module
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
  Logger: jest.fn().mockImplementation(() => mockLogger)
}));

// Store original data for decryption
let storedData: any = null;

// Mock cipher and decipher objects
const mockCipher = {
  update: jest.fn((data: string | Buffer, inputEncoding?: string, outputEncoding?: string) => {
    storedData = data;
    if (typeof data === 'string' && outputEncoding) {
      return Buffer.from('encrypted').toString(outputEncoding);
    }
    return Buffer.from('encrypted');
  }),
  final: jest.fn((encoding?: string) => {
    if (encoding) {
      return Buffer.from('final').toString(encoding);
    }
    return Buffer.from('final');
  }),
  getAuthTag: jest.fn(() => Buffer.from('authTag'))
};

const mockDecipher = {
  update: jest.fn((data: Buffer) => {
    return Buffer.from(storedData);
  }),
  final: jest.fn(() => {
    return Buffer.from('');
  }),
  setAuthTag: jest.fn()
};

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn((size: number) => {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = i % 256;
    }
    return buffer;
  }),
  createCipheriv: jest.fn(() => mockCipher),
  createDecipheriv: jest.fn(() => mockDecipher)
}));

describe('QuantumCrypto', () => {
  let quantumCrypto: QuantumCrypto;
  const validConfig: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keySize: 32,
    quantumResistant: true,
    mode: 'gcm',
    padding: 'pkcs7'
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    storedData = null;
    quantumCrypto = new QuantumCrypto(validConfig, mockLogger);

    // Mock the test encryption/decryption in generateKeyPair
    const mockTestData = 'test';
    const mockEncrypted = Buffer.from('encrypted');
    const mockDecrypted = Buffer.from(mockTestData);

    // Mock the cipher operations for the test encryption
    mockCipher.update.mockImplementation((data: string | Buffer, inputEncoding?: string, outputEncoding?: string) => {
      storedData = data;
      if (typeof data === 'string' && outputEncoding) {
        return Buffer.from('encrypted').toString(outputEncoding);
      }
      return Buffer.from('encrypted');
    });
    mockCipher.final.mockImplementation((encoding?: string) => {
      if (encoding) {
        return Buffer.from('final').toString(encoding);
      }
      return Buffer.from('final');
    });
    mockCipher.getAuthTag.mockImplementation(() => Buffer.from('authTag'));

    // Mock the decipher operations for the test decryption
    mockDecipher.update.mockImplementation(() => Buffer.from(storedData));
    mockDecipher.final.mockImplementation(() => Buffer.from(''));
    mockDecipher.setAuthTag.mockImplementation(() => {});

    // Mock the randomBytes calls
    const mockRandomBytes = jest.spyOn(crypto, 'randomBytes');
    mockRandomBytes.mockImplementation((size: number) => {
      const buffer = Buffer.alloc(size);
      for (let i = 0; i < size; i++) {
        buffer[i] = i % 256;
      }
      return buffer;
    });

    // Mock createCipheriv and createDecipheriv
    const mockCreateCipheriv = jest.spyOn(crypto, 'createCipheriv');
    const mockCreateDecipheriv = jest.spyOn(crypto, 'createDecipheriv');

    mockCreateCipheriv.mockImplementation(() => mockCipher);
    mockCreateDecipheriv.mockImplementation(() => mockDecipher);

    // Initialize the instance
    await quantumCrypto.initialize();
  });

  describe('initialization', () => {
    it('should initialize with valid config', async () => {
      expect(mockLogger.info).toHaveBeenCalledWith('Quantum-resistant crypto initialized', expect.any(Object));
    });

    it('should throw error with invalid algorithm', () => {
      expect(() => new QuantumCrypto({ ...validConfig, algorithm: '' }, mockLogger)).toThrow('Encryption algorithm is required');
    });

    it('should throw error with invalid key size', () => {
      expect(() => new QuantumCrypto({ ...validConfig, keySize: 16 }, mockLogger)).toThrow('Key size must be at least 32 bytes');
    });
  });

  describe('ML data encryption', () => {
    it('should encrypt and decrypt tensor data correctly', async () => {
      const tensorData = {
        shape: [2, 3],
        values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        dtype: 'float32'
      };

      const encrypted = await quantumCrypto.encryptMLData(tensorData, { tensorFormat: 'float32' });
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await quantumCrypto.decryptMLData(encrypted);
      expect(decrypted).toEqual(tensorData);
    });

    it('should handle batch processing correctly', async () => {
      const batchData = {
        batches: [
          [1.0, 2.0, 3.0],
          [4.0, 5.0, 6.0]
        ]
      };

      const encrypted = await quantumCrypto.encryptMLData(batchData, { batchSize: 2 });
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await quantumCrypto.decryptMLData(encrypted);
      expect(decrypted).toEqual(batchData);
    });

    it('should preserve precision for float64 data', async () => {
      const float64Data = {
        values: [1.123456789, 2.987654321],
        dtype: 'float64'
      };

      const encrypted = await quantumCrypto.encryptMLData(float64Data, { 
        tensorFormat: 'float64',
        preservePrecision: true 
      });
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await quantumCrypto.decryptMLData(encrypted);
      expect(decrypted).toEqual(float64Data);
    });

    it('should handle int64 data correctly', async () => {
      const int64Data = {
        values: [9007199254740991, -9007199254740991], // Use regular numbers instead of BigInt
        dtype: 'int64'
      };

      const encrypted = await quantumCrypto.encryptMLData(int64Data, { tensorFormat: 'int64' });
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await quantumCrypto.decryptMLData(encrypted);
      expect(decrypted).toEqual(int64Data);
    });

    it('should throw error when data size exceeds limit', async () => {
      const originalStringify = JSON.stringify;
      const mockString = { length: 1024 * 1024 * 1024 + 1 }; // Mock string with length > 1GB
      const mockStringify = jest.fn().mockReturnValue(mockString);
      global.JSON.stringify = mockStringify;

      try {
        await expect(quantumCrypto.encryptMLData({ test: 'data' })).rejects.toThrow('Data size exceeds maximum limit');
      } finally {
        global.JSON.stringify = originalStringify;
      }
    });
  });

  describe('encryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const data = { test: 'data' };
      const encrypted = await quantumCrypto.encrypt(data);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await quantumCrypto.decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should throw error when encrypting null data', async () => {
      await expect(quantumCrypto.encrypt(null)).rejects.toThrow('Cannot encrypt null or undefined data');
    });

    it('should throw error when encrypting undefined data', async () => {
      await expect(quantumCrypto.encrypt(undefined)).rejects.toThrow('Cannot encrypt null or undefined data');
    });

    it('should throw error when data size exceeds limit', async () => {
      const originalStringify = JSON.stringify;
      const mockString = { length: 1024 * 1024 * 1024 + 1 }; // Mock string with length > 1GB
      const mockStringify = jest.fn().mockReturnValue(mockString);
      global.JSON.stringify = mockStringify;

      try {
        await expect(quantumCrypto.encrypt({ test: 'data' })).rejects.toThrow('Data size exceeds maximum limit');
      } finally {
        global.JSON.stringify = originalStringify;
      }
    });
  });

  describe('decryption', () => {
    it('should throw error when decrypting invalid data', async () => {
      await expect(quantumCrypto.decrypt('invalid-data')).rejects.toThrow('Decryption failed');
    });

    it('should throw error when decrypting empty string', async () => {
      await expect(quantumCrypto.decrypt('')).rejects.toThrow('Invalid encrypted data');
    });
  });

  describe('disposal', () => {
    it('should dispose resources correctly', async () => {
      await expect(quantumCrypto.dispose()).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('Quantum-resistant crypto disposed');
    });
  });
}); 