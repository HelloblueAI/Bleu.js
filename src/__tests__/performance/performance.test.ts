import { jest } from '@jest/globals';

describe('Performance Tests', () => {
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

  describe('CPU Performance', () => {
    it('should perform array operations efficiently', async () => {
      const { average } = await measurePerformance(() => {
        const arr = Array.from({ length: 10000 }, (_, i) => i);
        return arr.map(x => x * 2).filter(x => x % 4 === 0).reduce((a, b) => a + b, 0);
      });
      expect(average).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should perform object operations efficiently', async () => {
      const { average } = await measurePerformance(() => {
        const obj = {};
        for (let i = 0; i < 1000; i++) {
          Object.assign(obj, { [`key${i}`]: i });
        }
        return Object.keys(obj).length;
      });
      expect(average).toBeLessThan(1); // Should complete in less than 1ms
    });

    it('should perform string operations efficiently', async () => {
      const { average } = await measurePerformance(() => {
        const str = 'a'.repeat(10000);
        return str.split('').reverse().join('');
      });
      expect(average).toBeLessThan(1); // Should complete in less than 1ms
    });
  });

  describe('Memory Performance', () => {
    it('should handle large arrays without memory issues', async () => {
      const arr: any[] = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        arr.push(new Array(1000).fill(Math.random()));
        const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        expect(heapUsed).toBeLessThan(1000); // Should use less than 1GB
      }
    });

    it('should clean up memory after large operations', async () => {
      const initialHeap = process.memoryUsage().heapUsed;
      
      // Perform a memory-intensive operation
      const largeArray = new Array(1000000).fill(Math.random());
      const result = largeArray.map(x => x * 2);
      
      // Clear the references
      largeArray.length = 0;
      result.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalHeap = process.memoryUsage().heapUsed;
      const diff = Math.abs(finalHeap - initialHeap) / 1024 / 1024; // MB
      expect(diff).toBeLessThan(10); // Heap difference should be less than 10MB
    });
  });

  describe('Async Performance', () => {
    it('should handle multiple promises efficiently', async () => {
      const { average } = await measurePerformance(async () => {
        const promises = Array.from({ length: 100 }, (_, i) => 
          Promise.resolve(i).then(x => x * 2)
        );
        return Promise.all(promises);
      }, 100);
      expect(average).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should handle async/await efficiently', async () => {
      const { average } = await measurePerformance(async () => {
        const results = [];
        for (let i = 0; i < 100; i++) {
          const result = await Promise.resolve(i);
          results.push(result);
        }
        return results;
      }, 100);
      expect(average).toBeLessThan(10); // Should complete in less than 10ms
    });
  });

  describe('Timer Performance', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should handle multiple timers efficiently', () => {
      const start = performance.now();
      const callbacks = Array.from({ length: 1000 }, () => jest.fn());
      
      callbacks.forEach((callback, i) => {
        setTimeout(callback, i);
      });
      
      jest.runAllTimers();
      
      const end = performance.now();
      const duration = end - start;
      
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
      
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
}); 