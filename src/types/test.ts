export interface TestResult {
  file: string;
  status: 'passed' | 'failed';
  duration: number;
  timestamp: number;
  error?: string;
} 