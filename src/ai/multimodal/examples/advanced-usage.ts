import { BleuMultimodalAPI } from '../api';
import { MultimodalConfig } from '../types';

// Example of advanced multimodal processing with Bleu.js
async function advancedMultimodalExample() {
  // Initialize the API with custom configuration
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

  try {
    // Initialize the API
    await api.initialize();

    // Example 1: Advanced Face Recognition
    const imageElement = document.getElementById('input-image') as HTMLImageElement;
    const faceAnalysis = await api.analyzeFaces(imageElement);
    
    console.log('Face Analysis Results:', {
      totalFaces: faceAnalysis.totalFaces,
      dominantEmotion: faceAnalysis.dominantEmotion,
      averageAge: faceAnalysis.averageAge,
      faces: faceAnalysis.faces.map(face => ({
        gender: face.gender,
        age: face.age,
        confidence: face.confidence,
        emotions: face.expressions
      }))
    });

    // Example 2: Advanced Scene Recognition
    const sceneAnalysis = await api.analyzeScene(imageElement);
    
    console.log('Scene Analysis Results:', {
      category: sceneAnalysis.scene.category,
      confidence: sceneAnalysis.scene.confidence,
      description: sceneAnalysis.scene.description,
      environment: sceneAnalysis.environment,
      objects: sceneAnalysis.objects.map(obj => ({
        label: obj.label,
        confidence: obj.confidence,
        position: obj.boundingBox
      }))
    });

    // Example 3: Advanced Voice Recognition
    const audioElement = document.getElementById('input-audio') as HTMLAudioElement;
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(await audioElement.arrayBuffer());
    const voiceAnalysis = await api.analyzeVoice(audioBuffer);
    
    console.log('Voice Analysis Results:', {
      transcription: voiceAnalysis.transcription,
      confidence: voiceAnalysis.confidence,
      emotions: voiceAnalysis.emotions,
      speaker: {
        gender: voiceAnalysis.speaker.gender,
        age: voiceAnalysis.speaker.age,
        confidence: voiceAnalysis.speaker.confidence
      },
      audio: voiceAnalysis.audio,
      metadata: voiceAnalysis.metadata
    });

    // Example 4: Multimodal Processing
    const multimodalInput = {
      image: imageElement,
      audio: audioBuffer,
      text: 'Sample text for analysis',
      code: 'function example() { return true; }',
      video: document.getElementById('input-video') as HTMLVideoElement
    };

    const multimodalResults = await api.process(multimodalInput);
    
    console.log('Multimodal Processing Results:', {
      modalities: multimodalResults.metadata.modalities,
      processingTime: multimodalResults.metadata.processingTime,
      fusion: multimodalResults.fusion,
      features: multimodalResults.features
    });

    // Example 5: Real-time Processing
    const videoElement = document.getElementById('input-video') as HTMLVideoElement;
    videoElement.addEventListener('play', async () => {
      const processFrame = async () => {
        if (!videoElement.paused && !videoElement.ended) {
          // Process current frame
          const frameAnalysis = await api.process({
            image: videoElement
          });
          
          console.log('Frame Analysis:', frameAnalysis);
          
          // Continue processing next frame
          requestAnimationFrame(processFrame);
        }
      };
      
      processFrame();
    });

    // Example 6: Configuration Management
    const currentConfig = api.getConfig();
    console.log('Current Configuration:', currentConfig);

    // Update configuration
    api.updateConfig({
      faceRecognition: {
        ...currentConfig.faceRecognition,
        confidenceThreshold: 0.9
      }
    });

  } catch (error) {
    console.error('Error in multimodal processing:', error);
  } finally {
    // Clean up resources
    await api.dispose();
  }
}

// Example of using the API with Web Workers for better performance
async function webWorkerExample() {
  const api = new BleuMultimodalAPI();
  await api.initialize();

  // Create a Web Worker for processing
  const worker = new Worker('multimodal-worker.ts');
  
  worker.onmessage = async (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'faceAnalysis':
        console.log('Face Analysis from Worker:', data);
        break;
      case 'sceneAnalysis':
        console.log('Scene Analysis from Worker:', data);
        break;
      case 'voiceAnalysis':
        console.log('Voice Analysis from Worker:', data);
        break;
    }
  };

  // Send data to worker for processing
  const imageElement = document.getElementById('input-image') as HTMLImageElement;
  worker.postMessage({
    type: 'processImage',
    data: imageElement
  });

  const audioElement = document.getElementById('input-audio') as HTMLAudioElement;
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(await audioElement.arrayBuffer());
  worker.postMessage({
    type: 'processAudio',
    data: audioBuffer
  });
}

// Example of using the API with streaming data
async function streamingExample() {
  const api = new BleuMultimodalAPI();
  await api.initialize();

  // Process streaming video
  const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const videoElement = document.createElement('video');
  videoElement.srcObject = videoStream;
  
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play();
  });

  // Process each frame
  videoElement.addEventListener('play', async () => {
    const processFrame = async () => {
      if (!videoElement.paused && !videoElement.ended) {
        const frameAnalysis = await api.process({
          image: videoElement
        });
        
        console.log('Streaming Frame Analysis:', frameAnalysis);
        requestAnimationFrame(processFrame);
      }
    };
    
    processFrame();
  });

  // Process streaming audio
  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(audioStream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  
  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = async (event) => {
    const audioData = event.inputBuffer.getChannelData(0);
    const analysis = await api.process({
      audio: audioData
    });
    
    console.log('Streaming Audio Analysis:', analysis);
  };
}

// Export examples for use in documentation
export {
  advancedMultimodalExample,
  webWorkerExample,
  streamingExample
}; 