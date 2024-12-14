import axios from 'axios';

import AiQuery from '../models/AiQuery.js';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    'OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables.',
  );
  process.exit(1);
}

// Helper function to call OpenAI Model
const callAIModel = async (query) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: query,
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error(
      'Error calling AI model:',
      error.response?.data || error.message,
    );
    return null;
  }
};

// Helper function to save AI query response
const saveAIQuery = async (query, response, modelUsed, confidence = 0.98) => {
  try {
    const aiQuery = new AiQuery({
      query,
      response,
      modelUsed,
      confidence,
    });

    const savedQuery = await aiQuery.save();
    console.log('Query saved successfully:', savedQuery);
    return savedQuery;
  } catch (error) {
    console.error('Error saving AI query:', error.message);
    throw new Error('Failed to save AI query');
  }
};

// Method to generate AI response
const generateAIResponse = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await callAIModel(prompt);

    if (!response) {
      return res
        .status(500)
        .json({ error: 'Failed to get a response from OpenAI' });
    }

    const modelUsed = 'GPT-3 (text-davinci-003)';
    const savedQuery = await saveAIQuery(prompt, response, modelUsed);

    return res.status(200).json({
      message: 'AI response generated successfully!',
      response,
      savedQuery,
    });
  } catch (error) {
    console.error('Error generating AI response:', error.message);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

// Method to predict using AI
const predict = async (req, res) => {
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

    const modelUsed = 'GPT-3 (text-davinci-003)';
    const savedQuery = await saveAIQuery(query, response, modelUsed);

    return res.status(200).json({
      message: 'Prediction successful!',
      response,
      savedQuery,
    });
  } catch (error) {
    console.error('Error during prediction process:', error.message);
    return res.status(500).json({ error: 'Prediction failed' });
  }
};

// Method to evaluate a rule
const evaluateRule = (req, res) => {
  const { id } = req.params;
  const { inputData } = req.body;

  if (!inputData) {
    return res.status(400).json({ error: 'Input data is required' });
  }

  const ruleResult = {
    ruleId: id,
    input: inputData,
    passed: inputData.someKey === 'someValue',
    details: `Rule ${id} evaluated with input data ${JSON.stringify(inputData)}`,
  };

  return res.status(200).json({
    message: 'Rule evaluated successfully',
    result: ruleResult,
  });
};

// Placeholder methods for unimplemented routes
const processData = (req, res) =>
  res.json({ message: 'Process data endpoint is not yet implemented.' });
const getData = (req, res) =>
  res.json({ message: 'Data retrieval endpoint is not yet implemented.' });

// Export the controller functions
export default {
  getData,
  predict,
  processData,
  evaluateRule,
  generateAIResponse,
};
