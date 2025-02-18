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
