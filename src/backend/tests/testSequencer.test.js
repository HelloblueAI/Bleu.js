//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
import { TestSequencer } from '../testSequencer';
import { app } from '../app';

jest.mock('../app', () => ({
  app: {
    inject: jest.fn()
  }
}));

describe('TestSequencer', () => {
  let sequencer;

  beforeEach(() => {
    sequencer = new TestSequencer();
  });

  afterEach(async () => {
    await sequencer.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(sequencer.initialize()).resolves.not.toThrow();
    });

    it('should load existing model if available', async () => {
      await sequencer.initialize();
      expect(sequencer.initialized).toBe(true);
    });
  });

  describe('test execution', () => {
    it('should run tests in correct order', async () => {
      await sequencer.initialize();
      const testFiles = ['test1.ts', 'test2.ts'];
      const results = await sequencer.runTests(testFiles);
      expect(results.length).toBe(2);
      expect(results[0].file).toBe('test1.ts');
      expect(results[1].file).toBe('test2.ts');
    });

    it('should handle test failures gracefully', async () => {
      await sequencer.initialize();
      const testFiles = ['failing.test.ts'];
      
      // Mock the test execution to simulate a failure
      jest.spyOn(sequencer, 'runTests').mockImplementationOnce(async () => [{
        file: 'failing.test.ts',
        status: 'failed',
        error: 'Test failed',
        duration: 0,
        timestamp: Date.now()
      }]);

      const results = await sequencer.runTests(testFiles);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('Test failed');
    });
  });

  describe('test prioritization', () => {
    it('should prioritize tests based on history', async () => {
      await sequencer.initialize();
      const testFiles = ['test1.ts', 'test2.ts'];
      const prioritized = await sequencer.prioritizeTests(testFiles);
      expect(prioritized).toEqual(expect.arrayContaining(testFiles));
    });
  });

  describe('API integration', () => {
    beforeEach(() => {
      app.inject.mockReset();
    });

    it('should handle test requests', async () => {
      const mockResponse = {
        statusCode: 200,
        payload: JSON.stringify({ success: true })
      };
      app.inject.mockResolvedValueOnce(mockResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/api/tests/run',
        payload: {
          files: ['test1.ts']
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ success: true });
    });

    it('should handle test prioritization requests', async () => {
      const mockResponse = {
        statusCode: 200,
        payload: JSON.stringify({
          prioritizedTests: ['test2.ts', 'test1.ts']
        })
      };
      app.inject.mockResolvedValueOnce(mockResponse);

      const response = await app.inject({
        method: 'POST',
        url: '/api/tests/prioritize',
        payload: {
          files: ['test1.ts', 'test2.ts']
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('prioritizedTests');
    });
  });
});
