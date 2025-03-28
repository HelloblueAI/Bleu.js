export interface MultiModalConfig {
    models: {
        text: string;
        code: string;
        image: string;
        audio: string;
        video: string;
    };
    fusionStrategy: 'simple' | 'attention' | 'quantum-enhanced';
    modelVersion: string;
    modelType: 'quantum' | 'classic' | 'hybrid';
    optimizationLevel: 'speed' | 'accuracy' | 'balanced';
    company: {
        name: string;
        version: string;
        modelRegistry: string;
    };
}
export interface MultiModalInput {
    text?: string;
    code?: string;
    image?: any;
    audio?: any;
    video?: any;
}
export interface ModalityFeatures {
    text?: number[];
    code?: number[];
    image?: number[];
    audio?: number[];
    video?: number[];
}
export interface ProcessedResult {
    text?: string;
    code?: string;
    image?: {
        objects: any[];
        scenes: any[];
        faces: any[];
        colors: any[];
        quality: any;
        metadata: any;
    };
    audio?: {
        transcription: string;
        sentiment: string;
        entities: any[];
        topics: any[];
    };
    video?: {
        scenes: any[];
        objects: any[];
        actions: any[];
        audio: any;
        transcription: string;
    };
    features: ModalityFeatures;
    fusion: {
        confidence: number;
        relevance: number;
        coherence: number;
    };
    metadata: {
        modalities: string[];
        processingTime: number;
        modelVersion: string;
    };
}
//# sourceMappingURL=types.d.ts.map