export declare class SecurityManager {
    private config;
    private encryptionEngine;
    private quantumResistantCrypto;
    private threatDetector;
    private accessController;
    private auditLogger;
    private vulnerabilityScanner;
    constructor(config: SecurityConfig);
    initialize(): Promise<void>;
    validateDecision(decision: any): Promise<void>;
    encrypt(data: any): Promise<EncryptedData>;
    decrypt(encryptedData: EncryptedData): Promise<any>;
    calculateSecurityScore(data: any): Promise<SecurityScore>;
    private calculateOverallScore;
    getSecurityMetrics(): Promise<SecurityMetrics>;
    generateSecurityReport(): Promise<SecurityReport>;
    private generateReportId;
    dispose(): void;
}
//# sourceMappingURL=securityManager.d.ts.map