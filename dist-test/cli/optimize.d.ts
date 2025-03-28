import { BleuConfig } from '../types';
interface OptimizeOptions {
    path: string;
    recursive: boolean;
    output: string;
    config: BleuConfig;
}
export declare function optimize(options: OptimizeOptions): Promise<void>;
export declare function optimizeCode(options: OptimizeOptions): Promise<void>;
export {};
//# sourceMappingURL=optimize.d.ts.map