"use strict";
const { run } = require('jest');
const { logger } = require('../../../../utils/logger');
const fs = require('fs');
const path = require('path');
async function runTestsWithMonitoring() {
    const startTime = Date.now();
    const metrics = {
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
        const quantumStateResults = results.testResults[0].testResults
            .filter(test => test.title.includes('quantum state'))
            .map(test => test.status === 'passed' ? 1 : 0);
        metrics.quantumState = {
            coherence: quantumStateResults[0] || 0,
            entanglement: quantumStateResults[1] || 0,
            amplitude: quantumStateResults[2] || 0,
            phase: quantumStateResults[3] || 0
        };
        // Collect performance metrics
        const performanceResults = results.testResults[0].testResults
            .filter(test => test.title.includes('performance'))
            .map(test => test.status === 'passed' ? 1 : 0);
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
    }
    catch (error) {
        logger.error('❌ Error during test monitoring:', error);
        throw error;
    }
}
function generateReport(metrics) {
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
// Run the monitoring
runTestsWithMonitoring().catch(error => {
    logger.error('❌ Monitoring failed:', error);
    process.exit(1);
});
//# sourceMappingURL=monitor.js.map