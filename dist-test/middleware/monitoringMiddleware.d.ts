import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';
declare const performanceMonitor: PerformanceMonitor;
export declare function monitoringMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function metricsEndpoint(): (req: Request, res: Response) => Promise<void>;
export declare function prometheusMetricsEndpoint(): (req: Request, res: Response) => Promise<void>;
export { performanceMonitor };
//# sourceMappingURL=monitoringMiddleware.d.ts.map