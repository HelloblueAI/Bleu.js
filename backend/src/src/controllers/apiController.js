'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.uploadDataset =
  exports.updateRule =
  exports.trainModel =
  exports.resolveConflicts =
  exports.processData =
  exports.predict =
  exports.monitorDependencies =
  exports.invalidRoute =
  exports.getTrainModelStatus =
  exports.getRules =
  exports.getProcessedData =
  exports.getData =
  exports.generateEgg =
  exports.evaluateRule =
  exports.deleteRule =
  exports.default =
  exports.debug =
  exports.addRule =
    void 0;
var _trim = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/trim'),
);
var _map = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/map'),
);
var _filter = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/filter'),
);
var _axios = require('axios');
var _AiQuery = _interopRequireDefault(require('../models/AiQuery'));
const callAIModel = async (query) => {
  try {
    var _context;
    const response = {
      data: {
        choices: [
          {
            text: `Mock response for query: "${query}"`,
          },
        ],
      },
    };
    return (0, _trim.default)((_context = response.data.choices[0].text)).call(
      _context,
    );
  } catch (error) {
    console.error('Error calling custom AI model:', error);
    return null;
  }
};
const predict = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({
      error: 'Query is required',
    });
  }
  try {
    const response = await callAIModel(query);
    if (!response) {
      return res.status(500).json({
        error: 'Failed to get a response from the AI model',
      });
    }
    const modelUsed = 'Custom AI Model';
    const aiQuery = new _AiQuery.default({
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
    return res.status(500).json({
      error: 'Prediction failed',
    });
  }
};
exports.predict = predict;
const getData = (req, res) => {
  res.json({
    message: 'Hello, this is your data!',
  });
};
exports.getData = getData;
const processData = (req, res) => {
  res.json({
    message: 'Process data endpoint is not yet implemented.',
  });
};
exports.processData = processData;
const getProcessedData = (req, res) => {
  res.json({
    message: 'Get processed data endpoint is not yet implemented.',
  });
};
exports.getProcessedData = getProcessedData;
const trainModel = (req, res) => {
  res.json({
    message: 'Train model endpoint is not yet implemented.',
  });
};
exports.trainModel = trainModel;
const getTrainModelStatus = (req, res) => {
  res.json({
    message: 'Get train model status endpoint is not yet implemented.',
  });
};
exports.getTrainModelStatus = getTrainModelStatus;
const uploadDataset = (req, res) => {
  res.json({
    message: 'Upload dataset endpoint is not yet implemented.',
  });
};
exports.uploadDataset = uploadDataset;
const getRules = (req, res) => {
  res.json({
    message: 'Get rules endpoint is not yet implemented.',
  });
};
exports.getRules = getRules;
const addRule = (req, res) => {
  res.json({
    message: 'Add rule endpoint is not yet implemented.',
  });
};
exports.addRule = addRule;
const updateRule = (req, res) => {
  res.json({
    message: 'Update rule endpoint is not yet implemented.',
  });
};
exports.updateRule = updateRule;
const deleteRule = (req, res) => {
  res.json({
    message: 'Delete rule endpoint is not yet implemented.',
  });
};
exports.deleteRule = deleteRule;
const evaluateRule = (req, res) => {
  res.json({
    message: 'Evaluate rule endpoint is not yet implemented.',
  });
};
exports.evaluateRule = evaluateRule;
const generateEgg = (req, res) => {
  const { type, options } = req.body;
  try {
    var _context2, _context3;
    const egg = {
      id: 1,
      description: `Model ${options.modelName} with fields ${(0, _map.default)(
        (_context2 = options.fields),
      )
        .call(_context2, (f) => f.name)
        .join(', ')}`,
      type,
      code: `class ${options.modelName} {\n  ${(0, _map.default)(
        (_context3 = options.fields),
      )
        .call(_context3, (f) => `${f.name}: ${f.type};`)
        .join('\n  ')}\n}`,
    };
    res.status(200).json(egg);
  } catch (error) {
    console.error('Error generating egg:', error);
    res.status(500).json({
      error: error.message,
    });
  }
};
exports.generateEgg = generateEgg;
const monitorDependencies = (req, res) => {
  try {
    const dependencies = [
      {
        name: 'express',
        version: '4.19.2',
        latest: '4.19.2',
      },
      {
        name: 'mongoose',
        version: '7.6.13',
        latest: '7.6.14',
      },
      {
        name: 'dotenv',
        version: '16.4.5',
        latest: '16.4.5',
      },
    ];
    const outdated = (0, _filter.default)(dependencies).call(
      dependencies,
      (dep) => dep.version !== dep.latest,
    );
    res.status(200).json({
      dependencies,
      outdated,
    });
  } catch (error) {
    console.error('Error monitoring dependencies:', error);
    res.status(500).json({
      error: 'Error monitoring dependencies',
    });
  }
};
exports.monitorDependencies = monitorDependencies;
const resolveConflicts = (req, res) => {
  try {
    const resolved = [
      {
        name: 'express',
        resolvedVersion: '4.19.2',
      },
      {
        name: 'lodash',
        resolvedVersion: '4.17.21',
      },
    ];
    const conflicts = [
      {
        name: 'express',
        versions: ['4.19.2', '4.17.1'],
      },
      {
        name: 'lodash',
        versions: ['4.17.21', '4.17.20'],
      },
    ];
    res.status(200).json({
      resolved,
      conflicts,
    });
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    res.status(500).json({
      error: 'Error resolving conflicts',
    });
  }
};
exports.resolveConflicts = resolveConflicts;
const debug = (req, res) => {
  res.status(200).json({
    message: 'Debug endpoint is not yet implemented.',
  });
};
exports.debug = debug;
const invalidRoute = (req, res) => {
  res.status(404).send({
    error: 'Invalid route',
  });
};

// Export the controller functions as default for backward compatibility
exports.invalidRoute = invalidRoute;
var _default = (exports.default = {
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
});
