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
'use strict';

/* eslint-env jest */

afterEach(async () => {
  try {
    if (global.server) {
      await new Promise((resolve, reject) => {
        global.server.close((err) => {
          if (err) {
            console.error('❌ Error closing server:', err);
            reject(err);
          } else {
            console.info('🛑 Server closed after test suite.');
            resolve();
          }
        });
      });
      global.server = null; // Prevent multiple closures
    }
  } catch (error) {
    console.error('❌ Error in afterEach cleanup:', error);
  }

  // Jest cleanup tasks
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();

  console.info('✅ Jest environment cleaned up.');
});
