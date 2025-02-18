import crypto from 'crypto';

/** 🎲 Generate a Unique DNA String */
export function generateDNA() {
  return crypto.randomBytes(16).toString('hex');
}

/** 🔥 Calculate Rarity Score */
export function calculateRarityScore(rarity) {
  const scores = { common: 1, uncommon: 2, rare: 3, legendary: 4, mythical: 5, divine: 6, unique: 7 };
  return scores[rarity] || 1;
}

/** ⚡ Calculate Initial Power Level */
export function calculateInitialPower(rarity) {
  const baseStrength = 50;
  const multipliers = { common: 1, uncommon: 1.2, rare: 1.5, legendary: 2, mythical: 3, divine: 5, unique: 10 };
  return Math.floor((Math.random() * 20 + baseStrength) * (multipliers[rarity] || 1));
}
