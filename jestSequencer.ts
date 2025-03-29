import type { Test, TestContext } from '@jest/test-result';
import { createLogger } from './src/utils/logger.ts';

interface TestHistory {
  path: string;
  duration: number;
  status: 'passed' | 'failed';
  timestamp: number;
}

interface TestStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  averageDuration: number;
}

class CustomSequencer {
  private readonly logger = createLogger('CustomSequencer');
  private testHistory: TestHistory[] = [];
  private stats: TestStats = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    totalDuration: 0,
    averageDuration: 0
  };

  constructor() {
    this.loadTestHistory();
  }

  private loadTestHistory(): void {
    try {
      const history = process.env.TEST_HISTORY;
      if (history) {
        this.testHistory = JSON.parse(history);
      }
    } catch (error) {
      this.logger.error('Failed to load test history:', error);
    }
  }

  private saveTestHistory(): void {
    try {
      process.env.TEST_HISTORY = JSON.stringify(this.testHistory);
    } catch (error) {
      this.logger.error('Failed to save test history:', error);
    }
  }

  private updateStats(test: Test): void {
    this.stats.totalTests++;
    if (test.status === 'passed') {
      this.stats.passedTests++;
    } else if (test.status === 'failed') {
      this.stats.failedTests++;
    }
    this.stats.totalDuration += test.duration || 0;
    this.stats.averageDuration = this.stats.totalDuration / this.stats.totalTests;
  }

  private getTestPriority(test: Test): number {
    const history = this.testHistory.find(h => h.path === test.path);
    if (!history) return 0;

    const timeSinceLastRun = Date.now() - history.timestamp;
    const timeWeight = Math.exp(-timeSinceLastRun / (24 * 60 * 60 * 1000)); // 24 hours decay
    const statusWeight = history.status === 'failed' ? 2 : 1;
    const durationWeight = history.duration / this.stats.averageDuration;

    return timeWeight * statusWeight * durationWeight;
  }

  async sort(tests: Test[], context: TestContext): Promise<Test[]> {
    this.logger.info('Sorting tests...');
    
    // Update stats from previous runs
    tests.forEach(test => this.updateStats(test));

    // Sort tests by priority
    const sortedTests = [...tests].sort((a, b) => {
      const priorityA = this.getTestPriority(a);
      const priorityB = this.getTestPriority(b);
      return priorityB - priorityA;
    });

    // Update history
    sortedTests.forEach(test => {
      const history: TestHistory = {
        path: test.path,
        duration: test.duration || 0,
        status: test.status as 'passed' | 'failed',
        timestamp: Date.now()
      };
      this.testHistory.push(history);
    });

    // Save updated history
    this.saveTestHistory();

    this.logger.info('Test sorting completed', {
      totalTests: this.stats.totalTests,
      passedTests: this.stats.passedTests,
      failedTests: this.stats.failedTests,
      averageDuration: this.stats.averageDuration
    });

    return sortedTests;
  }
}

export default CustomSequencer; 