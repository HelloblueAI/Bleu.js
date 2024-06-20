/* eslint-env node */
const Rule = require('../models/ruleModel');
const AIService = require('../services/aiService');
const logger = require('../src/utils/logger');
const aiService = new AIService();

exports.predict = async (req, res) => {
  try {
    const input = req.body.input;
    if (!input) {
      return res.status(400).json({ error: 'Input data is required' });
    }

    const prediction = await aiService.predict(input); // Replace with actual prediction logic
    logger.info('Prediction successful', { input, prediction });
    return res.status(200).json({ prediction });
  } catch (error) {
    logger.error('Prediction error', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.processData = async (req, res) => {
  try {
    const data = req.body.data;
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const processedData = await aiService.processData(data);
    logger.info('Data processed successfully', { data, processedData });
    return res.status(200).json({ processedData });
  } catch (error) {
    logger.error('Data processing error', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.getProcessedData = async (req, res) => {
  try {
    const processedData = await aiService.getProcessedData();
    logger.info('Fetched processed data', { processedData });
    return res.status(200).json({ processedData });
  } catch (error) {
    logger.error('Error fetching processed data', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.trainModel = async (req, res) => {
  try {
    const modelInfo = req.body.modelInfo;
    if (!modelInfo) {
      return res.status(400).json({ error: 'Model info is required' });
    }

    await aiService.trainModel(modelInfo);
    logger.info('Model training started', { modelInfo });
    return res.status(200).json({ message: 'Model training started' });
  } catch (error) {
    logger.error('Model training error', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.getTrainModelStatus = async (req, res) => {
  try {
    const status = await aiService.getTrainModelStatus();
    logger.info('Fetched model training status', { status });
    return res.status(200).json({ status });
  } catch (error) {
    logger.error('Error fetching model training status', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadDataset = async (req, res) => {
  try {
    const dataset = req.body.dataset;
    if (!dataset) {
      return res.status(400).json({ error: 'Dataset is required' });
    }

    await aiService.uploadDataset(dataset);
    logger.info('Dataset uploaded successfully', { dataset });
    return res.status(200).json({ message: 'Dataset uploaded successfully' });
  } catch (error) {
    logger.error('Dataset upload error', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.find();
    logger.info('Fetched rules', { rules });
    return res.status(200).json(rules);
  } catch (error) {
    logger.error('Error fetching rules', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.addRule = async (req, res) => {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    logger.info('Rule added successfully', { rule });
    return res.status(201).json({ message: 'Rule added successfully' });
  } catch (error) {
    logger.error('Error adding rule', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    await Rule.findByIdAndUpdate(req.params.id, req.body);
    logger.info('Rule updated successfully', {
      ruleId: req.params.id,
      updates: req.body,
    });
    return res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    logger.error('Error updating rule', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    await Rule.findByIdAndDelete(req.params.id);
    logger.info('Rule removed successfully', { ruleId: req.params.id });
    return res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    logger.error('Error removing rule', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.evaluateRule = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const inputData = req.body.data;

    if (!ruleId || !inputData) {
      return res
        .status(400)
        .json({ error: 'Rule ID and input data are required' });
    }

    const result = await aiService.evaluateRule(ruleId, inputData);
    logger.info('Rule evaluated', { ruleId, inputData, result });
    return res.status(200).json({ result });
  } catch (error) {
    logger.error('Error evaluating rule', { error });
    return res.status(500).json({ error: error.message });
  }
};

exports.invalidRoute = (req, res) => {
  res.status(404).json({ error: 'Not Found' });
};
