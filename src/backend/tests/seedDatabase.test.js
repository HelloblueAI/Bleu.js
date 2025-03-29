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
import fs from 'fs';
import { seedDatabase } from '../seedDatabase';
import { mockSeedData } from '../__mocks__/seedData';

jest.mock('fs');

describe('seedDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'readdir').mockResolvedValue(['users.json', 'settings.json']);
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockSeedData));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should read seed files and insert data', async () => {
    const result = await seedDatabase();
    expect(fs.readdir).toHaveBeenCalled();
    expect(fs.readFile).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should handle file read errors', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File read error'));
    await expect(seedDatabase()).rejects.toThrow('File read error');
  });

  it('should handle invalid JSON data', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('invalid json');
    await expect(seedDatabase()).rejects.toThrow('Invalid JSON');
  });

  it('should handle directory read errors', async () => {
    jest.spyOn(fs, 'readdir').mockRejectedValue(new Error('Directory read error'));
    await expect(seedDatabase()).rejects.toThrow('Directory read error');
  });
});
