import { AuthorizationConfig } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('accessControl');

export class AccessController {
  private config: AuthorizationConfig;
  private permissions: Map<string, Set<string>>;

  constructor(config: AuthorizationConfig) {
    this.config = config;
    this.permissions = new Map();
    this.initializePermissions();
  }

  private initializePermissions(): void {
    // Initialize default permissions
    this.permissions.set('admin', new Set(['read', 'write', 'delete', 'execute']));
    this.permissions.set('user', new Set(['read', 'write']));
    this.permissions.set('guest', new Set(['read']));
  }

  async checkAccess(userId: string, resource: string): Promise<boolean> {
    try {
      const userPermissions = this.permissions.get(userId) || this.permissions.get('guest');
      if (!userPermissions) {
        logger.warn(`No permissions found for user: ${userId}`);
        return false;
      }

      const hasAccess = userPermissions.has(resource);
      logger.debug(`Access check for user ${userId} on resource ${resource}: ${hasAccess}`);
      return hasAccess;
    } catch (error) {
      logger.error('Access check failed:', error);
      throw error;
    }
  }

  async grantAccess(userId: string, resource: string): Promise<void> {
    try {
      let userPermissions = this.permissions.get(userId);
      if (!userPermissions) {
        userPermissions = new Set();
        this.permissions.set(userId, userPermissions);
      }
      userPermissions.add(resource);
      logger.info(`Granted ${resource} access to user: ${userId}`);
    } catch (error) {
      logger.error('Failed to grant access:', error);
      throw error;
    }
  }

  async revokeAccess(userId: string, resource: string): Promise<void> {
    try {
      const userPermissions = this.permissions.get(userId);
      if (userPermissions) {
        userPermissions.delete(resource);
        logger.info(`Revoked ${resource} access from user: ${userId}`);
      }
    } catch (error) {
      logger.error('Failed to revoke access:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.permissions.clear();
    logger.info('Access controller disposed');
  }
} 