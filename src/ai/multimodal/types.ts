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

export interface FaceAnalysisResult {
  faces: Array<{
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks: Array<{
      x: number;
      y: number;
      type: 'eye' | 'nose' | 'mouth' | 'jaw';
    }>;
    expressions: {
      neutral: number;
      happy: number;
      sad: number;
      angry: number;
      fearful: number;
      disgusted: number;
      surprised: number;
    };
    gender: 'male' | 'female' | 'unknown';
    age: number;
    confidence: number;
  }>;
  totalFaces: number;
  dominantEmotion: string;
  averageAge: number;
}

export interface SceneAnalysisResult {
  objects: Array<{
    label: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  scene: {
    category: string;
    confidence: number;
    description: string;
  };
  environment: {
    lighting: 'bright' | 'dim' | 'normal';
    indoor: boolean;
    timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk';
  };
  dominantColors: Array<{
    color: string;
    percentage: number;
  }>;
}

export interface VoiceAnalysisResult {
  transcription: string;
  confidence: number;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    neutral: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  speaker: {
    gender: 'male' | 'female' | 'unknown';
    age: number;
    confidence: number;
  };
  audio: {
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
  };
  metadata: {
    language: string;
    dialect?: string;
    isBackgroundNoise: boolean;
    noiseLevel: 'low' | 'medium' | 'high';
  };
}

export interface MultimodalConfig {
  faceRecognition: {
    enabled: boolean;
    model: 'face-api' | 'tensorflow';
    confidenceThreshold: number;
    maxFaces: number;
  };
  sceneRecognition: {
    enabled: boolean;
    model: 'resnet' | 'efficientnet';
    confidenceThreshold: number;
    detectObjects: boolean;
  };
  voiceRecognition: {
    enabled: boolean;
    model: 'web-speech' | 'custom';
    confidenceThreshold: number;
    language: string;
    continuous: boolean;
  };
} 