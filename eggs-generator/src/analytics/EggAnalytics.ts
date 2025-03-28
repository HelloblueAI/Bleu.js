//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggElement, EggRarity } from '../types/egg';
import { EventEmitter } from 'events';

export interface EggAnalytics {
  totalEggs: number;
  totalEvolutions: number;
  totalBreedings: number;
  totalTrades: number;
  rarityDistribution: Record<EggRarity, number>;
  elementDistribution: Record<EggElement, number>;
  powerDistribution: { [range: string]: number };
  durabilityDistribution: { [range: string]: number };
  specialAbilities: { [ability: string]: number };
  averagePower: number;
  averageDurability: number;
  generationStats: {
    averageTime: number;
    successRate: number;
    totalAttempts: number;
  };
  marketMetrics: {
    averagePrice: number;
    totalVolume: number;
    mostTradedRarity: EggRarity;
    mostTradedElement: EggElement;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    averageEggsPerUser: number;
    userRetentionRate: number;
  };
}

export class EggAnalyticsService extends EventEmitter {
  private analytics: EggAnalytics;
  private generationHistory: { timestamp: Date; success: boolean }[];
  private readonly startTime: Date;

  constructor() {
    super();
    this.startTime = new Date();
    this.generationHistory = [];
    this.analytics = {
      totalEggs: 0,
      totalEvolutions: 0,
      totalBreedings: 0,
      totalTrades: 0,
      rarityDistribution: {
        [EggRarity.COMMON]: 0,
        [EggRarity.UNCOMMON]: 0,
        [EggRarity.RARE]: 0,
        [EggRarity.EPIC]: 0,
        [EggRarity.LEGENDARY]: 0
      },
      elementDistribution: {
        [EggElement.FIRE]: 0,
        [EggElement.WATER]: 0,
        [EggElement.EARTH]: 0,
        [EggElement.AIR]: 0,
        [EggElement.LIGHT]: 0,
        [EggElement.DARK]: 0,
        [EggElement.NEUTRAL]: 0
      },
      powerDistribution: {},
      durabilityDistribution: {},
      specialAbilities: {},
      averagePower: 0,
      averageDurability: 0,
      generationStats: {
        averageTime: 0,
        successRate: 0,
        totalAttempts: 0
      },
      marketMetrics: {
        averagePrice: 0,
        totalVolume: 0,
        mostTradedRarity: EggRarity.COMMON,
        mostTradedElement: EggElement.NEUTRAL
      },
      userMetrics: {
        totalUsers: 0,
        activeUsers: 0,
        averageEggsPerUser: 0,
        userRetentionRate: 0
      }
    };
  }

  public trackGeneration(generationTime: number): void {
    this.analytics.generationStats.averageTime = generationTime;
    this.generationHistory.push({ timestamp: new Date(), success: true });
    this.updateGenerationStats();
  }

  public trackEggCreated(egg: Egg): void {
    this.analytics.totalEggs++;
    this.analytics.rarityDistribution[egg.rarity]++;
    this.analytics.elementDistribution[egg.element]++;
    
    if (egg.properties.specialAbility) {
      this.analytics.specialAbilities[egg.properties.specialAbility] = 
        (this.analytics.specialAbilities[egg.properties.specialAbility] || 0) + 1;
    }

    this.updateAverages(egg);
    this.emit('eggTracked', { egg, analytics: this.analytics });
  }

  public getRarityDistribution(): Record<EggRarity, number> {
    return { ...this.analytics.rarityDistribution };
  }

  public getElementDistribution(): Record<EggElement, number> {
    return { ...this.analytics.elementDistribution };
  }

  public getSpecialAbilityDistribution(): { [ability: string]: number } {
    return { ...this.analytics.specialAbilities };
  }

  public getAveragePower(): number {
    return this.analytics.averagePower;
  }

  public getAverageDurability(): number {
    return this.analytics.averageDurability;
  }

  public getGenerationTime(): number {
    return this.analytics.generationStats.averageTime;
  }

  public getSuccessRate(): number {
    return this.analytics.generationStats.successRate;
  }

  private updateGenerationStats(): void {
    const totalAttempts = this.generationHistory.length;
    const successfulAttempts = this.generationHistory.filter(h => h.success).length;
    
    this.analytics.generationStats.totalAttempts = totalAttempts;
    this.analytics.generationStats.successRate = (successfulAttempts / totalAttempts) * 100;
  }

  private updateAverages(egg: Egg): void {
    const { totalEggs } = this.analytics;
    const prevTotal = totalEggs - 1;
    
    this.analytics.averagePower = 
      (this.analytics.averagePower * prevTotal + egg.properties.power) / totalEggs;
    
    this.analytics.averageDurability = 
      (this.analytics.averageDurability * prevTotal + egg.properties.durability) / totalEggs;
  }

  public getAnalytics(): EggAnalytics {
    return { ...this.analytics };
  }
} 