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
import { calculateEggRarity } from './utils/eggUtils.js';

/** 🛠️ Utility function to validate required string properties */
function validateString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid "${name}": Must be a non-empty string.`);
  }
}

/** 🎯 Ensures `options` is a valid object */
function validateOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid "options": Must be a valid object.');
  }
}

/** 🥚 Generates a new Egg with specified options and applies plugins */
export function generateEgg(options = {}, plugins = []) {
  validateOptions(options);

  // Default values
  const timestamp = new Date();
  const type = options.type || 'common';
  const description =
    options.description || 'An unidentified egg with mysterious properties.';
  const element = options.element || 'unknown';

  // Validate required properties
  validateString(type, 'type');
  validateString(description, 'description');

  const egg = {
    id: uuidv4(),
    type,
    description,
    element,
    rarity:
      options.rarity ||
      calculateEggRarity({
        type,
        element,
        power: options.properties?.power ?? 100,
        durability: options.properties?.durability ?? 50,
      }), // ✅ Pass full properties for better accuracy
    properties: {
      power: options.properties?.power ?? 100,
      durability: options.properties?.durability ?? 50,
      specialAbility: options.properties?.specialAbility ?? 'none',
    },
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      version: '1.0.30',
      tags: Array.isArray(options.metadata?.tags)
        ? [...new Set(options.metadata.tags)]
        : ['default-tag'],
      origin: options.metadata?.origin || 'mystical',
    },
  };

  // 🛠️ Apply plugins with error handling
  for (const plugin of plugins) {
    if (typeof plugin === 'function') {
      try {
        const modifiedEgg = plugin(egg);
        if (modifiedEgg && typeof modifiedEgg === 'object') {
          Object.assign(egg, modifiedEgg);
        }
      } catch (error) {
        console.warn(`⚠️ Plugin execution failed: ${error.message}`);
      }
    }
  }

  console.debug('🥚 Generated Egg:', JSON.stringify(egg, null, 2));
  return egg;
}

/** 🎯 Plugin: Adds custom tags to metadata */
export function addTagsPlugin(tags = []) {
  return (egg) => {
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
      throw new Error('Invalid tags: Must be an array of strings.');
    }
    egg.metadata.tags = [...new Set([...egg.metadata.tags, ...tags])];
    return egg;
  };
}

/** 🔖 Plugin: Adds a version number */
export function addVersionPlugin(version = '1.0.30') {
  return (egg) => {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error('Invalid version format: Must be in "x.y.z" format.');
    }
    egg.metadata.version = version;
    return egg;
  };
}

/** ⚡ Plugin: Boosts egg power based on rarity */
export function boostPowerPlugin(multiplier = 1.2) {
  return (egg) => {
    if (typeof multiplier !== 'number' || multiplier <= 0) {
      throw new Error('Invalid multiplier: Must be a positive number.');
    }
    egg.properties.power = Math.floor(egg.properties.power * multiplier);
    return egg;
  };
}
