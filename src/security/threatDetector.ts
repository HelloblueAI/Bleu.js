import { createLogger } from '../utils/logger';

export interface Threat {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  details?: Record<string, any>;
}

export class ThreatDetector {
  private logger = createLogger('ThreatDetector');
  private patterns: Map<string, RegExp>;

  constructor() {
    this.patterns = new Map([
      ['sql_injection', /('.*'|".*"|`.*`|--|;|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)/i],
      ['xss', /<script|javascript:|on\w+\s*=|eval\s*\(|document\.cookie/i],
      ['command_injection', /[;&|`$]|\.\.\/|\.\.\\|cmd\.exe|powershell/i],
      ['path_traversal', /\.\.\/|\.\.\\|\.\.|~\/|~\\|\/etc\/|\/var\/|C:\\Windows\\|C:\\Program Files\\/i],
      ['file_inclusion', /include\s*\(|require\s*\(|include_once\s*\(|require_once\s*\(/i],
      ['ssrf', /^(http|https|ftp|gopher|data|file):\/\//i],
      ['template_injection', /\{\{.*\}\}|\{%.*%\}|\${.*}/i],
      ['ldap_injection', /[()|\&\*]/],
      ['xml_injection', /<!\[CDATA\[|<!ENTITY|<!DOCTYPE|<\?xml/i],
      ['email_injection', /\r|\n|%0A|%0D|Content-Type:|Bcc:|Cc:/i]
    ]);
  }

  async analyze(data: string): Promise<Threat[]> {
    try {
      const threats: Threat[] = [];

      for (const [type, pattern] of this.patterns) {
        if (pattern.test(data)) {
          const threat = this.createThreat(type, data);
          threats.push(threat);
          this.logger.warn('Threat detected:', threat);
        }
      }

      // Perform additional analysis for complex threats
      await this.analyzeComplexThreats(data, threats);

      return threats;
    } catch (error) {
      this.logger.error('Threat analysis failed:', error);
      throw error;
    }
  }

  private createThreat(type: string, data: string): Threat {
    const severityMap: Record<string, Threat['severity']> = {
      sql_injection: 'critical',
      xss: 'high',
      command_injection: 'critical',
      path_traversal: 'high',
      file_inclusion: 'high',
      ssrf: 'medium',
      template_injection: 'medium',
      ldap_injection: 'high',
      xml_injection: 'medium',
      email_injection: 'low'
    };

    return {
      type,
      description: this.getThreatDescription(type),
      severity: severityMap[type] || 'medium',
      confidence: this.calculateConfidence(type, data),
      details: {
        pattern: this.patterns.get(type).toString(),
        matchedData: data.substring(0, 100) // Limit the matched data length
      }
    };
  }

  private getThreatDescription(type: string): string {
    const descriptions: Record<string, string> = {
      sql_injection: 'Potential SQL injection attempt detected',
      xss: 'Cross-site scripting (XSS) attack detected',
      command_injection: 'Command injection attempt detected',
      path_traversal: 'Path traversal attempt detected',
      file_inclusion: 'File inclusion attempt detected',
      ssrf: 'Server-side request forgery attempt detected',
      template_injection: 'Template injection attempt detected',
      ldap_injection: 'LDAP injection attempt detected',
      xml_injection: 'XML injection attempt detected',
      email_injection: 'Email header injection attempt detected'
    };

    return descriptions[type] || 'Unknown threat detected';
  }

  private calculateConfidence(type: string, data: string): number {
    // Base confidence level
    let confidence = 0.5;

    // Adjust confidence based on pattern complexity
    const pattern = this.patterns.get(type);
    confidence += pattern.toString().length / 100;

    // Adjust confidence based on match count
    const matches = data.match(pattern) || [];
    confidence += matches.length * 0.1;

    // Adjust confidence based on data context
    if (this.hasContextualIndicators(type, data)) {
      confidence += 0.2;
    }

    // Ensure confidence is between 0 and 1
    return Math.min(Math.max(confidence, 0), 1);
  }

  private hasContextualIndicators(type: string, data: string): boolean {
    const indicators: Record<string, RegExp[]> = {
      sql_injection: [/SELECT.*FROM/i, /WHERE.*=/i],
      xss: [/<.*>.*<\/.*>/i, /script.*src/i],
      command_injection: [/\|\s*[a-z]+/i, />\s*[a-z]+/i]
    };

    return indicators[type]?.some(pattern => pattern.test(data)) || false;
  }

  private async analyzeComplexThreats(data: string, threats: Threat[]): Promise<void> {
    // Analyze for combined threats
    if (threats.length > 1) {
      const combinedSeverity = this.calculateCombinedSeverity(threats);
      if (combinedSeverity === 'critical') {
        threats.push({
          type: 'combined_attack',
          description: 'Multiple security threats detected in combination',
          severity: 'critical',
          confidence: 0.9,
          details: {
            threatCount: threats.length,
            threatTypes: threats.map(t => t.type)
          }
        });
      }
    }

    // Analyze for sophisticated patterns
    if (this.detectSophisticatedPattern(data)) {
      threats.push({
        type: 'sophisticated_attack',
        description: 'Complex attack pattern detected',
        severity: 'critical',
        confidence: 0.8,
        details: {
          pattern: 'Multiple stages or obfuscation detected'
        }
      });
    }
  }

  private calculateCombinedSeverity(threats: Threat[]): Threat['severity'] {
    const severityScore = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const totalScore = threats.reduce((score, threat) => {
      return score + severityScore[threat.severity];
    }, 0);

    const averageScore = totalScore / threats.length;

    if (averageScore >= 3.5) return 'critical';
    if (averageScore >= 2.5) return 'high';
    if (averageScore >= 1.5) return 'medium';
    return 'low';
  }

  private detectSophisticatedPattern(data: string): boolean {
    // Check for obfuscation techniques
    const obfuscationPatterns = [
      /eval\(atob\(.*\)\)/i,
      /String\.fromCharCode\(.*\)/i,
      /unescape\(.*\)/i,
      /decodeURIComponent\(.*\)/i
    ];

    // Check for multi-stage attack patterns
    const multiStagePatterns = [
      /[a-zA-Z0-9+/]{50,}={0,2}/,  // Base64 encoded content
      /\\x[0-9a-fA-F]{2}/g,        // Hex encoded characters
      /\\u[0-9a-fA-F]{4}/g         // Unicode encoded characters
    ];

    return (
      obfuscationPatterns.some(pattern => pattern.test(data)) ||
      multiStagePatterns.some(pattern => pattern.test(data))
    );
  }

  async dispose(): Promise<void> {
    try {
      this.patterns.clear();
      this.logger.info('Threat detector disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose threat detector:', error);
      throw error;
    }
  }
} 