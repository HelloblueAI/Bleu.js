"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
class SecurityManager {
    constructor(config) {
        this.config = config;
        this.encryptionEngine = new MilitaryGradeEncryption();
        this.quantumResistantCrypto = new QuantumResistantCrypto();
        this.threatDetector = new AdvancedThreatDetector();
        this.accessController = new AccessController();
        this.auditLogger = new SecurityAuditLogger();
        this.vulnerabilityScanner = new VulnerabilityScanner();
    }
    async initialize() {
        logger.info('Initializing Security Manager with military-grade capabilities...');
        // Initialize security components
        await this.encryptionEngine.initialize();
        await this.quantumResistantCrypto.initialize();
        await this.threatDetector.initialize();
        await this.accessController.initialize();
        await this.auditLogger.initialize();
        await this.vulnerabilityScanner.initialize();
        logger.info('Security Manager initialized successfully');
    }
    async validateDecision(decision) {
        try {
            // Check for security threats
            const threats = await this.threatDetector.detectThreats(decision);
            if (threats.length > 0) {
                throw new SecurityError('Security threats detected in decision');
            }
            // Validate access permissions
            await this.accessController.validateAccess(decision);
            // Log security audit
            await this.auditLogger.logDecision(decision);
            // Scan for vulnerabilities
            const vulnerabilities = await this.vulnerabilityScanner.scan(decision);
            if (vulnerabilities.length > 0) {
                throw new SecurityError('Vulnerabilities detected in decision');
            }
        }
        catch (error) {
            logger.error('Security validation failed:', error);
            throw error;
        }
    }
    async encrypt(data) {
        try {
            // Apply military-grade encryption
            const encryptedData = await this.encryptionEngine.encrypt(data);
            // Apply quantum-resistant encryption
            const quantumResistantData = await this.quantumResistantCrypto.encrypt(encryptedData);
            // Log encryption operation
            await this.auditLogger.logEncryption(data);
            return quantumResistantData;
        }
        catch (error) {
            logger.error('Encryption failed:', error);
            throw error;
        }
    }
    async decrypt(encryptedData) {
        try {
            // Validate access permissions
            await this.accessController.validateAccess(encryptedData);
            // Decrypt quantum-resistant encryption
            const decryptedData = await this.quantumResistantCrypto.decrypt(encryptedData);
            // Decrypt military-grade encryption
            const finalData = await this.encryptionEngine.decrypt(decryptedData);
            // Log decryption operation
            await this.auditLogger.logDecryption(encryptedData);
            return finalData;
        }
        catch (error) {
            logger.error('Decryption failed:', error);
            throw error;
        }
    }
    async calculateSecurityScore(data) {
        try {
            // Calculate various security metrics
            const [encryptionScore, quantumResistanceScore, threatScore, vulnerabilityScore, accessScore] = await Promise.all([
                this.encryptionEngine.calculateScore(data),
                this.quantumResistantCrypto.calculateScore(data),
                this.threatDetector.calculateScore(data),
                this.vulnerabilityScanner.calculateScore(data),
                this.accessController.calculateScore(data)
            ]);
            // Calculate overall security score
            const overallScore = this.calculateOverallScore({
                encryptionScore,
                quantumResistanceScore,
                threatScore,
                vulnerabilityScore,
                accessScore
            });
            return {
                overall: overallScore,
                encryption: encryptionScore,
                quantumResistance: quantumResistanceScore,
                threat: threatScore,
                vulnerability: vulnerabilityScore,
                access: accessScore,
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('Security score calculation failed:', error);
            throw error;
        }
    }
    calculateOverallScore(scores) {
        // Implement weighted scoring algorithm
        const weights = {
            encryption: 0.3,
            quantumResistance: 0.2,
            threat: 0.2,
            vulnerability: 0.2,
            access: 0.1
        };
        return Object.entries(scores).reduce((total, [key, score]) => {
            return total + (score * weights[key]);
        }, 0);
    }
    async getSecurityMetrics() {
        return {
            encryptionStrength: await this.encryptionEngine.getStrength(),
            quantumResistance: await this.quantumResistantCrypto.getResistance(),
            threatLevel: await this.threatDetector.getThreatLevel(),
            vulnerabilityCount: await this.vulnerabilityScanner.getVulnerabilityCount(),
            accessControlScore: await this.accessController.getScore(),
            auditLogSize: await this.auditLogger.getLogSize()
        };
    }
    async generateSecurityReport() {
        try {
            const metrics = await this.getSecurityMetrics();
            const recentThreats = await this.threatDetector.getRecentThreats();
            const recentVulnerabilities = await this.vulnerabilityScanner.getRecentVulnerabilities();
            const accessLogs = await this.auditLogger.getRecentLogs();
            return {
                metrics,
                recentThreats,
                recentVulnerabilities,
                accessLogs,
                timestamp: Date.now(),
                reportId: this.generateReportId()
            };
        }
        catch (error) {
            logger.error('Security report generation failed:', error);
            throw error;
        }
    }
    generateReportId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    dispose() {
        this.encryptionEngine.dispose();
        this.quantumResistantCrypto.dispose();
        this.threatDetector.dispose();
        this.accessController.dispose();
        this.auditLogger.dispose();
        this.vulnerabilityScanner.dispose();
    }
}
exports.SecurityManager = SecurityManager;
//# sourceMappingURL=securityManager.js.map