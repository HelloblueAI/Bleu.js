import express from 'express';
import { check, validationResult } from 'express-validator';
import AIService from '../services/aiService';
import Rule from '../models/ruleModel';
import User from '../models/userModel'; // Assuming there's a User model

const router = express.Router();
const aiService = new AIService();

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

// AI Routes
router.post('/ai/rules', 
  validateRequest([
    check('data').exists().withMessage('Data is required')
  ]), 
  (req, res) => {
    const result = aiService.evaluateRules(req.body.data);
    res.status(200).json({ result });
});

router.post('/ai/decision', 
  validateRequest([
    check('data').exists().withMessage('Data is required')
  ]), 
  (req, res) => {
    const result = aiService.predictDecision(req.body.data);
    res.status(200).json({ result });
});

router.post('/ai/nlp', 
  validateRequest([
    check('text').exists().withMessage('Text is required')
  ]), 
  (req, res) => {
    const tokens = aiService.processText(req.body.text);
    res.status(200).json({ tokens });
});

// Rule Routes
router.post('/rules', 
  validateRequest([
    check('name').isString().withMessage('Name must be a string'),
    check('conditions').isArray().withMessage('Conditions must be an array of strings'),
    check('actions').isArray().withMessage('Actions must be an array of strings'),
    check('priority').optional().isInt().withMessage('Priority must be an integer')
  ]), 
  async (req, res) => {
    try {
      const rule = new Rule(req.body);
      await rule.save();
      res.status(201).json({ message: 'Rule created', rule });
    } catch (error) {
      console.error('Error creating rule:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/rules/:id', 
  validateRequest([
    check('name').optional().isString().withMessage('Name must be a string'),
    check('conditions').optional().isArray().withMessage('Conditions must be an array of strings'),
    check('actions').optional().isArray().withMessage('Actions must be an array of strings'),
    check('priority').optional().isInt().withMessage('Priority must be an integer')
  ]), 
  async (req, res) => {
    try {
      const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!rule) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      res.status(200).json({ message: 'Rule updated', rule });
    } catch (error) {
      console.error('Error updating rule:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.status(200).json({ rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules/:id', async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ rule });
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/rules/:id/logs', async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    res.status(200).json({ logs: rule.logs });
  } catch (error) {
    console.error('Error fetching rule logs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User Routes
router.post('/users', 
  validateRequest([
    check('name').isString().withMessage('Name must be a string'),
    check('email').isEmail().withMessage('Email must be valid'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]), 
  async (req, res) => {
    try {
      const user = new User(req.body);
      await user.save();
      res.status(201).json({ message: 'User created', user });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/users/:id', 
  validateRequest([
    check('name').optional().isString().withMessage('Name must be a string'),
    check('email').optional().isEmail().withMessage('Email must be valid'),
    check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]), 
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User updated', user });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


export default router;
