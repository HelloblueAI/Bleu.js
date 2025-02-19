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
import { v4 as uuidv4 } from 'uuid';

export function generateEgg(options, plugins = []) {
  if (!options || typeof options !== 'object') {
    throw new Error('Options are required and must be an object');
  }

  const { type, description, metadata = {} } = options;

  if (!type || typeof type !== 'string') {
    throw new Error('A valid "type" is required and must be a string');
  }

  if (!description || typeof description !== 'string') {
    throw new Error('A valid "description" is required and must be a string');
  }

  const egg = {
    id: uuidv4(),
    type,
    description,
    metadata: { ...metadata },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  plugins.forEach((plugin) => {
    if (typeof plugin === 'function') {
      plugin(egg);
    }
  });

  console.debug('Generated Egg:', egg);

  return egg;
}

export function addTagsPlugin(egg) {
  if (!egg.metadata.tags) {
    egg.metadata.tags = ['default-tag'];
  }
}

export function addVersionPlugin(egg) {
  egg.metadata.version = '1.0.30';
}
