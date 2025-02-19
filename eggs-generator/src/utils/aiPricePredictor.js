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
export function predictEggPrice(rarity, element, size = 'medium') {
  const basePrices = {
    common: 100,
    uncommon: 250,
    rare: 500,
    legendary: 1000,
    mythical: 5000,
    divine: 10000,
    unique: 25000,
  };

  const elementModifiers = {
    fire: 1.2,
    water: 1.1,
    earth: 1.0,
    air: 1.15,
    divine: 1.5,
    shadow: 1.8,
  };

  const sizeModifiers = {
    small: 0.9,
    medium: 1.0,
    large: 1.2,
    massive: 1.5,
  };

  const basePrice = basePrices[rarity] || 500;
  const elementMultiplier = elementModifiers[element] || 1.0;
  const sizeMultiplier = sizeModifiers[size] || 1.0;

  return Math.round(basePrice * elementMultiplier * sizeMultiplier);
}
