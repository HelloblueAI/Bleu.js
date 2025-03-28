import { Egg } from '../types/egg';

export function generateDNA(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let dna = '';
  for (let i = 0; i < 32; i++) {
    dna += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return dna;
}

export function calculateEggPower(egg: Egg): number {
  const basePower = egg.properties.power;
  const rarityMultiplier = getRarityMultiplier(egg.rarity);
  const elementBonus = getElementBonus(egg.element);
  return Math.floor(basePower * rarityMultiplier * elementBonus);
}

export function calculateEggDurability(egg: Egg): number {
  const baseDurability = egg.properties.durability;
  const rarityMultiplier = getRarityMultiplier(egg.rarity);
  return Math.floor(baseDurability * rarityMultiplier);
}

function getRarityMultiplier(rarity: string): number {
  const multipliers: { [key: string]: number } = {
    COMMON: 1,
    UNCOMMON: 1.2,
    RARE: 1.5,
    EPIC: 2,
    LEGENDARY: 3
  };
  return multipliers[rarity] || 1;
}

function getElementBonus(element: string): number {
  const bonuses: { [key: string]: number } = {
    FIRE: 1.1,
    WATER: 1.1,
    EARTH: 1.1,
    AIR: 1.1,
    LIGHT: 1.2,
    DARK: 1.2,
    NEUTRAL: 1
  };
  return bonuses[element] || 1;
} 