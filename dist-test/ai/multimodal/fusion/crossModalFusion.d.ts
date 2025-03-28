import { ModalityFeatures } from '../types';
export declare class CrossModalFusion {
    initialize(): Promise<void>;
    fuse(features: ModalityFeatures): Promise<{
        confidence: number;
        relevance: number;
        coherence: number;
    }>;
    dispose(): void;
}
//# sourceMappingURL=crossModalFusion.d.ts.map