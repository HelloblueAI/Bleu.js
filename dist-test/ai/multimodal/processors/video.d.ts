export interface VideoProcessorConfig {
    modelPath: string;
    maxFrames: number;
    frameRate: number;
    modelVersion: string;
    modelType: 'quantum' | 'classic' | 'hybrid';
    optimizationLevel: 'speed' | 'accuracy' | 'balanced';
}
interface VideoFeatures {
    scenes: Array<{
        start: number;
        end: number;
        confidence: number;
        type: string;
        attributes: {
            lighting: string;
            weather: string;
            timeOfDay: string;
            season: string;
            location: string;
            indoor: boolean;
            crowded: boolean;
            quality: number;
        };
        objects: Array<{
            label: string;
            confidence: number;
            bbox: [number, number, number, number];
            trackingId: string;
            attributes: {
                color: string;
                material: string;
                state: string;
                pose: string;
            };
            relationships: Array<{
                target: string;
                type: string;
                confidence: number;
            }>;
        }>;
        activities: Array<{
            label: string;
            confidence: number;
            participants: string[];
            duration: number;
            attributes: {
                intensity: number;
                direction: string;
                speed: number;
            };
        }>;
        faces: Array<{
            bbox: [number, number, number, number];
            trackingId: string;
            landmarks: {
                eyes: [number, number][];
                nose: [number, number];
                mouth: [number, number][];
                eyebrows: [number, number][];
                jawline: [number, number][];
            };
            emotions: {
                [key: string]: number;
            };
            age: number;
            gender: string;
            ethnicity: string;
            pose: {
                yaw: number;
                pitch: number;
                roll: number;
            };
            quality: {
                blur: number;
                noise: number;
                exposure: number;
            };
            attributes: {
                glasses: boolean;
                mask: boolean;
                beard: boolean;
                expression: string;
            };
            identity?: {
                id: string;
                confidence: number;
                metadata: any;
            };
        }>;
        audio: {
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
            };
            quality: {
                noise: number;
                clarity: number;
                volume: number;
                distortion: number;
            };
        };
    }>;
    metadata: {
        duration: number;
        size: number;
        format: string;
        resolution: {
            width: number;
            height: number;
            aspectRatio: string;
        };
        fps: number;
        bitrate: number;
        codec: {
            video: string;
            audio: string;
        };
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
    quality: {
        video: {
            sharpness: number;
            brightness: number;
            contrast: number;
            noise: number;
            compression: number;
            artifacts: number;
            resolution: number;
            dynamicRange: number;
            stability: number;
            focus: number;
        };
        audio: {
            noise: number;
            clarity: number;
            volume: number;
            distortion: number;
            compression: number;
            bandwidth: number;
            dynamicRange: number;
        };
        sync: {
            audioVideo: number;
            stability: number;
            drift: number;
        };
    };
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
        content: {
            nsfw: number;
            violence: number;
            hate: number;
            spam: number;
        };
    };
    analysis: {
        composition: {
            ruleOfThirds: number;
            goldenRatio: number;
            symmetry: number;
            balance: number;
        };
        aesthetics: {
            score: number;
            style: string;
            mood: string;
            artistic: boolean;
        };
        narrative: {
            structure: string;
            pacing: number;
            engagement: number;
            climax: number;
        };
    };
}
export declare class VideoProcessor {
    private config;
    private models;
    private quantumEnhancer;
    private securityManager;
    private performanceOptimizer;
    private visualizer;
    private metrics;
    private distributedProcessor;
    constructor(config: VideoProcessorConfig);
    initialize(): Promise<void>;
    private initializeModels;
    process(videoBuffer: Buffer): Promise<VideoFeatures>;
    private detectScenes;
    private analyzeQuality;
    private generateVisualizations;
    private getModelVersions;
    private getFeatureCounts;
    extractFeatures(videoBuffer: Buffer): Promise<number[]>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=video.d.ts.map