import winston from 'winston';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export declare function createLogger(level?: LogLevel): winston.Logger;
export declare const logger: winston.Logger;
//# sourceMappingURL=logger.d.ts.map