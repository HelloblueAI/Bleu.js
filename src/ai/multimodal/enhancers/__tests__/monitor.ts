import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { run } from 'jest';
import { logger } from '../../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { TestMonitor } from '../monitor';
import * as fsPromises from 'fs/promises';

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('jest', () => ({
  run: jest.fn().mockResolvedValue({
    numTotalTests: 10,
    numPassedTests: 8,
    numFailedTests: 2,
    testResults: [{
      testResults: [
        { title: 'quantum state', status: 'passed' },
        { title: 'quantum state', status: 'passed' },
        { title: 'quantum state', status: 'failed' },
        { title: 'quantum state', status: 'passed' },
        { title: 'performance', status: 'passed' },
        { title: 'performance', status: 'failed' },
        { title: 'performance', status: 'passed' }
      ]
    }]
  })
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));

jest.mock('fs/promises');
jest.mock('path');

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  quantumState: {
    coherence: number;
    entanglement: number;
    amplitude: number;
    phase: number;
  };
  performance: {
    modelEnhancement: number;
    inputEnhancement: number;
    gateOperations: number;
  };
}

describe('Test Monitor', () => {
  let monitor: TestMonitor;
  const testDir = '/test/dir';

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new TestMonitor(testDir);
  });

  it('should run tests and collect metrics', async () => {
    const mockResults = {
      passed: 10,
      failed: 2,
      duration: 1500
    };

    (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockResults));
    const metrics = await monitor.collectMetrics();

    expect(metrics).toEqual(mockResults);
    expect(fsPromises.readFile).toHaveBeenCalled();
  });

  it('should handle test failures gracefully', async () => {
    const mockError = new Error('Test failure');
    (fsPromises.readFile as jest.Mock).mockRejectedValue(mockError);

    await expect(monitor.collectMetrics()).rejects.toThrow('Failed to collect test metrics');
  });

  it('should generate report correctly', async () => {
    const mockMetrics = {
      passed: 15,
      failed: 3,
      duration: 2000
    };

    (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMetrics));
    const report = await monitor.generateReport();

    expect(report).toEqual({
      metrics: mockMetrics,
      timestamp: expect.any(Date),
      status: 'warning'
    });
  });

  it('should handle file system errors gracefully', async () => {
    const mockError = new Error('File system error');
    (fsPromises.readFile as jest.Mock).mockRejectedValue(mockError);

    await expect(monitor.generateReport()).rejects.toThrow('Failed to generate test report');
  });

  it('should handle empty test results gracefully', async () => {
    (fsPromises.readFile as jest.Mock).mockResolvedValue('');

    await expect(monitor.collectMetrics()).rejects.toThrow('Empty test results');
  });

  it('should handle missing test results gracefully', async () => {
    (fsPromises.readFile as jest.Mock).mockResolvedValue(null);

    await expect(monitor.collectMetrics()).rejects.toThrow('Missing test results');
  });

  it('should handle invalid test results gracefully', async () => {
    (fsPromises.readFile as jest.Mock).mockResolvedValue('invalid json');

    await expect(monitor.collectMetrics()).rejects.toThrow('Invalid test results format');
  });

  it('should handle path errors gracefully', async () => {
    const mockError = new Error('Path error');
    (path.join as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await expect(monitor.collectMetrics()).rejects.toThrow('Invalid test directory path');
  });
});

async function runTestsWithMonitoring(): Promise<void> {
  const startTime = Date.now();
  const metrics: TestMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    duration: 0,
    quantumState: {
      coherence: 0,
      entanglement: 0,
      amplitude: 0,
      phase: 0
    },
    performance: {
      modelEnhancement: 0,
      inputEnhancement: 0,
      gateOperations: 0
    }
  };

  try {
    logger.info('🚀 Starting QuantumEnhancer tests with monitoring...');

    // Run tests with Jest
    const results = await run(['--json', '--testPathPattern=quantumEnhancer.test.ts']);

    // Process test results
    metrics.totalTests = results.numTotalTests;
    metrics.passedTests = results.numPassedTests;
    metrics.failedTests = results.numFailedTests;
    metrics.duration = Date.now() - startTime;

    // Collect quantum state metrics
    const quantumStateResults = results.testResults[0]?.testResults
      .filter(test => test.title.includes('quantum state'))
      .map(test => test.status === 'passed' ? 1 : 0) || [];
    
    metrics.quantumState = {
      coherence: quantumStateResults[0] || 0,
      entanglement: quantumStateResults[1] || 0,
      amplitude: quantumStateResults[2] || 0,
      phase: quantumStateResults[3] || 0
    };

    // Collect performance metrics
    const performanceResults = results.testResults[0]?.testResults
      .filter(test => test.title.includes('performance'))
      .map(test => test.status === 'passed' ? 1 : 0) || [];

    metrics.performance = {
      modelEnhancement: performanceResults[0] || 0,
      inputEnhancement: performanceResults[1] || 0,
      gateOperations: performanceResults[2] || 0
    };

    // Log results
    logger.info('📊 Test Results:');
    logger.info(`Total Tests: ${metrics.totalTests}`);
    logger.info(`Passed: ${metrics.passedTests}`);
    logger.info(`Failed: ${metrics.failedTests}`);
    logger.info(`Duration: ${metrics.duration}ms`);

    logger.info('🔬 Quantum State Metrics:');
    logger.info(`Coherence: ${metrics.quantumState.coherence}`);
    logger.info(`Entanglement: ${metrics.quantumState.entanglement}`);
    logger.info(`Amplitude: ${metrics.quantumState.amplitude}`);
    logger.info(`Phase: ${metrics.quantumState.phase}`);

    logger.info('⚡ Performance Metrics:');
    logger.info(`Model Enhancement: ${metrics.performance.modelEnhancement}`);
    logger.info(`Input Enhancement: ${metrics.performance.inputEnhancement}`);
    logger.info(`Gate Operations: ${metrics.performance.gateOperations}`);

    // Save metrics to file
    const metricsPath = path.join(__dirname, 'metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    logger.info(`📝 Metrics saved to ${metricsPath}`);

    // Generate report
    const report = generateReport(metrics);
    const reportPath = path.join(__dirname, 'report.md');
    fs.writeFileSync(reportPath, report);
    logger.info(`📄 Report generated at ${reportPath}`);

  } catch (error) {
    logger.error('❌ Error during test monitoring:', error);
    throw error;
  }
}

function generateReport(metrics: TestMetrics): string {
  return `# QuantumEnhancer Test Report
Generated on: ${new Date().toISOString()}

## Test Summary
- Total Tests: ${metrics.totalTests}
- Passed: ${metrics.passedTests}
- Failed: ${metrics.failedTests}
- Duration: ${metrics.duration}ms

## Quantum State Analysis
- Coherence: ${metrics.quantumState.coherence}
- Entanglement: ${metrics.quantumState.entanglement}
- Amplitude: ${metrics.quantumState.amplitude}
- Phase: ${metrics.quantumState.phase}

## Performance Analysis
- Model Enhancement: ${metrics.performance.modelEnhancement}
- Input Enhancement: ${metrics.performance.inputEnhancement}
- Gate Operations: ${metrics.performance.gateOperations}

## Status
${metrics.failedTests === 0 ? '✅ All tests passed' : '❌ Some tests failed'}
`;
}

export { runTestsWithMonitoring, generateReport, TestMetrics }; 