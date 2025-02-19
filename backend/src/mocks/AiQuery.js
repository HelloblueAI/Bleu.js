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

const { jest } = require('@jest/globals');

/**
 * Mocked database operations for AiQuery
 * - Uses Jest mocks for testing
 * - Simulates standard database operations
 */

const find = jest.fn().mockResolvedValue([]);

const findById = jest.fn(async (id) => {
  if (id === 'valid-id') {
    return Promise.resolve({
      _id: 'valid-id',
      conditions: [
        {
          key: 'age',
          operator: 'greater_than',
          value: 18,
        },
      ],
      actions: ['approve'],
    });
  }
  return Promise.resolve(null);
});

const save = jest.fn().mockResolvedValue(true);

const findByIdAndUpdate = jest.fn().mockResolvedValue({
  _id: 'valid-id',
  conditions: [
    {
      key: 'age',
      operator: 'greater_than',
      value: 18,
    },
  ],
  actions: ['reject'],
});

const findByIdAndDelete = jest.fn().mockResolvedValue(true);

module.exports = {
  find,
  findById,
  save,
  findByIdAndUpdate,
  findByIdAndDelete,
};
