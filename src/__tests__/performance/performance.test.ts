import { jest } from '@jest/globals';

const createArray = (length: number) => Array.from({ length }, (_, i) => i);
const doubleAndFilter = (arr: number[]) => arr.map(x => x * 2).filter(x => x % 4 === 0);
const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const createObject = (size: number) => {
  const obj: Record<string, number> = {};
  for (let i = 0; i < size; i++) {
    obj[`key${i}`] = i;
  }
  return obj;
};

const reverseString = (str: string) => str.split('').reverse().join('');

const measurePerformance = async (fn: () => Promise<any> | any, iterations = 1000) => {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
  
  return { average, min, max, p95 };
};

const runArrayOperations = () => {
  const arr = createArray(10000);
  const filtered = doubleAndFilter(arr);
  return sumArray(filtered);
};

const runObjectOperations = () => {
  const obj = createObject(1000);
  return Object.keys(obj).length;
};

const runStringOperations = () => {
  const str = 'a'.repeat(10000);
  return reverseString(str);
};

const runMemoryTest = async () => {
  const iterations = 100;
  
  for (let i = 0; i < iterations; i++) {
    const arr = new Array(1000).fill(Math.random());
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    expect(heapUsed).toBeLessThan(1000);
    arr.length = 0; // Clear array after use
  }
};

const runMemoryCleanupTest = async () => {
  const initialHeap = process.memoryUsage().heapUsed;
  
  const array = new Array(2500).fill(0);
  const result = array.map((_, i) => i * 2);
  
  array.length = 0;
  result.length = 0;
  
  for (let i = 0; i < 100; i++) {
    const temp = new Array(100).fill(0);
    temp.length = 0;
  }

  if (global.gc) {
    global.gc();
    await new Promise(resolve => setTimeout(resolve, 200));
    global.gc();
    await new Promise(resolve => setTimeout(resolve, 200));
    global.gc();
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const diff = Math.abs(finalHeap - initialHeap) / 1024 / 1024;
  expect(diff).toBeLessThan(10);
};

const createPromises = (count: number) => 
  Array.from({ length: count }, (_, i) => 
    Promise.resolve(i).then(x => x * 2)
  );

const processAsyncResults = async (count: number) => {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    const result = await Promise.resolve(i);
    results.push(result);
  }
  return results;
};

describe('Performance Tests', () => {
  describe('CPU Performance', () => {
    it('should perform array operations efficiently', async () => {
      const { average } = await measurePerformance(runArrayOperations);
      expect(average).toBeLessThan(10);
    });

    it('should perform object operations efficiently', async () => {
      const { average } = await measurePerformance(runObjectOperations);
      expect(average).toBeLessThan(1);
    });

    it('should perform string operations efficiently', async () => {
      const { average } = await measurePerformance(runStringOperations);
      expect(average).toBeLessThan(1);
    });
  });

  describe('Memory Performance', () => {
    it('should handle large arrays without memory issues', runMemoryTest);

    test('should clean up memory after large operations', runMemoryCleanupTest, 10000);
  });

  describe('Async Performance', () => {
    it('should handle multiple promises efficiently', async () => {
      const { average } = await measurePerformance(async () => {
        const promises = createPromises(100);
        return Promise.all(promises);
      }, 100);
      expect(average).toBeLessThan(10);
    });

    it('should handle async/await efficiently', async () => {
      const { average } = await measurePerformance(async () => {
        return processAsyncResults(100);
      }, 100);
      expect(average).toBeLessThan(10);
    });
  });

  describe('Timer Performance', () => {
    test('should handle multiple timers efficiently', () => {
      jest.useFakeTimers();
      const callbacks = new Array(3).fill(0);
      let completed = 0;

      callbacks.forEach((_, i) => {
        setTimeout(() => {
          completed++;
        }, i * 1);
      });

      jest.runAllTimers();
      expect(completed).toBe(3);
      jest.useRealTimers();
    });
  });
}); 