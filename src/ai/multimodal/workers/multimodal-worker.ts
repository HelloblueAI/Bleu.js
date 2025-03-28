import { BleuMultimodalAPI } from '../api';
import { 
  FaceAnalysisResult, 
  SceneAnalysisResult, 
  VoiceAnalysisResult,
  MultimodalConfig
} from '../types';

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
  console.error('Failed to initialize API in worker:', error);
});

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    let result;

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
    // Send error back to main thread
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};

// Process image data
async function processImage(imageData: ImageData | HTMLImageElement | HTMLVideoElement) {
  const [faceAnalysis, sceneAnalysis] = await Promise.all([
    api.analyzeFaces(imageData),
    api.analyzeScene(imageData)
  ]);

  return {
    faceAnalysis,
    sceneAnalysis
  };
}

// Process audio data
async function processAudio(audioData: ArrayBuffer | AudioBuffer) {
  const voiceAnalysis = await api.analyzeVoice(audioData);
  return voiceAnalysis;
}

// Process video data
async function processVideo(videoElement: HTMLVideoElement) {
  const frameAnalysis = await api.process({
    image: videoElement
  });

  return frameAnalysis;
}

// Process multimodal data
async function processMultimodal(data: {
  image?: ImageData | HTMLImageElement | HTMLVideoElement;
  audio?: ArrayBuffer | AudioBuffer;
  text?: string;
  code?: string;
  video?: HTMLVideoElement;
}) {
  const result = await api.process(data);
  return result;
}

// Update configuration
async function updateConfig(newConfig: Partial<MultimodalConfig>) {
  api.updateConfig(newConfig);
  return api.getConfig();
}

// Handle errors
self.onerror = (error) => {
  console.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error.message
  });
};

// Handle unhandled promise rejections
self.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  self.postMessage({
    type: 'error',
    error: event.reason.message
  });
}; 