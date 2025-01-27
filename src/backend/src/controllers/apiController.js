import { post } from 'axios'; 
import AiQuery from '../models/AiQuery';


const callAIModel = async (query) => {
  try {
    const response = {
      data: {
        choices: [
          {
            text: `Mock response for query: "${query}"`,
          },
        ],
      },
    };
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error calling custom AI model:', error);
    return null;
  }
};

export const predict = async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await callAIModel(query);
    if (!response) {
      return res
        .status(500)
        .json({ error: 'Failed to get a response from the AI model' });
    }

    const modelUsed = 'Custom AI Model';
    const aiQuery = new AiQuery({
      query,
      response,
      modelUsed,
      confidence: 0.95, // Adjust confidence level as needed
    });

    const savedQuery = await aiQuery.save();
    console.log('Query saved successfully:', savedQuery);

    return res.status(200).json({
      message: 'Prediction successful!',
      response,
      savedQuery,
    });
  } catch (err) {
    console.error('Error during prediction process:', err);
    return res.status(500).json({ error: 'Prediction failed' });
  }
};

export const getData = (req, res) => {
  res.json({ message: 'Hello, this is your data!' });
};

export const processData = (req, res) => {
  res.json({ message: 'Process data endpoint is not yet implemented.' });
};

export const getProcessedData = (req, res) => {
  res.json({ message: 'Get processed data endpoint is not yet implemented.' });
};

export const trainModel = (req, res) => {
  res.json({ message: 'Train model endpoint is not yet implemented.' });
};

export const getTrainModelStatus = (req, res) => {
  res.json({
    message: 'Get train model status endpoint is not yet implemented.',
  });
};

export const uploadDataset = (req, res) => {
  res.json({ message: 'Upload dataset endpoint is not yet implemented.' });
};

export const getRules = (req, res) => {
  res.json({ message: 'Get rules endpoint is not yet implemented.' });
};

export const addRule = (req, res) => {
  res.json({ message: 'Add rule endpoint is not yet implemented.' });
};

export const updateRule = (req, res) => {
  res.json({ message: 'Update rule endpoint is not yet implemented.' });
};

export const deleteRule = (req, res) => {
  res.json({ message: 'Delete rule endpoint is not yet implemented.' });
};

export const evaluateRule = (req, res) => {
  res.json({ message: 'Evaluate rule endpoint is not yet implemented.' });
};

export const generateEgg = (req, res) => {
  const { type, options } = req.body;
  try {
    const egg = {
      id: 1,
      description: `Model ${options.modelName} with fields ${options.fields
        .map((f) => f.name)
        .join(', ')}`,
      type,
      code: `class ${options.modelName} {\n  ${options.fields
        .map((f) => `${f.name}: ${f.type};`)
        .join('\n  ')}\n}`,
    };
    res.status(200).json(egg);
  } catch (error) {
    console.error('Error generating egg:', error);
    res.status(500).json({ error: error.message });
  }
};

export const monitorDependencies = (req, res) => {
  try {
    const dependencies = [
      { name: 'express', version: '4.19.2', latest: '4.19.2' },
      { name: 'mongoose', version: '7.6.13', latest: '7.6.14' },
      { name: 'dotenv', version: '16.4.5', latest: '16.4.5' },
    ];
    const outdated = dependencies.filter((dep) => dep.version !== dep.latest);
    res.status(200).json({ dependencies, outdated });
  } catch (error) {
    console.error('Error monitoring dependencies:', error);
    res.status(500).json({ error: 'Error monitoring dependencies' });
  }
};

export const resolveConflicts = (req, res) => {
  try {
    const resolved = [
      { name: 'express', resolvedVersion: '4.19.2' },
      { name: 'lodash', resolvedVersion: '4.17.21' },
    ];
    const conflicts = [
      { name: 'express', versions: ['4.19.2', '4.17.1'] },
      { name: 'lodash', versions: ['4.17.21', '4.17.20'] },
    ];
    res.status(200).json({ resolved, conflicts });
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    res.status(500).json({ error: 'Error resolving conflicts' });
  }
};

export const debug = (req, res) => {
  res.status(200).json({ message: 'Debug endpoint is not yet implemented.' });
};

export const invalidRoute = (req, res) => {
  res.status(404).send({ error: 'Invalid route' });
};

// Export the controller functions as default for backward compatibility
export default {
  getData,
  predict,
  processData,
  getProcessedData,
  trainModel,
  getTrainModelStatus,
  uploadDataset,
  getRules,
  addRule,
  updateRule,
  deleteRule,
  evaluateRule,
  generateEgg,
  monitorDependencies,
  resolveConflicts,
  debug,
  invalidRoute,
};
