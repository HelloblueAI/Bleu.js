interface AudioFeatures {
    transcription: {
        text: string;
        confidence: number;
        segments: Array<{
            text: string;
            start: number;
            end: number;
            confidence: number;
            speaker?: string;
        }>;
        language: string;
        dialect: string;
        accents: string[];
    };
    sentiment: {
        overall: {
            label: string;
            score: number;
            confidence: number;
        };
        aspects: Array<{
            aspect: string;
            label: string;
            score: number;
            confidence: number;
        }>;
        emotions: {
            [key: string]: number;
        };
        intensity: number;
        subjectivity: number;
    };
    entities: Array<{
        text: string;
        type: string;
        start: number;
        end: number;
        confidence: number;
        metadata: {
            wikipedia?: string;
            description?: string;
            attributes?: Record<string, any>;
        };
    }>;
    topics: Array<{
        label: string;
        score: number;
        confidence: number;
        keywords: string[];
        subtopics: string[];
    }>;
    audio: {
        quality: {
            noise: number;
            clarity: number;
            volume: number;
            distortion: number;
            compression: number;
            bandwidth: number;
            dynamicRange: number;
        };
        characteristics: {
            duration: number;
            sampleRate: number;
            channels: number;
            bitDepth: number;
            format: string;
            codec: string;
        };
        analysis: {
            tempo: number;
            pitch: number;
            rhythm: number;
            harmony: number;
            timbre: number;
            energy: number;
            spectral: {
                centroid: number;
                rolloff: number;
                flux: number;
                flatness: number;
            };
        };
    };
    speakers: Array<{
        id: string;
        confidence: number;
        segments: Array<{
            start: number;
            end: number;
            confidence: number;
        }>;
        characteristics: {
            gender: string;
            age: number;
            accent: string;
            emotion: string;
            confidence: number;
        };
    }>;
    security: {
        watermark: boolean;
        tampering: boolean;
        authenticity: number;
        encryption: {
            type: string;
            strength: number;
        };
        compliance: {
            gdpr: boolean;
            hipaa: boolean;
            pci: boolean;
        };
    };
    metadata: {
        duration: number;
        size: number;
        format: string;
        bitrate: number;
        channels: number;
        sampleRate: number;
        timestamp: string;
        location?: {
            latitude: number;
            longitude: number;
            accuracy: number;
        };
        device?: {
            manufacturer: string;
            model: string;
            os: string;
        };
    };
}
export declare class AudioProcessor {
    private config;
    private models;
    private hf;
    private quantumEnhancer;
    private securityManager;
    private performanceOptimizer;
    private visualizer;
    private metrics;
    private distributedProcessor;
    constructor(config: AudioProcessorConfig);
    initialize(): Promise<void>;
    private initializeModels;
    process(audioBuffer: Buffer): Promise<AudioFeatures>;
    private transcribeAudio;
    private analyzeSentiment;
    private analyzeAudioQuality;
    private generateVisualizations;
    private getModelVersions;
    private getFeatureCounts;
    extractFeatures(audioBuffer: Buffer): Promise<number[]>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=audio.d.ts.map