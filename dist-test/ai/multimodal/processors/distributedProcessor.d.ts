export declare class DistributedProcessor {
    private initialized;
    initialize(): Promise<void>;
    processParallel<T>(tasks: Promise<T>[]): Promise<T[]>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=distributedProcessor.d.ts.map