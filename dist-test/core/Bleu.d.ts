import { BleuConfig } from '../types/config';
export declare class Bleu {
    private app;
    private config;
    private logger;
    private server;
    private model;
    constructor(config?: Partial<BleuConfig>);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=Bleu.d.ts.map