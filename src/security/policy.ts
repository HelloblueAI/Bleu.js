import { SecurityError } from '../errors/securityError';

export interface PolicyRule {
  resource: string;
  allowedUsers: string[];
  permissions: string[];
}

export class SecurityPolicy {
  private rules: PolicyRule[];

  constructor(rules: PolicyRule[] = []) {
    this.rules = rules;
  }

  async checkAccess(resource: string, user: string): Promise<boolean> {
    try {
      const rule = this.rules.find(r => r.resource === resource);
      if (!rule) {
        return false;
      }
      return rule.allowedUsers.includes(user);
    } catch (error) {
      throw new SecurityError('Failed to check access policy');
    }
  }

  addRule(rule: PolicyRule): void {
    const existingRuleIndex = this.rules.findIndex(r => r.resource === rule.resource);
    if (existingRuleIndex >= 0) {
      this.rules[existingRuleIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  removeRule(resource: string): void {
    this.rules = this.rules.filter(r => r.resource !== resource);
  }

  getRules(): PolicyRule[] {
    return [...this.rules];
  }

  hasPermission(resource: string, user: string, permission: string): boolean {
    const rule = this.rules.find(r => r.resource === resource);
    if (!rule) {
      return false;
    }
    return rule.allowedUsers.includes(user) && rule.permissions.includes(permission);
  }
} 