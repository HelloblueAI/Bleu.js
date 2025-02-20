// Enhanced crypto shim for Jest environment
import {
  randomBytes,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  scrypt,
  pbkdf2,
} from 'crypto';

// Create a complete crypto implementation
const enhancedCrypto = {
  // Basic crypto methods
  randomBytes,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  scrypt,
  pbkdf2,

  // Web Crypto API compatible methods
  getRandomValues(buffer) {
    if (buffer instanceof Uint8Array) {
      const bytes = randomBytes(buffer.length);
      buffer.set(new Uint8Array(bytes));
      return buffer;
    }
    throw new TypeError('The argument must be a Uint8Array');
  },

  // Additional utility methods
  randomUUID() {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  },

  // Subtle crypto implementation (partial)
  subtle: {
    async digest(algorithm, data) {
      const hash = createHash(algorithm.toLowerCase().replace('-', ''));
      hash.update(typeof data === 'string' ? Buffer.from(data) : data);
      return hash.digest();
    },

    // Add HMAC support
    async importKey(format, keyData, algorithm, extractable, keyUsages) {
      if (algorithm.name === 'HMAC') {
        return {
          type: 'secret',
          algorithm,
          extractable,
          usages: keyUsages,
          handle: Buffer.from(keyData),
        };
      }
      throw new Error('Unsupported algorithm');
    },

    // Add sign support for HMAC
    async sign(algorithm, key, data) {
      if (algorithm.name === 'HMAC') {
        const hmac = createHmac('sha256', key.handle);
        hmac.update(typeof data === 'string' ? Buffer.from(data) : data);
        return hmac.digest();
      }
      throw new Error('Unsupported algorithm');
    },
  },

  // Constants
  constants: {
    RAND_MAX: 2147483647,
    SSL_OP_ALL: 0x80000000,
    SSL_OP_NO_SSLv2: 0x01000000,
    SSL_OP_NO_SSLv3: 0x02000000,
    SSL_OP_NO_TLSv1: 0x04000000,
  },
};

// Handle both CommonJS and ES modules environments
if (typeof window !== 'undefined') {
  // Browser environment
  window.crypto = enhancedCrypto;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.crypto = enhancedCrypto;
}

// Polyfill TextEncoder if it doesn't exist (needed for some crypto operations)
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return Buffer.from(str);
    }
  };
}

// Polyfill TextDecoder if it doesn't exist
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buf) {
      return buf.toString('utf-8');
    }
  };
}

// Export the enhanced crypto implementation
export default enhancedCrypto;

// Also export individual methods for selective importing
export {
  randomBytes,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  scrypt,
  pbkdf2,
};

// Export a factory function for creating new instances
export function createCrypto() {
  return { ...enhancedCrypto };
}
