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

import crypto from 'crypto';

/** 🎲 Generate a Unique DNA String */
export function generateDNA() {
  return crypto.randomBytes(16).toString('hex');
}

/** 🛠️ Validate Required String Properties */
export function validateString(value, name) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid "${name}": Must be a non-empty string.`);
  }
  return value.trim(); // Return trimmed valid strings
}

/** 🔥 Calculate Egg Rarity Based on Type & Element */
export function calculateEggRarity({ type, element }) {
  const rarityMap = {
    common: 0,
    uncommon: 1,
    rare: 2,
    legendary: 3,
    mythical: 4,
    divine: 5,
    unique: 6,
  };

  let rarity = type?.toLowerCase() in rarityMap ? type.toLowerCase() : 'common';

  // 🔥 Ensure Elemental Boost is Applied Correctly
  const elementBoost = {
    fire: 'rare',
    cosmic: 'legendary',
    void: 'mythical',
    celestial: 'divine',
    inferno: 'mythical',
    thunder: 'rare',
  };

  if (elementBoost[element?.toLowerCase()]) {
    const currentRank = rarityMap[rarity];
    const boostRank = rarityMap[elementBoost[element.toLowerCase()]];

    // Upgrade rarity if elemental boost is higher than current rarity
    if (boostRank > currentRank) {
      rarity = elementBoost[element.toLowerCase()];
    }
  }

  return rarity;
}

/** ⚡ Calculate Initial Power Level */
export function calculateInitialPower(rarity) {
  const baseStrength = 50;
  const multipliers = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    legendary: 2,
    mythical: 3,
    divine: 5,
    unique: 10,
  };

  return Math.floor(
    (Math.random() * 20 + baseStrength) * (multipliers[rarity] || 1),
  );
}

/** 🛡️ Generate Egg Defense Level */
export function calculateDefenseLevel(rarity) {
  const baseDefense = 30;
  const multipliers = {
    common: 1,
    uncommon: 1.1,
    rare: 1.3,
    legendary: 1.7,
    mythical: 2.5,
    divine: 4,
    unique: 7,
  };

  return Math.floor(
    (Math.random() * 15 + baseDefense) * (multipliers[rarity] || 1),
  );
}

/** ⚔️ Assign Special Abilities Based on Rarity */
export function getSpecialAbilities(rarity) {
  const abilities = {
    common: ['none'],
    uncommon: ['harden'],
    rare: ['flame burst', 'ice shield'],
    legendary: ['thunder strike', 'shadow veil'],
    mythical: ['time warp', 'dimension shift'],
    divine: ['phoenix rebirth', 'celestial beam'],
    unique: ['eternal regeneration', 'god’s wrath'],
  };

  return abilities[rarity] || ['none'];
}

/** ✅ Validate Egg Parameters */
export function validateEggParams(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Egg parameters must be an object.');
  }

  ['type', 'element'].forEach((prop) => {
    if (!params[prop]) {
      throw new Error(`Missing required parameter: "${prop}".`);
    }
    validateString(params[prop], prop);
  });

  return true;
}
