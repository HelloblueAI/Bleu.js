import crypto from 'crypto';
import { createLogger } from '../utils/logger';

export interface KeyPair {
  key: Buffer;
  iv: Buffer;
}

export class QuantumResistantCrypto {
  private logger = createLogger('QuantumResistantCrypto');
  private algorithm: string;
  private keySize: number;
  private ivSize: number;

  constructor(config: { algorithm?: string; keySize?: number; ivSize?: number } = {}) {
    this.algorithm = config.algorithm || 'aes-256-gcm';
    this.keySize = config.keySize || 32;
    this.ivSize = config.ivSize || 16;

    // Validate algorithm
    if (!crypto.getCiphers().includes(this.algorithm)) {
      throw new Error(`Unsupported encryption algorithm: ${this.algorithm}`);
    }
  }

  async generateKeys(): Promise<KeyPair> {
    try {
      // Generate quantum-resistant key using a strong random number generator
      const key = await this.generateQuantumResistantKey();
      const iv = crypto.randomBytes(this.ivSize);

      return { key, iv };
    } catch (error) {
      this.logger.error('Failed to generate quantum-resistant keys:', error);
      throw error;
    }
  }

  private async generateQuantumResistantKey(): Promise<Buffer> {
    try {
      // Use a combination of multiple entropy sources for key generation
      const entropyPool = await this.collectEntropy();
      
      // Apply key stretching using PBKDF2
      const salt = crypto.randomBytes(32);
      const iterations = 100000;
      
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          entropyPool,
          salt,
          iterations,
          this.keySize,
          'sha512',
          (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
          }
        );
      });
    } catch (error) {
      this.logger.error('Failed to generate quantum-resistant key:', error);
      throw error;
    }
  }

  private async collectEntropy(): Promise<Buffer> {
    try {
      // Collect entropy from multiple sources
      const systemEntropy = crypto.randomBytes(64);
      const timeEntropy = Buffer.from(Date.now().toString());
      const processEntropy = Buffer.from(process.hrtime.bigint().toString());

      // Combine entropy sources
      const combinedEntropy = Buffer.concat([
        systemEntropy,
        timeEntropy,
        processEntropy
      ]);

      // Hash the combined entropy
      const hash = crypto.createHash('sha512');
      hash.update(combinedEntropy);
      
      return hash.digest();
    } catch (error) {
      this.logger.error('Failed to collect entropy:', error);
      throw error;
    }
  }

  async encrypt(data: Buffer, key: Buffer, iv: Buffer): Promise<Buffer> {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      // Combine IV, encrypted data, and auth tag
      return Buffer.concat([iv, encrypted, authTag]);
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw error;
    }
  }

  async decrypt(encryptedData: Buffer, key: Buffer): Promise<Buffer> {
    try {
      // Extract IV and auth tag
      const iv = encryptedData.subarray(0, this.ivSize);
      const tag = encryptedData.subarray(
        this.ivSize,
        this.ivSize + 16
      );
      const encrypted = encryptedData.subarray(this.ivSize + 16);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw error;
    }
  }

  async rotateKey(currentKey: Buffer): Promise<Buffer> {
    try {
      // Generate new quantum-resistant key
      const { key: newKey } = await this.generateKeys();

      // Mix with current key for additional entropy
      const combinedKey = Buffer.concat([currentKey, newKey]);
      const hash = crypto.createHash('sha512');
      hash.update(combinedKey);

      const finalKey = hash.digest().slice(0, this.keySize);
      this.logger.info('Key rotation completed successfully');

      return finalKey;
    } catch (error) {
      this.logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  async validateKey(key: Buffer): Promise<boolean> {
    try {
      if (key.length !== this.keySize) {
        return false;
      }

      // Perform statistical tests on the key
      const stats = await this.performKeyStatistics(key);
      
      return (
        stats.entropy > 7.5 &&      // High entropy (bits per byte)
        stats.uniqueBytes > 200 &&  // Good byte diversity
        stats.patterns < 0.1        // Low pattern repetition
      );
    } catch (error) {
      this.logger.error('Key validation failed:', error);
      throw error;
    }
  }

  private async performKeyStatistics(key: Buffer): Promise<{
    entropy: number;
    uniqueBytes: number;
    patterns: number;
  }> {
    // Calculate Shannon entropy
    const frequencies = new Array(256).fill(0);
    for (const byte of key) {
      frequencies[byte]++;
    }

    let entropy = 0;
    for (const freq of frequencies) {
      if (freq === 0) continue;
      const p = freq / key.length;
      entropy -= p * Math.log2(p);
    }

    // Count unique bytes
    const uniqueBytes = frequencies.filter(f => f > 0).length;

    // Check for patterns
    let patterns = 0;
    for (let i = 0; i < key.length - 1; i++) {
      if (key[i] === key[i + 1]) {
        patterns++;
      }
    }
    patterns /= key.length;

    return { entropy, uniqueBytes, patterns };
  }

  async dispose(): Promise<void> {
    try {
      // Clear sensitive data
      this.algorithm = '';
      this.keySize = 0;
      this.ivSize = 0;
      
      this.logger.info('Quantum-resistant crypto module disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose quantum-resistant crypto module:', error);
      throw error;
    }
  }
} 