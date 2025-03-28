interface ImageFeatures {
    objects: Array<{
        label: string;
        confidence: number;
        bbox: [number, number, number, number];
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
    scenes: Array<{
        label: string;
        confidence: number;
        attributes: {
            lighting: string;
            weather: string;
            timeOfDay: string;
            season: string;
        };
        objects: string[];
        activities: string[];
    }>;
    faces: Array<{
        bbox: [number, number, number, number];
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
    colors: Array<{
        hex: string;
        rgb: [number, number, number];
        percentage: number;
        name: string;
        harmony: string[];
    }>;
    quality: {
        sharpness: number;
        brightness: number;
        contrast: number;
        noise: number;
        compression: number;
        artifacts: number;
        resolution: number;
        dynamicRange: number;
    };
    metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
        dpi: number;
        exif: any;
        security: {
            watermark: boolean;
            tampering: boolean;
            authenticity: number;
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
        content: {
            nsfw: number;
            violence: number;
            hate: number;
            spam: number;
        };
    };
}
export interface ImageProcessorConfig {
    modelPath: string;
    maxImageSize: number;
    channels: number;
}
export declare class ImageProcessor {
    private config;
    private models;
    private hf;
    private quantumEnhancer;
    private securityManager;
    private performanceOptimizer;
    private visualizer;
    private metrics;
    private distributedProcessor;
    constructor(config: ImageProcessorConfig);
    initialize(): Promise<void>;
    private initializeModels;
    process(imageBuffer: Buffer): Promise<ImageFeatures>;
    private detectObjects;
    private recognizeScenes;
    private detectAndAnalyzeFaces;
    private extractColors;
    private assessQuality;
    private extractMetadata;
    private getClassName;
    private getSceneName;
    private getLightingName;
    private getWeatherName;
    private getTimeOfDayName;
    private getSeasonName;
    private rgbToHex;
    private detectImageFormat;
    private calculateDPI;
    private extractExifData;
    private getAttributeName;
    private getColorName;
    private getColorHarmony;
    private analyzeComposition;
    private analyzeContent;
    private analyzeAttributes;
    private detectRelationships;
    private analyzeSecurity;
    private analyzeAesthetics;
    private generateVisualizations;
    private getModelVersions;
    private getFeatureCounts;
    extractFeatures(imageBuffer: Buffer): Promise<number[]>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=image.d.ts.map