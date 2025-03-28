//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const eslint = require('eslint');
const sonarqube = require('sonarqube-scanner');
const security = require('security-scan');
const complexity = require('complexity');
const coverage = require('istanbul');
const documentation = require('documentation');
const dependencies = require('dependency-check');
const performance = require('performance-analyzer');
const duplication = require('jscpd');
const refactor = require('js-code-analyzer');

class CodeQualityAnalyzer {
  constructor(config = {}) {
    this.config = {
      complexityThreshold: 10,
      coverageThreshold: 80,
      maxDuplication: 5,
      securityLevel: 'high',
      ...config
    };
    this.results = {};
  }

  async analyzeCode(code, filePath) {
    try {
      const ast = esprima.parseScript(code, { loc: true, range: true });
      
      // Analyze code complexity
      const complexityMetrics = this.analyzeComplexity(ast);
      
      // Analyze security vulnerabilities
      const securityIssues = await this.analyzeSecurity(code);
      
      // Analyze performance
      const performanceMetrics = this.analyzePerformance(ast);
      
      // Check code style
      const styleIssues = this.checkCodeStyle(code);
      
      // Analyze dependencies
      const dependencyIssues = await this.analyzeDependencies(filePath);
      
      // Check test coverage
      const coverageMetrics = await this.analyzeCoverage(filePath);
      
      // Check documentation
      const documentationIssues = await this.checkDocumentation(code);
      
      // Detect code duplication
      const duplicationIssues = await this.detectDuplication(code);
      
      // Generate refactoring suggestions
      const refactoringSuggestions = this.generateRefactoringSuggestions(ast);

      this.results = {
        complexity: complexityMetrics,
        security: securityIssues,
        performance: performanceMetrics,
        style: styleIssues,
        dependencies: dependencyIssues,
        coverage: coverageMetrics,
        documentation: documentationIssues,
        duplication: duplicationIssues,
        refactoring: refactoringSuggestions,
        timestamp: new Date().toISOString()
      };

      return this.results;
    } catch (error) {
      console.error('Error analyzing code:', error);
      throw error;
    }
  }

  analyzeComplexity(ast) {
    const metrics = complexity.calculate(ast);
    return {
      cyclomaticComplexity: metrics.cyclomatic,
      cognitiveComplexity: metrics.cognitive,
      maintainabilityIndex: metrics.maintainability,
      isComplex: metrics.cyclomatic > this.config.complexityThreshold
    };
  }

  async analyzeSecurity(code) {
    const issues = await security.scan(code);
    return {
      vulnerabilities: issues.vulnerabilities,
      severity: issues.severity,
      recommendations: issues.recommendations
    };
  }

  analyzePerformance(ast) {
    const metrics = performance.analyze(ast);
    return {
      potentialBottlenecks: metrics.bottlenecks,
      optimizationSuggestions: metrics.suggestions,
      memoryUsage: metrics.memory,
      executionTime: metrics.executionTime
    };
  }

  checkCodeStyle(code) {
    const linter = new eslint.Linter();
    const messages = linter.verify(code);
    return {
      issues: messages,
      isCompliant: messages.length === 0
    };
  }

  async analyzeDependencies(filePath) {
    const issues = await dependencies.check(filePath);
    return {
      outdated: issues.outdated,
      vulnerabilities: issues.vulnerabilities,
      unused: issues.unused,
      recommendations: issues.recommendations
    };
  }

  async analyzeCoverage(filePath) {
    const metrics = await coverage.collect(filePath);
    return {
      statements: metrics.statements,
      branches: metrics.branches,
      functions: metrics.functions,
      lines: metrics.lines,
      isCovered: metrics.lines.pct >= this.config.coverageThreshold
    };
  }

  async checkDocumentation(code) {
    const issues = await documentation.lint(code);
    return {
      missingDocs: issues.missing,
      incompleteDocs: issues.incomplete,
      outdatedDocs: issues.outdated,
      recommendations: issues.recommendations
    };
  }

  async detectDuplication(code) {
    const issues = await duplication.detect(code);
    return {
      duplicates: issues.duplicates,
      percentage: issues.percentage,
      isAcceptable: issues.percentage <= this.config.maxDuplication
    };
  }

  generateRefactoringSuggestions(ast) {
    const suggestions = refactor.analyze(ast);
    return {
      improvements: suggestions.improvements,
      complexity: suggestions.complexity,
      maintainability: suggestions.maintainability,
      priority: suggestions.priority
    };
  }

  async generateReport() {
    if (!this.results) {
      throw new Error('No analysis results available. Run analyzeCode first.');
    }

    const report = {
      summary: {
        timestamp: this.results.timestamp,
        overallScore: this.calculateOverallScore(),
        criticalIssues: this.getCriticalIssues(),
        recommendations: this.getRecommendations()
      },
      details: this.results,
      metadata: {
        version: '1.0.0',
        config: this.config
      }
    };

    return report;
  }

  calculateOverallScore() {
    const weights = {
      complexity: 0.2,
      security: 0.25,
      performance: 0.15,
      style: 0.1,
      coverage: 0.15,
      documentation: 0.1,
      duplication: 0.05
    };

    let score = 100;

    // Deduct points based on issues
    if (this.results.complexity.isComplex) score -= 20;
    if (this.results.security.severity === 'high') score -= 25;
    if (this.results.style.issues.length > 0) score -= 10;
    if (!this.results.coverage.isCovered) score -= 15;
    if (!this.results.duplication.isAcceptable) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  getCriticalIssues() {
    return {
      security: this.results.security.vulnerabilities.filter(v => v.severity === 'high'),
      complexity: this.results.complexity.isComplex ? ['Code complexity exceeds threshold'] : [],
      coverage: !this.results.coverage.isCovered ? ['Test coverage below threshold'] : []
    };
  }

  getRecommendations() {
    const recommendations = [];

    // Complexity recommendations
    if (this.results.complexity.isComplex) {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: 'Consider breaking down complex functions into smaller, more manageable pieces'
      });
    }

    // Security recommendations
    if (this.results.security.vulnerabilities.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'Address security vulnerabilities identified in the scan'
      });
    }

    // Performance recommendations
    if (this.results.performance.potentialBottlenecks.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Optimize identified performance bottlenecks'
      });
    }

    // Documentation recommendations
    if (this.results.documentation.missingDocs.length > 0) {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        message: 'Add missing documentation for functions and classes'
      });
    }

    return recommendations;
  }
}

module.exports = {
  CodeQualityAnalyzer,
  analyzeCode: (code, filePath) => new CodeQualityAnalyzer().analyzeCode(code, filePath),
  generateReport: () => new CodeQualityAnalyzer().generateReport()
};
