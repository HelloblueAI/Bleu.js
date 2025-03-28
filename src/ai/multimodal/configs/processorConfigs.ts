export interface BaseProcessorConfig {
  modelPath: string;
  modelVersion: string;
  modelType: 'quantum' | 'classic' | 'hybrid';
  optimizationLevel: 'speed' | 'accuracy' | 'balanced';
  company: {
    name: string;
    version: string;
    modelRegistry: string;
  };
}

export interface TextProcessorConfig extends BaseProcessorConfig {
  maxSequenceLength: number;
  vocabularySize: number;
}

export interface CodeProcessorConfig extends BaseProcessorConfig {
  maxSequenceLength: number;
  vocabularySize: number;
  languageSupport: string[];
}

export interface ImageProcessorConfig extends BaseProcessorConfig {
  maxImageSize: number;
  channels: number;
  detectionThreshold: number;
}

export interface AudioProcessorConfig extends BaseProcessorConfig {
  sampleRate: number;
  maxDuration: number;
  audioFormat: string;
}

export interface VideoProcessorConfig extends BaseProcessorConfig {
  maxFrames: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
} 