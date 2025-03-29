// import { SecurityConfig } from './index';

export interface SecurityConfig {
  readonly encryption: {
    readonly algorithm: string;
    readonly keySize: number;
    readonly ivSize: number;
    readonly keyRotationInterval: number;
    readonly quantumResistant?: boolean;
    readonly mode?: string;
    readonly padding?: string;
  };
  readonly authorization: {
    readonly roles: string[];
    readonly defaultRole: string;
    readonly permissions: Record<string, string[]>;
    readonly sessionTimeout: number;
  };
  readonly audit: {
    readonly enabled: boolean;
    readonly retentionDays: number;
    readonly logPath: string;
    readonly sensitiveFields?: string[];
  };
  readonly rateLimit: {
    readonly points: number;
    readonly duration: number;
  };
  readonly passwordPolicy: {
    readonly minLength: number;
    readonly requireUppercase: boolean;
    readonly requireLowercase: boolean;
    readonly requireNumbers: boolean;
    readonly requireSpecialChars: boolean;
  };
  readonly enabled: boolean;
  readonly encryptionKey?: string;
  tokenExpiry: number;
  maxRetries: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface SecurityReport {
  readonly timestamp: Date;
  readonly metrics: SecurityMetrics;
  readonly vulnerabilities: Vulnerability[];
  readonly dependencies: DependencyInfo[];
  readonly compliance: ComplianceStatus[];
  readonly recommendations: string[];
  readonly score?: SecurityScore;
}

export interface SecurityScore {
  readonly overall: number;
  readonly components: {
    readonly encryption: number;
    readonly authentication: number;
    readonly authorization: number;
    readonly audit: number;
  };
  readonly details: Record<string, any>;
}

export interface ComplianceStatus {
  readonly standard: string;
  readonly compliant: boolean;
  readonly violations: string[];
  readonly recommendations: string[];
  readonly lastChecked: Date;
}

export interface Vulnerability {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly cvss: number;
  readonly affected: string[];
  readonly fix?: string;
  readonly references: string[];
  readonly discovered: Date;
}

export interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly vulnerabilities: Vulnerability[];
  readonly licenses: string[];
  readonly outdated: boolean;
}

export interface EncryptionConfig {
  readonly algorithm: string;
  readonly keySize: number;
  readonly quantumResistant: boolean;
  readonly mode: string;
  readonly padding: string;
}

export interface SecurityMetrics {
  readonly encryptionStrength: number;
  readonly authenticationScore: number;
  readonly vulnerabilityCount: number;
  readonly complianceScore: number;
  readonly lastUpdated: Date;
  readonly threatDetections?: number;
  readonly blockedAttacks?: number;
  readonly averageResponseTime?: number;
}

export interface LogLevel {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

export interface ScanResult {
  readonly vulnerabilities: Vulnerability[];
  readonly metrics: SecurityMetrics;
  readonly timestamp: Date;
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  KEY_ROTATION = 'KEY_ROTATION',
  THREAT_DETECTED = 'THREAT_DETECTED',
  VULNERABILITY_FOUND = 'VULNERABILITY_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
} 