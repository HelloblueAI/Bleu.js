import { APITestHelper } from '../helpers/apiTestHelper';
import { AWSEngine } from '../../engines/aws';
import { QuantumEngine } from '../../engines/quantum';
import { AIEngine } from '../../engines/ai';

describe('API Engines', () => {
  let awsEngine: AWSEngine;
  let quantumEngine: QuantumEngine;
  let aiEngine: AIEngine;

  beforeEach(() => {
    awsEngine = new AWSEngine();
    quantumEngine = new QuantumEngine();
    aiEngine = new AIEngine();
    APITestHelper.clearMocks();
  });

  describe('AWS Engine', () => {
    it('should process AWS requests successfully', async () => {
      const mockResponse = { result: 'success' };
      APITestHelper.aws.setMockResponse('processRequest', mockResponse);

      const result = await awsEngine.processRequest({
        operation: 'test',
        params: { key: 'value' }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle AWS errors correctly', async () => {
      const mockError = new Error('AWS Error');
      APITestHelper.aws.setMockError(mockError);

      await expect(awsEngine.processRequest({
        operation: 'test',
        params: { key: 'value' }
      })).rejects.toThrow('AWS Error');
    });
  });

  describe('Quantum Engine', () => {
    it('should process quantum requests successfully', async () => {
      const mockResponse = { qubits: [0, 1] };
      APITestHelper.quantum.setMockResponse('processRequest', mockResponse);

      const result = await quantumEngine.processRequest({
        operation: 'test',
        params: { circuit: 'H 0' }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle quantum errors correctly', async () => {
      const mockError = new Error('Quantum Error');
      APITestHelper.quantum.setMockError(mockError);

      await expect(quantumEngine.processRequest({
        operation: 'test',
        params: { circuit: 'invalid' }
      })).rejects.toThrow('Quantum Error');
    });
  });

  describe('AI Engine', () => {
    it('should process AI requests successfully', async () => {
      const mockResponse = { prediction: 0.95 };
      APITestHelper.ai.setMockResponse('processRequest', mockResponse);

      const result = await aiEngine.processRequest({
        operation: 'test',
        params: { input: 'test data' }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle AI errors correctly', async () => {
      const mockError = new Error('AI Error');
      APITestHelper.ai.setMockError(mockError);

      await expect(aiEngine.processRequest({
        operation: 'test',
        params: { input: 'invalid' }
      })).rejects.toThrow('AI Error');
    });
  });
}); 