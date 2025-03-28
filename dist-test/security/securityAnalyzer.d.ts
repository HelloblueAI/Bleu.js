import { BleuConfig } from '../index';
interface SecurityReport {
    timestamp: Date;
    vulnerabilities: Array<{
        id: string;
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        location: string;
        fix: string;
        cwe?: string;
        cvss?: number;
        references?: string[];
    }>;
    dependencies: Array<{
        name: string;
        version: string;
        latestVersion: string;
        vulnerabilities: string[];
        outdated: boolean;
    }>;
    securityScore: number;
    recommendations: Array<{
        priority: 'low' | 'medium' | 'high' | 'critical';
        category: string;
        description: string;
        impact: string;
        implementation: string;
    }>;
    lastScan: Date;
    systemHealth: {
        firewall: {
            status: 'active' | 'inactive' | 'unknown';
            rules: number;
            blockedAttempts: number;
        };
        encryption: {
            status: 'strong' | 'moderate' | 'weak';
            algorithms: string[];
            keyStrength: number;
        };
        authentication: {
            status: 'secure' | 'moderate' | 'weak';
            methods: string[];
            mfaEnabled: boolean;
        };
        logging: {
            status: 'comprehensive' | 'basic' | 'none';
            retention: number;
            alerts: boolean;
        };
    };
    compliance: {
        owasp: {
            score: number;
            issues: Array<{
                category: string;
                severity: string;
                description: string;
            }>;
        };
        pci: {
            compliant: boolean;
            issues: string[];
        };
        gdpr: {
            compliant: boolean;
            issues: string[];
        };
    };
    threatIntelligence: {
        recentThreats: Array<{
            type: string;
            severity: string;
            description: string;
            mitigation: string;
        }>;
        blockedIPs: number;
        suspiciousActivities: Array<{
            type: string;
            timestamp: Date;
            details: string;
        }>;
    };
}
declare class SecurityAnalyzer {
    private logger;
    private config;
    private metrics;
    private lastReport;
    private threatPatterns;
    constructor(config: BleuConfig);
    private initializeLogger;
    private initializeMetrics;
    private initializeThreatPatterns;
    generateSecurityReport(): Promise<SecurityReport>;
    private analyzeVulnerabilities;
    private analyzeDependencies;
    private calculateSecurityScore;
    private generateRecommendations;
    private checkSystemHealth;
    private checkCompliance;
    private gatherThreatIntelligence;
    private updateMetrics;
}
export default SecurityAnalyzer;
//# sourceMappingURL=securityAnalyzer.d.ts.map