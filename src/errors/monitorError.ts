export class MonitorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MonitorError';
  }
} 