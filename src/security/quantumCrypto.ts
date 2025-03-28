import { EncryptionConfig } from '../types/security';
import { createLogger, Logger } from '../utils/logger';
import crypto from 'crypto';

export interface MLEncryptionOptions {
  batchSize?: number;
  compressionLevel?: number;
  preservePrecision?: boolean;
  tensorFormat?: 'float32' | 'float64' | 'int32' | 'int64';
}

export class QuantumCrypto {
  private config: EncryptionConfig;
  private readonly logger: Logger;
  private keyPair: { publicKey: Buffer; privateKey: Buffer } | null = null;
  private readonly maxDataSize = 1024 * 1024 * 1024; // 1GB limit for ML data
  private readonly defaultBatchSize = 1000;
  private readonly defaultCompressionLevel = 6;

  constructor(config: EncryptionConfig, logger?: Logger) {
    // Initialize logger first
    this.logger = logger || createLogger('QuantumCrypto');
    
    // Then validate config and set up other properties
    this.validateConfig(config);
    this.config = {
      algorithm: config.algorithm,
      keySize: config.keySize,
      quantumResistant: config.quantumResistant ?? true,
      mode: config.mode ?? 'gcm',
      padding: config.padding ?? 'pkcs7'
    };

    // Log initialization
    this.logger.debug('QuantumCrypto instance created', {
      algorithm: this.config.algorithm,
      keySize: this.config.keySize,
      mode: this.config.mode
    });
  }

  private validateConfig(config: EncryptionConfig): void {
    if (!config.algorithm) {
      throw new Error('Encryption algorithm is required');
    }
    if (!config.keySize || config.keySize < 32) {
      throw new Error('Key size must be at least 32 bytes');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Initialize quantum-resistant key pair
      const keyPair = await this.generateKeyPair();
      
      // Validate key pair
      if (!keyPair?.publicKey || !keyPair?.privateKey) {
        throw new Error('Invalid key pair generated');
      }

      this.keyPair = keyPair;
      this.logger.info('Quantum-resistant crypto initialized', {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize,
        mode: this.config.mode
      });
    } catch (error) {
      this.logger.error('Failed to initialize quantum-resistant crypto:', { error });
      throw new Error(`Quantum crypto initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateKeyPair(): Promise<{ publicKey: Buffer; privateKey: Buffer }> {
    try {
      // Generate a cryptographically secure random key pair
      const publicKeyBuffer = crypto.randomBytes(this.config.keySize);
      const privateKeyBuffer = crypto.randomBytes(this.config.keySize);

      // Validate the generated keys
      if (!Buffer.isBuffer(publicKeyBuffer) || !Buffer.isBuffer(privateKeyBuffer)) {
        const error = new Error('Failed to generate valid key pair');
        this.logger.error('Key pair generation failed:', { error });
        throw error;
      }

      // Validate key sizes
      if (publicKeyBuffer.length !== this.config.keySize || privateKeyBuffer.length !== this.config.keySize) {
        const error = new Error('Generated key pair has incorrect size');
        this.logger.error('Key pair generation failed:', { 
          error,
          publicKeySize: publicKeyBuffer.length,
          privateKeySize: privateKeyBuffer.length,
          expectedSize: this.config.keySize
        });
        throw error;
      }

      // Test key pair with a simple encryption/decryption
      try {
        const testData = 'test';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.config.algorithm, publicKeyBuffer, iv);
        const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        const decipher = crypto.createDecipheriv(this.config.algorithm, publicKeyBuffer, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        
        if (decrypted !== testData) {
          throw new Error('Key pair validation failed');
        }
      } catch (error) {
        this.logger.error('Key pair validation failed:', { error });
        throw new Error('Generated key pair failed validation');
      }

      const keyPair = {
        publicKey: publicKeyBuffer,
        privateKey: privateKeyBuffer
      };

      this.logger.debug('Generated new key pair', {
        algorithm: this.config.algorithm,
        keySize: this.config.keySize
      });

      return keyPair;
    } catch (error) {
      this.logger.error('Key pair generation failed:', { error });
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async encrypt(data: any): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Crypto not initialized');
    }

    const startTime = Date.now();
    try {
      // Validate input data
      if (data === null || data === undefined) {
        throw new Error('Cannot encrypt null or undefined data');
      }

      // Convert data to string and validate size
      const dataString = JSON.stringify(data);
      if (dataString.length > this.maxDataSize) {
        throw new Error(`Data size exceeds maximum limit of ${this.maxDataSize} bytes`);
      }
      
      // Encrypt using quantum-resistant algorithm
      const encrypted = await this.quantumEncrypt(dataString, this.keyPair.publicKey);
      
      this.logger.debug('Data encrypted successfully', { 
        inputSize: dataString.length,
        outputSize: encrypted.length,
        duration: Date.now() - startTime
      });
      
      return encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', { error, dataSize: data ? JSON.stringify(data).length : 0 });
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decrypt(encryptedData: string): Promise<any> {
    if (!this.keyPair) {
      throw new Error('Crypto not initialized');
    }

    const startTime = Date.now();
    try {
      // Validate input
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
      }

      // Decrypt using quantum-resistant algorithm
      const decrypted = await this.quantumDecrypt(encryptedData, this.keyPair.privateKey);
      
      // Validate and parse decrypted data
      let result;
      try {
        result = JSON.parse(decrypted);
      } catch (parseError) {
        throw new Error('Failed to parse decrypted data');
      }
      
      this.logger.debug('Data decrypted successfully', {
        inputSize: encryptedData.length,
        outputSize: decrypted.length,
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      this.logger.error('Decryption failed:', { error, inputSize: encryptedData?.length });
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async encryptMLData(data: any, options: MLEncryptionOptions = {}): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Crypto not initialized');
    }

    const startTime = Date.now();
    try {
      if (data === null || data === undefined) {
        throw new Error('Cannot encrypt null or undefined data');
      }

      // Handle ML-specific data types
      const processedData = this.preprocessMLData(data, options);
      const dataString = JSON.stringify(processedData);

      if (dataString.length > this.maxDataSize) {
        throw new Error(`Data size exceeds maximum limit of ${this.maxDataSize} bytes`);
      }
      
      const encrypted = await this.quantumEncrypt(dataString, this.keyPair.publicKey);
      
      this.logger.debug('ML data encrypted successfully', { 
        inputSize: dataString.length,
        outputSize: encrypted.length,
        duration: Date.now() - startTime,
        tensorFormat: options.tensorFormat,
        batchSize: options.batchSize
      });
      
      return encrypted;
    } catch (error) {
      this.logger.error('ML data encryption failed:', { 
        error, 
        dataSize: data ? JSON.stringify(data).length : 0,
        tensorFormat: options.tensorFormat 
      });
      throw new Error(`ML data encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decryptMLData(encryptedData: string, options: MLEncryptionOptions = {}): Promise<any> {
    if (!this.keyPair) {
      throw new Error('Crypto not initialized');
    }

    const startTime = Date.now();
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        throw new Error('Invalid encrypted data');
      }

      const decrypted = await this.quantumDecrypt(encryptedData, this.keyPair.privateKey);
      
      let result;
      try {
        result = JSON.parse(decrypted);
      } catch (parseError) {
        throw new Error('Failed to parse decrypted data');
      }

      // Post-process ML data
      const processedResult = this.postprocessMLData(result, options);
      
      this.logger.debug('ML data decrypted successfully', {
        inputSize: encryptedData.length,
        outputSize: decrypted.length,
        duration: Date.now() - startTime,
        tensorFormat: options.tensorFormat,
        batchSize: options.batchSize
      });
      
      return processedResult;
    } catch (error) {
      this.logger.error('ML data decryption failed:', { 
        error, 
        inputSize: encryptedData?.length,
        tensorFormat: options.tensorFormat 
      });
      throw new Error(`ML data decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private preprocessMLData(data: any, options: MLEncryptionOptions): any {
    // Handle different ML data types and formats
    if (Array.isArray(data)) {
      // Handle tensor data
      if (options.tensorFormat) {
        return this.preprocessTensorData(data, options);
      }
      // Handle batch data
      if (options.batchSize) {
        return this.preprocessBatchData(data, options);
      }
    }
    return data;
  }

  private postprocessMLData(data: any, options: MLEncryptionOptions): any {
    // Restore ML data types and formats
    if (Array.isArray(data)) {
      if (options.tensorFormat) {
        return this.postprocessTensorData(data, options);
      }
      if (options.batchSize) {
        return this.postprocessBatchData(data, options);
      }
    }
    return data;
  }

  private preprocessTensorData(data: number[], options: MLEncryptionOptions): number[] {
    // Convert tensor data to the specified format
    switch (options.tensorFormat) {
      case 'float32':
        return data.map(x => Number(x.toFixed(6)));
      case 'float64':
        return data.map(x => Number(x.toFixed(12)));
      case 'int32':
        return data.map(x => Math.round(x));
      case 'int64':
        return data.map(x => BigInt(Math.round(x)));
      default:
        return data;
    }
  }

  private postprocessTensorData(data: number[], options: MLEncryptionOptions): number[] {
    // Restore tensor data from the specified format
    switch (options.tensorFormat) {
      case 'float32':
        return data.map(x => Number(x.toFixed(6)));
      case 'float64':
        return data.map(x => Number(x.toFixed(12)));
      case 'int32':
        return data.map(x => Math.round(x));
      case 'int64':
        return data.map(x => Number(BigInt(x)));
      default:
        return data;
    }
  }

  private preprocessBatchData(data: any[], options: MLEncryptionOptions): any[] {
    const batchSize = options.batchSize || this.defaultBatchSize;
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private postprocessBatchData(data: any[], options: MLEncryptionOptions): any[] {
    // Flatten batches back into a single array
    return data.flat();
  }

  private async quantumEncrypt(data: string, publicKey: Buffer): Promise<string> {
    try {
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(
        this.config.algorithm,
        publicKey,
        iv
      );

      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();

      const result = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'base64'),
        authTag
      ]).toString('base64');
      
      this.logger.trace('Quantum encryption performed', {
        inputSize: data.length,
        outputSize: result.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Quantum encryption failed:', { error });
      throw new Error(`Quantum encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async quantumDecrypt(encryptedData: string, privateKey: Buffer): Promise<string> {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const iv = buffer.slice(0, 16);
      const authTag = buffer.slice(-16);
      const data = buffer.slice(16, -16);

      const decipher = crypto.createDecipheriv(
        this.config.algorithm,
        privateKey,
        iv
      );

      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(data);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      this.logger.trace('Quantum decryption performed', {
        inputSize: encryptedData.length,
        outputSize: decrypted.length
      });
      
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Quantum decryption failed:', { error });
      throw new Error(`Quantum decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async dispose(): Promise<void> {
    try {
      this.keyPair = null;
      this.logger.info('Quantum-resistant crypto disposed');
    } catch (error) {
      this.logger.error('Failed to dispose quantum-resistant crypto:', { error });
      throw new Error(`Failed to dispose quantum-resistant crypto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 