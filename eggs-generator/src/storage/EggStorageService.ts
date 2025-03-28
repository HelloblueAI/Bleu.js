//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggAnalytics } from '../types/egg';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

interface StorageConfig {
  baseDir: string;
  backupDir: string;
  maxBackups: number;
  compressionEnabled: boolean;
}

export class EggStorageService extends EventEmitter {
  private config: StorageConfig;
  private analytics: EggAnalytics;
  private readonly EGG_FILE_EXTENSION = '.egg.json';
  private readonly BACKUP_FILE_EXTENSION = '.backup.json';

  constructor(config: Partial<StorageConfig> = {}) {
    super();
    this.config = {
      baseDir: config.baseDir || path.join(process.cwd(), 'data', 'eggs'),
      backupDir: config.backupDir || path.join(process.cwd(), 'data', 'backups'),
      maxBackups: config.maxBackups || 5,
      compressionEnabled: config.compressionEnabled || true
    };
    this.analytics = this.initializeAnalytics();
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.baseDir, { recursive: true });
      await fs.mkdir(this.config.backupDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create storage directories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private initializeAnalytics(): EggAnalytics {
    return {
      totalGenerated: 0,
      rarityDistribution: {
        common: 0,
        uncommon: 0,
        rare: 0,
        legendary: 0,
        mythical: 0
      },
      elementDistribution: {
        fire: 0,
        water: 0,
        earth: 0,
        air: 0,
        lightning: 0,
        cosmic: 0,
        void: 0
      },
      averagePower: 0,
      averageDurability: 0,
      specialAbilityDistribution: {},
      generationTime: 0,
      successRate: 100
    };
  }

  public async saveEgg(egg: Egg): Promise<void> {
    try {
      const filePath = this.getEggFilePath(egg.id);
      const data = JSON.stringify(egg, null, 2);
      
      // Create backup before saving
      await this.createBackup(egg.id);

      // Save the egg
      await fs.writeFile(filePath, data);
      
      // Update analytics
      this.updateAnalytics(egg);
      
      this.emit('eggSaved', { egg, filePath });
    } catch (error) {
      throw new Error(`Failed to save egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async loadEgg(eggId: string): Promise<Egg> {
    try {
      const filePath = this.getEggFilePath(eggId);
      const data = await fs.readFile(filePath, 'utf-8');
      const egg = JSON.parse(data) as Egg;
      
      this.emit('eggLoaded', { egg, filePath });
      return egg;
    } catch (error) {
      throw new Error(`Failed to load egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async deleteEgg(eggId: string): Promise<void> {
    try {
      const filePath = this.getEggFilePath(eggId);
      await fs.unlink(filePath);
      
      this.emit('eggDeleted', { eggId, filePath });
    } catch (error) {
      throw new Error(`Failed to delete egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async listEggs(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.baseDir);
      return files
        .filter(file => file.endsWith(this.EGG_FILE_EXTENSION))
        .map(file => file.replace(this.EGG_FILE_EXTENSION, ''));
    } catch (error) {
      throw new Error(`Failed to list eggs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async searchEggs(query: Partial<Egg>): Promise<Egg[]> {
    try {
      const eggIds = await this.listEggs();
      const eggs = await Promise.all(eggIds.map(id => this.loadEgg(id)));
      
      return eggs.filter(egg => this.matchesQuery(egg, query));
    } catch (error) {
      throw new Error(`Failed to search eggs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getAnalytics(): Promise<EggAnalytics> {
    return { ...this.analytics };
  }

  public async exportAnalytics(filePath: string): Promise<void> {
    try {
      const data = JSON.stringify(this.analytics, null, 2);
      await fs.writeFile(filePath, data);
      
      this.emit('analyticsExported', { filePath });
    } catch (error) {
      throw new Error(`Failed to export analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getEggFilePath(eggId: string): string {
    return path.join(this.config.baseDir, `${eggId}${this.EGG_FILE_EXTENSION}`);
  }

  private async createBackup(eggId: string): Promise<void> {
    try {
      const backupPath = path.join(
        this.config.backupDir,
        `${eggId}_${Date.now()}${this.BACKUP_FILE_EXTENSION}`
      );

      const egg = await this.loadEgg(eggId);
      const data = JSON.stringify(egg, null, 2);
      await fs.writeFile(backupPath, data);

      // Clean up old backups
      await this.cleanupOldBackups(eggId);
    } catch (error) {
      console.warn(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanupOldBackups(eggId: string): Promise<void> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const eggBackups = files
        .filter(file => file.startsWith(eggId) && file.endsWith(this.BACKUP_FILE_EXTENSION))
        .sort()
        .reverse();

      if (eggBackups.length > this.config.maxBackups) {
        const backupsToDelete = eggBackups.slice(this.config.maxBackups);
        await Promise.all(
          backupsToDelete.map(file =>
            fs.unlink(path.join(this.config.backupDir, file))
          )
        );
      }
    } catch (error) {
      console.warn(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateAnalytics(egg: Egg): void {
    this.analytics.totalGenerated++;
    this.analytics.rarityDistribution[egg.rarity as keyof typeof this.analytics.rarityDistribution]++;
    this.analytics.elementDistribution[egg.element as keyof typeof this.analytics.elementDistribution]++;
    
    const ability = egg.properties.specialAbility;
    this.analytics.specialAbilityDistribution[ability] = 
      (this.analytics.specialAbilityDistribution[ability] || 0) + 1;

    // Update averages
    const totalPower = this.analytics.averagePower * (this.analytics.totalGenerated - 1) + egg.properties.power;
    const totalDurability = this.analytics.averageDurability * (this.analytics.totalGenerated - 1) + egg.properties.durability;
    this.analytics.averagePower = totalPower / this.analytics.totalGenerated;
    this.analytics.averageDurability = totalDurability / this.analytics.totalGenerated;
  }

  private matchesQuery(egg: Egg, query: Partial<Egg>): boolean {
    return Object.entries(query).every(([key, value]) => {
      if (key === 'properties') {
        return Object.entries(value as Egg['properties']).every(
          ([propKey, propValue]) => egg.properties[propKey as keyof Egg['properties']] === propValue
        );
      }
      if (key === 'metadata') {
        return Object.entries(value as Egg['metadata']).every(
          ([metaKey, metaValue]) => egg.metadata[metaKey as keyof Egg['metadata']] === metaValue
        );
      }
      return egg[key as keyof Egg] === value;
    });
  }
} 