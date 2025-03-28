import { createLogger } from '../utils/logger';

export interface AccessConfig {
  roles?: string[];
  defaultRole?: string;
  permissions?: Record<string, string[]>;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
}

export interface AccessResponse {
  granted: boolean;
  reason?: string;
}

export class AccessController {
  private logger = createLogger('AccessController');
  private roles: string[];
  private defaultRole: string;
  private permissions: Record<string, string[]>;
  private userRoles: Map<string, string>;

  constructor(config: AccessConfig = {}) {
    this.roles = config.roles || ['admin', 'user', 'guest'];
    this.defaultRole = config.defaultRole || 'user';
    this.permissions = config.permissions || {
      admin: ['*'],
      user: ['read', 'write'],
      guest: ['read']
    };
    this.userRoles = new Map();
  }

  async initialize(): Promise<void> {
    try {
      // Validate roles and permissions
      this.validateConfig();
      this.logger.info('Access controller initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize access controller:', error);
      throw error;
    }
  }

  private validateConfig(): void {
    // Validate roles
    if (!this.roles.includes(this.defaultRole)) {
      throw new Error(`Default role "${this.defaultRole}" not found in roles list`);
    }

    // Validate permissions
    for (const role of this.roles) {
      if (!this.permissions[role]) {
        this.logger.warn(`No permissions defined for role: ${role}`);
        this.permissions[role] = [];
      }
    }
  }

  async checkAccess(request: AccessRequest): Promise<AccessResponse> {
    try {
      const userRole = await this.getUserRole(request.userId);
      const permissions = this.permissions[userRole] || [];

      // Admin has full access
      if (userRole === 'admin' || permissions.includes('*')) {
        return {
          granted: true,
          reason: 'Administrative access'
        };
      }

      // Check specific permission
      const hasAccess = permissions.includes(request.action);
      
      if (!hasAccess) {
        this.logger.warn('Access denied', {
          userId: request.userId,
          role: userRole,
          resource: request.resource,
          action: request.action
        });
      }

      return {
        granted: hasAccess,
        reason: hasAccess ? 'Permission granted' : 'Insufficient permissions'
      };
    } catch (error) {
      this.logger.error('Access check failed:', error);
      throw error;
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    try {
      if (!this.roles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      this.userRoles.set(userId, role);
      this.logger.info(`Updated role for user ${userId} to ${role}`);
    } catch (error) {
      this.logger.error('Failed to set user role:', error);
      throw error;
    }
  }

  async getUserRole(userId: string): Promise<string> {
    return this.userRoles.get(userId) || this.defaultRole;
  }

  async addRole(role: string, permissions: string[] = []): Promise<void> {
    try {
      if (this.roles.includes(role)) {
        throw new Error(`Role already exists: ${role}`);
      }

      this.roles.push(role);
      this.permissions[role] = permissions;
      this.logger.info(`Added new role: ${role} with permissions:`, permissions);
    } catch (error) {
      this.logger.error('Failed to add role:', error);
      throw error;
    }
  }

  async updateRolePermissions(role: string, permissions: string[]): Promise<void> {
    try {
      if (!this.roles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      this.permissions[role] = permissions;
      this.logger.info(`Updated permissions for role ${role}:`, permissions);
    } catch (error) {
      this.logger.error('Failed to update role permissions:', error);
      throw error;
    }
  }

  async removeRole(role: string): Promise<void> {
    try {
      if (role === this.defaultRole) {
        throw new Error('Cannot remove default role');
      }

      if (!this.roles.includes(role)) {
        throw new Error(`Role not found: ${role}`);
      }

      // Remove role and its permissions
      this.roles = this.roles.filter(r => r !== role);
      delete this.permissions[role];

      // Update users with this role to default role
      for (const [userId, userRole] of this.userRoles.entries()) {
        if (userRole === role) {
          this.userRoles.set(userId, this.defaultRole);
        }
      }

      this.logger.info(`Removed role: ${role}`);
    } catch (error) {
      this.logger.error('Failed to remove role:', error);
      throw error;
    }
  }

  async getRoles(): Promise<string[]> {
    return [...this.roles];
  }

  async getRolePermissions(role: string): Promise<string[]> {
    if (!this.roles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    return [...(this.permissions[role] || [])];
  }

  async dispose(): Promise<void> {
    try {
      this.roles = [];
      this.permissions = {};
      this.userRoles.clear();
      this.logger.info('Access controller disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose access controller:', error);
      throw error;
    }
  }
} 