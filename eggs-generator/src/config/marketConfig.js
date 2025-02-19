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
/** 🚀 Market Configuration */
export const MARKET_CONFIG = {
  TIERS: {
    FREE: {
      eggsPerDay: 5,
      rarities: ['common', 'uncommon'],
      price: 0,
    },
    PRO: {
      eggsPerDay: 50,
      rarities: ['common', 'uncommon', 'rare', 'legendary'],
      price: 49.99,
      tradingFee: 0.05,
    },
    ENTERPRISE: {
      eggsPerDay: 'unlimited',
      rarities: [
        'common',
        'uncommon',
        'rare',
        'legendary',
        'mythical',
        'divine',
        'unique',
      ],
      price: 499.99,
      tradingFee: 0.01,
    },
  },
};

/** 🚀 Validate Tier */
export function validateTier(tier) {
  return MARKET_CONFIG.TIERS[tier] || null;
}
