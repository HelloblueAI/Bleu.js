import axios from 'axios';
import AiQuery from '../models/AiQuery.js';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    'OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables.',
  );
  process.exit(1);
}

const callAIModel = async (query, options = {}) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: options.model || 'text-davinci-003',
        prompt: query,
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7,
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
    console.error('Error calling AI model:', error);
    throw new Error('Failed to call AI model');
  }
};

// Generate AI Response
export const generateAIResponse = async (req, res) => {
  const { prompt, options } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await callAIModel(prompt, options);
    const aiQuery = new AiQuery({
      query: prompt,
      response,
      modelUsed: options?.model || 'GPT-3 (text-davinci-003)',
      confidence: 0.98,
    });

    const savedQuery = await aiQuery.save();
    console.log('Query saved successfully:', savedQuery);

    return res.status(200).json({
      message: 'AI response generated successfully!',
      response,
      savedQuery,
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

// Predict Function
export const predict = async (req, res) => {
  const { query, options } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await callAIModel(query, options);
    const aiQuery = new AiQuery({
      query,
      response,
      modelUsed: options?.model || 'GPT-3 (text-davinci-003)',
      confidence: 0.98,
    });

    const savedQuery = await aiQuery.save();
    console.log('Query saved successfully:', savedQuery);

    return res.status(200).json({
      message: 'Prediction successful!',
      response,
      savedQuery,
    });
  } catch (error) {
    console.error('Error during prediction process:', error);
    return res.status(500).json({ error: 'Prediction failed' });
  }
};

// Add Rule
export const addRule = (req, res) => {
  const { name, condition, action } = req.body;

  if (!name || !condition || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newRule = { id: Date.now(), name, condition, action };
  console.log('New rule added:', newRule);

  res.status(201).json({
    message: 'Rule added successfully',
    rule: newRule,
  });
};

// Update Rule
export const updateRule = (req, res) => {
  const { id } = req.params;
  const { name, condition, action } = req.body;

  if (!id || !name || !condition || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const updatedRule = { id, name, condition, action };
  console.log('Rule updated successfully:', updatedRule);

  res.status(200).json({
    message: 'Rule updated successfully',
    rule: updatedRule,
  });
};

// Delete Rule
export const deleteRule = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  console.log(`Rule with ID ${id} deleted successfully`);

  res.status(200).json({
    message: `Rule with ID ${id} deleted successfully`,
  });
};

// Debugging Endpoint
export const debug = (req, res) => {
  try {
    console.log('Debugging API call:', req.body);
    res.status(200).json({ message: 'Debug information logged successfully' });
  } catch (error) {
    console.error('Error in debug:', error);
    res.status(500).json({ error: 'Failed to log debug information' });
  }
};

// Invalid Route
export const invalidRoute = (req, res) => {
  res.status(404).json({ error: 'Invalid route' });
};
