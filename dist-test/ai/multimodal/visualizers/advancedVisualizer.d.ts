export declare class AdvancedVisualizer {
    private initialized;
    initialize(): Promise<void>;
    plotSceneDetection(scenes: any[]): Promise<void>;
    plotObjectTracking(objects: any[]): Promise<void>;
    plotFaceTracking(faces: any[]): Promise<void>;
    plotActivityTimeline(activities: any[]): Promise<void>;
    plotAudioAnalysis(audio: any): Promise<void>;
    plotQualityMetrics(quality: any): Promise<void>;
    plotSecurityAnalysis(security: any): Promise<void>;
    plotAestheticAnalysis(aesthetics: any): Promise<void>;
    plotNarrativeAnalysis(narrative: any): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=advancedVisualizer.d.ts.map