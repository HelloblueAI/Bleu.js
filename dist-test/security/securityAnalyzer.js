"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prom_client_1 = require("prom-client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const winston_1 = require("winston");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SecurityAnalyzer {
    constructor(config) {
        this.lastReport = null;
        this.threatPatterns = new Map();
        this.config = config;
        this.initializeLogger();
        this.initializeMetrics();
        this.initializeThreatPatterns();
    }
    initializeLogger() {
        this.logger = (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                }),
                new winston_1.transports.File({
                    filename: 'logs/security_analyzer.log',
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5
                })
            ]
        });
    }
    initializeMetrics() {
        this.metrics = {
            vulnerabilityGauge: new prom_client_1.promClient.Gauge({
                name: 'security_vulnerabilities_total',
                help: 'Total number of security vulnerabilities by severity',
                labelNames: ['severity']
            }),
            dependencyGauge: new prom_client_1.promClient.Gauge({
                name: 'security_dependencies_total',
                help: 'Total number of dependencies by status',
                labelNames: ['status']
            }),
            securityScoreGauge: new prom_client_1.promClient.Gauge({
                name: 'security_score',
                help: 'Overall security score (0-100)'
            }),
            systemHealthGauge: new prom_client_1.promClient.Gauge({
                name: 'system_health_status',
                help: 'System health status by component',
                labelNames: ['component', 'status']
            }),
            complianceGauge: new prom_client_1.promClient.Gauge({
                name: 'compliance_status',
                help: 'Compliance status by standard',
                labelNames: ['standard']
            }),
            threatIntelligenceGauge: new prom_client_1.promClient.Gauge({
                name: 'threat_intelligence_total',
                help: 'Threat intelligence metrics',
                labelNames: ['type']
            })
        };
    }
    initializeThreatPatterns() {
        // SQL Injection patterns
        this.threatPatterns.set('sqlInjection', /(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE)\s+.*?(?:'|")/gi);
        // XSS patterns
        this.threatPatterns.set('xss', /<script>|javascript:|on\w+\s*=/gi);
        // Command injection patterns
        this.threatPatterns.set('commandInjection', /(?:exec|eval|system|spawn|shell_exec)\s*\(/gi);
        // File inclusion patterns
        this.threatPatterns.set('fileInclusion', /(?:include|require)\s*\([^)]*\.\./gi);
        // Authentication bypass patterns
        this.threatPatterns.set('authBypass', /(?:bypass|admin|root|superuser)\s*[:=]\s*['"][^'"]+['"]/gi);
    }
    async generateSecurityReport() {
        try {
            this.logger.info('Starting security analysis');
            // Run npm audit
            const { stdout: auditOutput } = await execAsync('npm audit --json');
            const auditData = JSON.parse(auditOutput);
            // Run npm outdated
            const { stdout: outdatedOutput } = await execAsync('npm outdated --json');
            const outdatedData = JSON.parse(outdatedOutput);
            // Analyze vulnerabilities
            const vulnerabilities = this.analyzeVulnerabilities(auditData);
            // Analyze dependencies
            const dependencies = this.analyzeDependencies(outdatedData);
            // Calculate security score
            const securityScore = this.calculateSecurityScore(vulnerabilities, dependencies);
            // Generate recommendations
            const recommendations = this.generateRecommendations(vulnerabilities, dependencies);
            // Check system health
            const systemHealth = await this.checkSystemHealth();
            // Check compliance
            const compliance = await this.checkCompliance();
            // Gather threat intelligence
            const threatIntelligence = await this.gatherThreatIntelligence();
            const report = {
                timestamp: new Date(),
                vulnerabilities,
                dependencies,
                securityScore,
                recommendations,
                lastScan: new Date(),
                systemHealth,
                compliance,
                threatIntelligence
            };
            // Update metrics
            this.updateMetrics(report);
            // Store last report
            this.lastReport = report;
            this.logger.info('Security analysis completed successfully');
            return report;
        }
        catch (error) {
            this.logger.error('Error generating security report:', error);
            throw error;
        }
    }
    analyzeVulnerabilities(auditData) {
        const vulnerabilities = [];
        for (const [id, vuln] of Object.entries(auditData.vulnerabilities)) {
            vulnerabilities.push({
                id,
                type: vuln.type,
                severity: this.determineSeverity(vuln.severity),
                description: vuln.description,
                location: vuln.location,
                fix: vuln.fix,
                cwe: vuln.cwe,
                cvss: vuln.cvss,
                references: vuln.references
            });
        }
        return vulnerabilities;
    }
    analyzeDependencies(outdatedData) {
        const dependencies = [];
        for (const [name, info] of Object.entries(outdatedData)) {
            dependencies.push({
                name,
                version: info.current,
                latestVersion: info.latest,
                vulnerabilities: info.vulnerabilities || [],
                outdated: info.current !== info.latest
            });
        }
        return dependencies;
    }
    calculateSecurityScore(vulnerabilities, dependencies) {
        let score = 100;
        // Deduct points for vulnerabilities
        for (const vuln of vulnerabilities) {
            switch (vuln.severity) {
                case 'critical':
                    score -= 20;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        }
        // Deduct points for outdated dependencies
        const outdatedCount = dependencies.filter(d => d.outdated).length;
        score -= outdatedCount * 2;
        // Ensure score stays within bounds
        return Math.max(0, Math.min(100, score));
    }
    generateRecommendations(vulnerabilities, dependencies) {
        const recommendations = [];
        // Generate recommendations for vulnerabilities
        for (const vuln of vulnerabilities) {
            recommendations.push({
                priority: vuln.severity,
                category: 'Vulnerability',
                description: `Fix ${vuln.type} vulnerability: ${vuln.description}`,
                impact: this.determineImpact(vuln.severity),
                implementation: vuln.fix
            });
        }
        // Generate recommendations for outdated dependencies
        for (const dep of dependencies) {
            if (dep.outdated) {
                recommendations.push({
                    priority: 'medium',
                    category: 'Dependency',
                    description: `Update ${dep.name} from ${dep.version} to ${dep.latestVersion}`,
                    impact: 'Medium - Potential security improvements and bug fixes',
                    implementation: `npm install ${dep.name}@${dep.latestVersion}`
                });
            }
        }
        return recommendations;
    }
    async checkSystemHealth() {
        return {
            firewall: await this.checkFirewallStatus(),
            encryption: await this.checkEncryptionStatus(),
            authentication: await this.checkAuthenticationStatus(),
            logging: await this.checkLoggingStatus()
        };
    }
    async checkCompliance() {
        return {
            owasp: await this.checkOWASPCompliance(),
            pci: await this.checkPCICompliance(),
            gdpr: await this.checkGDPRCompliance()
        };
    }
    async gatherThreatIntelligence() {
        const recentThreats = await this.fetchRecentThreats();
        const blockedIPs = await this.getBlockedIPsCount();
        const suspiciousActivities = await this.getSuspiciousActivities();
        return {
            recentThreats,
            blockedIPs,
            suspiciousActivities
        };
    }
    updateMetrics(report) {
        // Update vulnerability metrics
        const vulnCounts = this.countVulnerabilitiesBySeverity(report.vulnerabilities);
        for (const [severity, count] of Object.entries(vulnCounts)) {
            this.metrics.vulnerabilityGauge.set({ severity }, count);
        }
        // Update dependency metrics
        const depCounts = this.countDependenciesByStatus(report.dependencies);
        for (const [status, count] of Object.entries(depCounts)) {
            this.metrics.dependencyGauge.set({ status }, count);
        }
        // Update security score
        this.metrics.securityScoreGauge.set(report.securityScore);
        // Update system health metrics
        for (const [component, status] of Object.entries(report.systemHealth)) {
            this.metrics.systemHealthGauge.set({ component, status: status.status }, 1);
        }
        // Update compliance metrics
        for (const [standard, status] of Object.entries(report.compliance)) {
            this.metrics.complianceGauge.set({ standard }, status.compliant ? 1 : 0);
        }
        // Update threat intelligence metrics
        this.metrics.threatIntelligenceGauge.set({ type: 'recentThreats' }, report.threatIntelligence.recentThreats.length);
        this.metrics.threatIntelligenceGauge.set({ type: 'blockedIPs' }, report.threatIntelligence.blockedIPs);
        this.metrics.threatIntelligenceGauge.set({ type: 'suspiciousActivities' }, report.threatIntelligence.suspiciousActivities.length);
    }
}
exports.default = SecurityAnalyzer;
//# sourceMappingURL=securityAnalyzer.js.map