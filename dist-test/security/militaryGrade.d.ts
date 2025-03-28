import { BleuConfig } from '../types/config';
import { SecurityReport } from './types';
export declare class MilitaryGradeSecurity {
    private config;
    private logger;
    private encryptionKey;
    private salt;
    private metrics;
    constructor(config: BleuConfig);
    initialize(): Promise<void>;
    private generateKey;
    encrypt(data: Buffer): Promise<{
        encrypted: Buffer;
        iv: Buffer;
        tag: Buffer;
    }>;
    decrypt(encrypted: Buffer, iv: Buffer, tag: Buffer): Promise<Buffer>;
    private generateAAD;
    private initializeZeroTrust;
    private initializeQuantumResistance;
    private initializeIntegrityChecks;
    private initializeThreatDetection;
    private validateIdentity;
    private validateDevice;
    private validateNetwork;
    private validateApplication;
    private validateData;
    private initializeQuantumAlgorithm;
    private checkCodeIntegrity;
    private checkDataIntegrity;
    private checkSystemIntegrity;
    private checkNetworkIntegrity;
    private detectAnomalies;
    private detectIntrusions;
    private detectMalware;
    private detectDDoS;
    private updateMetrics;
    private calculateEncryptionStrength;
    private calculateIntegrityScore;
    private calculateThreatLevel;
    private calculateZeroTrustScore;
    getSecurityReport(): Promise<SecurityReport>;
    private getCurrentThreats;
    private getSecurityRecommendations;
    private getComplianceStatus;
    dispose(): Promise<void>;
}
//# sourceMappingURL=militaryGrade.d.ts.map