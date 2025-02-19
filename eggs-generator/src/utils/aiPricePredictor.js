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
