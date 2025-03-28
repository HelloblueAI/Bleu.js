//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

export enum EggRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum EggElement {
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  AIR = 'AIR',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  NEUTRAL = 'NEUTRAL'
}

export enum EggOrigin {
  NATURAL = 'NATURAL',
  ARTIFICIAL = 'ARTIFICIAL',
  HYBRID = 'HYBRID',
  MUTATED = 'MUTATED',
  ANCIENT = 'ANCIENT'
}

export interface EggProperties {
  power: number;
  durability: number;
  speed: number;
  intelligence: number;
  luck: number;
  specialAbility: string;
}

export interface EggMetadata {
  origin: EggOrigin;
  generation: number;
  parentIds?: string[];
  creationDate: Date;
  lastModified: Date;
  tags: string[];
}

export interface Egg {
  id: string;
  dna: string;
  rarity: EggRarity;
  element: EggElement;
  properties: EggProperties;
  metadata: EggMetadata;
}

export interface EggValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EggAnalytics {
  totalEggs: number;
  totalEvolutions: number;
  totalBreedings: number;
  totalTrades: number;
  rarityDistribution: { [key: string]: number };
  elementDistribution: { [key: string]: number };
  powerDistribution: { [key: string]: number };
  durabilityDistribution: { [key: string]: number };
  evolutionSuccessRate: number;
  breedingSuccessRate: number;
  tradeVolume: number;
  averagePower: number;
  averageDurability: number;
  averageSpeed: number;
  averageIntelligence: number;
  averageLuck: number;
  averageSpecialAbility: number;
  marketMetrics: {
    totalListings: number;
    totalSales: number;
    averagePrice: number;
    priceDistribution: { [key: string]: number };
    volumeByRarity: { [key: string]: number };
    volumeByElement: { [key: string]: number };
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    averageEggsPerUser: number;
    userRetentionRate: number;
    userEngagementScore: number;
  };
} 