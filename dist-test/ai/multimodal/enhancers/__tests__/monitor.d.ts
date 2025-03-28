declare const run: any;
declare const logger: any;
declare const fs: any;
declare const path: any;
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
declare function runTestsWithMonitoring(): Promise<void>;
declare function generateReport(metrics: TestMetrics): string;
//# sourceMappingURL=monitor.d.ts.map