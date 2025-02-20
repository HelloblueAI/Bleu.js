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

/** 🔥 Calculate Rarity Score */
export function calculateRarityScore(rarity) {
  const scores = {
    common: 1,
    uncommon: 2,
    rare: 3,
    legendary: 4,
    mythical: 5,
    divine: 6,
    unique: 7,
  };
  return scores[rarity] || 1;
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
