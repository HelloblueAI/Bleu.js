const modelName = config.modelName ?? 'default-model';
const apiKey = config.apiKey ?? process.env.HUGGINGFACE_API_KEY ?? '';
const maxLength = config.maxLength ?? 100;
const temperature = config.temperature ?? 0.7; 