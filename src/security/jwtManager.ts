import * as jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';

interface JWTConfig {
  secret: string;
  expiresIn: string;
}

interface JWTPayload {
  userId: string;
  role: string;
  [key: string]: any;
}

export class JWTManager {
  private config: JWTConfig;
  private logger: Logger;

  constructor(config: JWTConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  generateToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, this.config.secret, {
        expiresIn: this.config.expiresIn
      });
    } catch (error) {
      this.logger.error('Failed to generate JWT token:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.config.secret) as JWTPayload;
    } catch (error) {
      this.logger.error('Failed to verify JWT token:', error);
      throw error;
    }
  }

  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      this.logger.error('Failed to decode JWT token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      const exp = decoded.exp;
      if (!exp) return true;

      return Date.now() >= exp * 1000;
    } catch (error) {
      this.logger.error('Failed to check token expiration:', error);
      return true;
    }
  }
} 