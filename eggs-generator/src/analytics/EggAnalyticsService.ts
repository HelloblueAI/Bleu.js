//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggRarity, EggElement, EggAnalytics } from '../types/egg';
import { EventEmitter } from 'events';

export interface AnalyticsData {
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

export interface AnalyticsReport {
  timestamp: Date;
  data: AnalyticsData;
  summary: {
    totalEggs: number;
    uniqueRarities: number;
    uniqueElements: number;
    averagePower: number;
    averageDurability: number;
    mostCommonRarity: EggRarity;
    mostCommonElement: EggElement;
  };
}

export class EggAnalyticsService extends EventEmitter {
  private analytics: AnalyticsData;
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

  public trackEvolution(): void {
    this.analytics.totalEvolutions++;
  }

  public trackBreeding(): void {
    this.analytics.totalBreedings++;
  }

  public trackTrade(price: number, egg: Egg): void {
    this.analytics.totalTrades++;
    this.analytics.marketMetrics.totalVolume += price;
    this.analytics.marketMetrics.averagePrice = 
      this.analytics.marketMetrics.totalVolume / this.analytics.totalTrades;

    // Update most traded rarity and element
    const rarityCount = this.analytics.rarityDistribution[egg.rarity];
    const elementCount = this.analytics.elementDistribution[egg.element];

    const currentRarityCount = this.analytics.rarityDistribution[this.analytics.marketMetrics.mostTradedRarity];
    const currentElementCount = this.analytics.elementDistribution[this.analytics.marketMetrics.mostTradedElement];

    if (rarityCount > currentRarityCount) {
      this.analytics.marketMetrics.mostTradedRarity = egg.rarity;
    }

    if (elementCount > currentElementCount) {
      this.analytics.marketMetrics.mostTradedElement = egg.element;
    }
  }

  public trackUserActivity(userId: string, isActive: boolean): void {
    if (isActive) {
      this.analytics.userMetrics.activeUsers++;
    }
    this.analytics.userMetrics.totalUsers++;
    this.analytics.userMetrics.averageEggsPerUser = 
      this.analytics.totalEggs / this.analytics.userMetrics.totalUsers;
  }

  public generateReport(): AnalyticsReport {
    const mostCommonRarity = this.getMostCommon(this.analytics.rarityDistribution);
    const mostCommonElement = this.getMostCommon(this.analytics.elementDistribution);

    return {
      timestamp: new Date(),
      data: { ...this.analytics },
      summary: {
        totalEggs: this.analytics.totalEggs,
        uniqueRarities: Object.keys(this.analytics.rarityDistribution).length,
        uniqueElements: Object.keys(this.analytics.elementDistribution).length,
        averagePower: this.analytics.averagePower,
        averageDurability: this.analytics.averageDurability,
        mostCommonRarity,
        mostCommonElement
      }
    };
  }

  private getMostCommon<T extends string>(distribution: Record<T, number>): T {
    const entries = Object.entries(distribution) as [T, number][];
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
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

  public getAnalytics(): AnalyticsData {
    return { ...this.analytics };
  }
} 