import { BleuClient } from '../src/core/bleuClient.js';
import { XGBoostModel } from '../src/ml/models/xgboost/xgboostModel.js';
import { LLaMAModel } from '../src/ml/models/foundation/llama.js';
import { NLPService } from '../src/ai/nlp/nlpService.js';
import { VisionService } from '../src/ai/vision/visionService.js';
import { SpeechService } from '../src/ai/speech/speechService.js';

// Initialize the Bleu.js client
const client = new BleuClient({
  apiKey: process.env.BLEUJS_API_KEY,
  plan: 'enterprise',
});

async function demonstrateFeatures() {
  try {
    console.log('🚀 Starting Bleu.js Feature Demonstration\n');

    // 1. AI Text Generation
    console.log('1️⃣ AI Text Generation');
    const aiResponse = await client.generateText(
      'Write a story about a robot learning to paint',
      { maxTokens: 100, temperature: 0.7 }
    );
    console.log('AI Response:', aiResponse);

    // 2. NLP Features
    console.log('\n2️⃣ Natural Language Processing');
    const nlpService = new NLPService();
    const sentiment = await nlpService.analyzeSentiment('I love this amazing product!');
    const classification = await nlpService.classifyText('This is a technical document about AI.');
    console.log('Sentiment Analysis:', sentiment);
    console.log('Text Classification:', classification);

    // 3. Computer Vision
    console.log('\n3️⃣ Computer Vision');
    const visionService = new VisionService();
    const imageAnalysis = await visionService.analyzeImage('path/to/image.jpg');
    console.log('Image Analysis:', imageAnalysis);

    // 4. Speech Recognition
    console.log('\n4️⃣ Speech Recognition');
    const speechService = new SpeechService();
    const transcription = await speechService.transcribeAudio('path/to/audio.wav');
    console.log('Speech Transcription:', transcription);

    // 5. XGBoost Model
    console.log('\n5️⃣ XGBoost Model');
    const xgboostModel = new XGBoostModel();
    const prediction = await xgboostModel.predict([0.5, 0.3, 0.8, 1.2, 0.7]);
    console.log('XGBoost Prediction:', prediction);

    // 6. LLaMA Model
    console.log('\n6️⃣ LLaMA Model');
    const llamaModel = new LLaMAModel();
    const llamaResponse = await llamaModel.generate('Explain quantum computing in simple terms');
    console.log('LLaMA Response:', llamaResponse);

    // 7. Code Generation
    console.log('\n7️⃣ Code Generation');
    const generatedCode = await client.generateCode({
      type: 'model',
      parameters: {
        name: 'UserModel',
        methods: ['validate', 'save', 'update']
      }
    });
    console.log('Generated Code:', generatedCode);

    // 8. Usage Statistics
    console.log('\n8️⃣ Usage Statistics');
    const usage = await client.getUsageStats();
    console.log('Usage Stats:', usage);

    // 9. Enterprise Features
    if (client.plan === 'enterprise') {
      console.log('\n9️⃣ Enterprise Features');
      const customModel = await client.trainCustomModel(
        { /* training data */ },
        {
          modelType: 'text-generation',
          epochs: 10,
          batchSize: 32
        }
      );
      console.log('Custom Model Training:', customModel);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demonstration
demonstrateFeatures(); 