// import { SecurityConfig } from './index';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
    keyRotationInterval: number;
    quantumResistant?: boolean;
    mode?: string;
    padding?: string;
  };
  authorization: {
    roles: string[];
    defaultRole: string;
    permissions: Record<string, string[]>;
    sessionTimeout: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    logPath: string;
    sensitiveFields?: string[];
  };
  rateLimit: {
    points: number;
    duration: number;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  enabled: boolean;
  encryptionKey?: string;
}

export interface SecurityReport {
  timestamp: Date;
  metrics: SecurityMetrics;
  vulnerabilities: Vulnerability[];
  dependencies: DependencyInfo[];
  compliance: ComplianceStatus[];
  recommendations: string[];
  score?: SecurityScore;
}

export interface SecurityScore {
  overall: number;
  components: {
    encryption: number;
    authentication: number;
    authorization: number;
    audit: number;
  };
  details: Record<string, any>;
}

export interface ComplianceStatus {
  standard: string;
  compliant: boolean;
  violations: string[];
  recommendations: string[];
  lastChecked: Date;
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvss: number;
  affected: string[];
  fix?: string;
  references: string[];
  discovered: Date;
}

export interface DependencyInfo {
  name: string;
  version: string;
  vulnerabilities: Vulnerability[];
  licenses: string[];
  outdated: boolean;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  quantumResistant: boolean;
  mode: string;
  padding: string;
}

export interface SecurityMetrics {
  encryptionStrength: number;
  authenticationScore: number;
  vulnerabilityCount: number;
  complianceScore: number;
  lastUpdated: Date;
  threatDetections?: number;
  blockedAttacks?: number;
  averageResponseTime?: number;
}

export interface LogLevel {
  name: string;
  value: number;
  color: string;
}

export interface ScanResult {
  vulnerabilities: Vulnerability[];
  metrics: SecurityMetrics;
  timestamp: Date;
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