//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggRarity } from '../types/egg';
import { EventEmitter } from 'events';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: {
    type: string;
    value: number;
  };
  reward: {
    type: string;
    value: number;
  };
  progress: number;
  completed: boolean;
  completedAt?: Date;
}

export class EggAchievementService extends EventEmitter {
  private achievements: Map<string, Achievement>;
  private userProgress: Map<string, Map<string, number>>;

  constructor() {
    super();
    this.achievements = new Map();
    this.userProgress = new Map();
    this.initializeAchievements();
  }

  private initializeAchievements(): void {
    this.addAchievement({
      id: 'first-egg',
      name: 'First Steps',
      description: 'Generate your first egg',
      criteria: { type: 'eggs_generated', value: 1 },
      reward: { type: 'xp', value: 100 },
      progress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'egg-collector',
      name: 'Egg Collector',
      description: 'Generate 10 eggs',
      criteria: { type: 'eggs_generated', value: 10 },
      reward: { type: 'xp', value: 500 },
      progress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'master-breeder',
      name: 'Master Breeder',
      description: 'Successfully breed 5 pairs of eggs',
      criteria: { type: 'successful_breedings', value: 5 },
      reward: { type: 'xp', value: 1000 },
      progress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'evolution-expert',
      name: 'Evolution Expert',
      description: 'Evolve 3 eggs to their next stage',
      criteria: { type: 'successful_evolutions', value: 3 },
      reward: { type: 'xp', value: 750 },
      progress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'rare-finder',
      name: 'Rare Finder',
      description: 'Find a rare egg',
      criteria: { type: 'rare_eggs', value: 1 },
      reward: { type: 'xp', value: 1500 },
      progress: 0,
      completed: false
    });
  }

  public addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
    this.emit('achievementAdded', achievement);
  }

  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getUserProgress(userId: string): Map<string, number> {
    let progress = this.userProgress.get(userId);
    if (!progress) {
      progress = new Map();
      this.userProgress.set(userId, progress);
    }
    return progress;
  }

  public trackEggGeneration(userId: string, egg: Egg): void {
    const progress = this.getUserProgress(userId);
    
    // Track total eggs generated
    const totalEggs = (progress.get('eggs_generated') || 0) + 1;
    progress.set('eggs_generated', totalEggs);

    // Track eggs by rarity
    if (egg.rarity === EggRarity.RARE) {
      const rareEggs = (progress.get('rare_eggs') || 0) + 1;
      progress.set('rare_eggs', rareEggs);
    }

    if (egg.rarity === EggRarity.LEGENDARY) {
      const legendaryEggs = (progress.get('legendary_eggs') || 0) + 1;
      progress.set('legendary_eggs', legendaryEggs);
    }

    this.checkAchievements(userId);
  }

  public trackBreeding(userId: string, success: boolean): void {
    if (success) {
      const progress = this.getUserProgress(userId);
      const successfulBreedings = (progress.get('successful_breedings') || 0) + 1;
      progress.set('successful_breedings', successfulBreedings);
      this.checkAchievements(userId);
    }
  }

  public trackEvolution(userId: string, success: boolean): void {
    if (success) {
      const progress = this.getUserProgress(userId);
      const successfulEvolutions = (progress.get('successful_evolutions') || 0) + 1;
      progress.set('successful_evolutions', successfulEvolutions);
      this.checkAchievements(userId);
    }
  }

  private checkAchievements(userId: string): void {
    const progress = this.getUserProgress(userId);
    const uncompletedAchievements = Array.from(this.achievements.values())
      .filter(achievement => !achievement.completed);

    for (const achievement of uncompletedAchievements) {
      const currentProgress = progress.get(achievement.criteria.type) || 0;
      achievement.progress = (currentProgress / achievement.criteria.value) * 100;

      if (currentProgress >= achievement.criteria.value && !achievement.completed) {
        achievement.completed = true;
        achievement.completedAt = new Date();
        this.emit('achievementCompleted', { userId, achievement });
      }
    }
  }

  public getCompletedAchievements(userId: string): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.completed);
  }

  public getPendingAchievements(userId: string): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => !achievement.completed);
  }

  public getAchievementProgress(userId: string, achievementId: string): number {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return 0;

    const progress = this.getUserProgress(userId);
    const currentProgress = progress.get(achievement.criteria.type) || 0;
    return (currentProgress / achievement.criteria.value) * 100;
  }

  public resetProgress(userId: string): void {
    this.userProgress.delete(userId);
    for (const achievement of this.achievements.values()) {
      achievement.progress = 0;
      achievement.completed = false;
      achievement.completedAt = undefined;
    }
    this.emit('progressReset', userId);
  }
} 