export declare class SecurityManager {
    private initialized;
    initialize(): Promise<void>;
    analyzeVideo(videoBuffer: Buffer): Promise<{
        isSafe: boolean;
        reason?: string;
    }>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=securityManager.d.ts.map