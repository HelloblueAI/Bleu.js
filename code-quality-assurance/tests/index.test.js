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
const path = require('path');
const fs = require('fs');
const { CodeQualityAnalyzer } = require('../src/index');

const __filename = path.dirname(__filename);
const __dirname = path.dirname(__filename);

describe('Code Quality Assurance Module', () => {
  let analyzer;
  let sampleCode;

  beforeEach(() => {
    analyzer = new CodeQualityAnalyzer();
    sampleCode = fs.readFileSync(path.join(__dirname, 'fixtures/sample.js'), 'utf8');
  });

  describe('CodeQualityAnalyzer Class', () => {
    test('should initialize with default config', () => {
      expect(analyzer.config).toEqual({
        complexityThreshold: 10,
        coverageThreshold: 80,
        maxDuplication: 5,
        securityLevel: 'high'
      });
    });

    test('should initialize with custom config', () => {
      const customConfig = {
        complexityThreshold: 15,
        coverageThreshold: 90,
        maxDuplication: 3,
        securityLevel: 'medium'
      };
      const customAnalyzer = new CodeQualityAnalyzer(customConfig);
      expect(customAnalyzer.config).toEqual(customConfig);
    });
  });

  describe('Code Analysis', () => {
    test('should analyze code complexity', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.complexity).toBeDefined();
      expect(results.complexity.cyclomaticComplexity).toBeDefined();
      expect(results.complexity.cognitiveComplexity).toBeDefined();
      expect(results.complexity.maintainabilityIndex).toBeDefined();
      expect(typeof results.complexity.isComplex).toBe('boolean');
    });

    test('should analyze security vulnerabilities', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.security).toBeDefined();
      expect(Array.isArray(results.security.vulnerabilities)).toBe(true);
      expect(results.security.severity).toBeDefined();
      expect(Array.isArray(results.security.recommendations)).toBe(true);
    });

    test('should analyze performance', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.performance).toBeDefined();
      expect(Array.isArray(results.performance.potentialBottlenecks)).toBe(true);
      expect(Array.isArray(results.performance.optimizationSuggestions)).toBe(true);
      expect(results.performance.memoryUsage).toBeDefined();
      expect(results.performance.executionTime).toBeDefined();
    });

    test('should check code style', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.style).toBeDefined();
      expect(Array.isArray(results.style.issues)).toBe(true);
      expect(typeof results.style.isCompliant).toBe('boolean');
    });

    test('should analyze dependencies', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.dependencies).toBeDefined();
      expect(Array.isArray(results.dependencies.outdated)).toBe(true);
      expect(Array.isArray(results.dependencies.vulnerabilities)).toBe(true);
      expect(Array.isArray(results.dependencies.unused)).toBe(true);
      expect(Array.isArray(results.dependencies.recommendations)).toBe(true);
    });

    test('should analyze test coverage', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.coverage).toBeDefined();
      expect(results.coverage.statements).toBeDefined();
      expect(results.coverage.branches).toBeDefined();
      expect(results.coverage.functions).toBeDefined();
      expect(results.coverage.lines).toBeDefined();
      expect(typeof results.coverage.isCovered).toBe('boolean');
    });

    test('should check documentation', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.documentation).toBeDefined();
      expect(Array.isArray(results.documentation.missingDocs)).toBe(true);
      expect(Array.isArray(results.documentation.incompleteDocs)).toBe(true);
      expect(Array.isArray(results.documentation.outdatedDocs)).toBe(true);
      expect(Array.isArray(results.documentation.recommendations)).toBe(true);
    });

    test('should detect code duplication', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.duplication).toBeDefined();
      expect(Array.isArray(results.duplication.duplicates)).toBe(true);
      expect(typeof results.duplication.percentage).toBe('number');
      expect(typeof results.duplication.isAcceptable).toBe('boolean');
    });

    test('should generate refactoring suggestions', async () => {
      const results = await analyzer.analyzeCode(sampleCode, 'sample.js');
      expect(results.refactoring).toBeDefined();
      expect(Array.isArray(results.refactoring.improvements)).toBe(true);
      expect(results.refactoring.complexity).toBeDefined();
      expect(results.refactoring.maintainability).toBeDefined();
      expect(results.refactoring.priority).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive report', async () => {
      await analyzer.analyzeCode(sampleCode, 'sample.js');
      const report = await analyzer.generateReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.metadata).toBeDefined();
      
      expect(report.summary.timestamp).toBeDefined();
      expect(typeof report.summary.overallScore).toBe('number');
      expect(report.summary.criticalIssues).toBeDefined();
      expect(Array.isArray(report.summary.recommendations)).toBe(true);
    });

    test('should calculate overall score correctly', async () => {
      await analyzer.analyzeCode(sampleCode, 'sample.js');
      const score = analyzer.calculateOverallScore();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should identify critical issues', async () => {
      await analyzer.analyzeCode(sampleCode, 'sample.js');
      const issues = analyzer.getCriticalIssues();
      
      expect(issues).toBeDefined();
      expect(Array.isArray(issues.security)).toBe(true);
      expect(Array.isArray(issues.complexity)).toBe(true);
      expect(Array.isArray(issues.coverage)).toBe(true);
    });

    test('should generate meaningful recommendations', async () => {
      await analyzer.analyzeCode(sampleCode, 'sample.js');
      const recommendations = analyzer.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.message).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid code gracefully', async () => {
      const invalidCode = 'invalid javascript code';
      await expect(analyzer.analyzeCode(invalidCode, 'invalid.js')).rejects.toThrow();
    });

    test('should handle missing file gracefully', async () => {
      await expect(analyzer.analyzeCode('', 'nonexistent.js')).rejects.toThrow();
    });

    test('should require analysis before report generation', async () => {
      await expect(analyzer.generateReport()).rejects.toThrow();
    });
  });
});
