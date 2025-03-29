import { BleuMultimodalAPI } from '../api';
import { MultimodalConfig, ProcessedResult } from '../types';
import { Worker } from 'worker_threads';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('MultimodalWorker');

// Initialize the API in the worker
const api = new BleuMultimodalAPI({
  faceRecognition: {
    enabled: true,
    model: 'face-api',
    confidenceThreshold: 0.8,
    maxFaces: 20
  },
  sceneRecognition: {
    enabled: true,
    model: 'resnet',
    confidenceThreshold: 0.85,
    detectObjects: true
  },
  voiceRecognition: {
    enabled: true,
    model: 'custom',
    confidenceThreshold: 0.9,
    language: 'en-US',
    continuous: true
  }
});

// Initialize the API
api.initialize().catch(error => {
  logger.error('Failed to initialize API in worker:', error);
});

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    let result: ProcessedResult;

    switch (type) {
      case 'processImage':
        result = await processImage(data);
        break;

      case 'processAudio':
        result = await processAudio(data);
        break;

      case 'processVideo':
        result = await processVideo(data);
        break;

      case 'processMultimodal':
        result = await processMultimodal(data);
        break;

      case 'updateConfig':
        result = await updateConfig(data);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send result back to main thread
    self.postMessage({
      type,
      data: result
    });
  } catch (error) {
    logger.error(`Error processing ${type}:`, error);
    // Send error back to main thread
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Process image data
async function processImage(imageData: ImageData | HTMLImageElement | HTMLVideoElement): Promise<ProcessedResult> {
  const [faceAnalysis, sceneAnalysis] = await Promise.all([
    api.analyzeFaces(imageData),
    api.analyzeScene(imageData)
  ]);

  return {
    features: {
      face: faceAnalysis,
      scene: sceneAnalysis
    },
    fusionMetrics: {
      confidence: Math.min(faceAnalysis.confidence, sceneAnalysis.confidence),
      coherence: 1.0
    },
    metadata: {
      timestamp: Date.now(),
      modality: 'image'
    }
  };
}

// Process audio data
async function processAudio(audioData: ArrayBuffer | AudioBuffer): Promise<ProcessedResult> {
  const voiceAnalysis = await api.analyzeVoice(audioData);
  
  return {
    features: {
      voice: voiceAnalysis
    },
    fusionMetrics: {
      confidence: voiceAnalysis.confidence,
      coherence: 1.0
    },
    metadata: {
      timestamp: Date.now(),
      modality: 'audio'
    }
  };
}

// Process video data
async function processVideo(videoElement: HTMLVideoElement): Promise<ProcessedResult> {
  const frameAnalysis = await api.process({
    image: videoElement
  });

  return {
    ...frameAnalysis,
    metadata: {
      ...frameAnalysis.metadata,
      modality: 'video'
    }
  };
}

// Process multimodal data
async function processMultimodal(data: {
  image?: ImageData | HTMLImageElement | HTMLVideoElement;
  audio?: ArrayBuffer | AudioBuffer;
  text?: string;
  code?: string;
  video?: HTMLVideoElement;
}): Promise<ProcessedResult> {
  const result = await api.process(data);
  return result;
}

// Update configuration
async function updateConfig(newConfig: Partial<MultimodalConfig>): Promise<ProcessedResult> {
  await api.updateConfig(newConfig);
  const config = api.getConfig();
  
  return {
    features: {},
    fusionMetrics: {
      confidence: 1.0,
      coherence: 1.0
    },
    metadata: {
      timestamp: Date.now(),
      modality: 'config',
      config
    }
  };
}

// Handle errors
self.onerror = (error) => {
  logger.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  });
};

// Handle unhandled promise rejections
self.onunhandledrejection = (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
  self.postMessage({
    type: 'error',
    error: event.reason instanceof Error ? event.reason.message : 'Unknown error occurred'
  });
}; 