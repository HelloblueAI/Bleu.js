//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggElement, EggOrigin, EggRarity, EggProperties } from '../types/egg';
import { EventEmitter } from 'events';

export interface EggValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class EggValidator extends EventEmitter {
  private static readonly POWER_RANGES: Record<EggRarity, [number, number]> = {
    [EggRarity.COMMON]: [1, 50],
    [EggRarity.UNCOMMON]: [30, 100],
    [EggRarity.RARE]: [80, 150],
    [EggRarity.EPIC]: [130, 200],
    [EggRarity.LEGENDARY]: [180, 250]
  };

  private static readonly DURABILITY_RANGES: Record<EggRarity, [number, number]> = {
    [EggRarity.COMMON]: [1, 40],
    [EggRarity.UNCOMMON]: [20, 80],
    [EggRarity.RARE]: [60, 120],
    [EggRarity.EPIC]: [100, 160],
    [EggRarity.LEGENDARY]: [140, 200]
  };

  constructor() {
    super();
  }

  public validate(egg: Egg): EggValidationResult {
    const result: EggValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate required fields
    if (!egg.id) {
      result.errors.push('Egg ID is required');
    }

    // Validate rarity
    if (!Object.values(EggRarity).includes(egg.rarity)) {
      result.errors.push(`Invalid rarity: ${egg.rarity}`);
    }

    // Validate element
    if (!Object.values(EggElement).includes(egg.element)) {
      result.errors.push(`Invalid element: ${egg.element}`);
    }

    // Validate properties
    this.validateProperties(egg.properties, egg.rarity, result);

    // Validate metadata
    this.validateMetadata(egg.metadata, result);

    // Set final validation status
    result.isValid = result.errors.length === 0;

    // Emit validation event
    this.emit('eggValidated', { egg, result });

    return result;
  }

  private validateProperties(
    properties: EggProperties,
    rarity: EggRarity,
    result: EggValidationResult
  ): void {
    // Validate power range
    const [minPower, maxPower] = EggValidator.POWER_RANGES[rarity];
    if (properties.power < minPower || properties.power > maxPower) {
      result.errors.push(
        `Power value ${properties.power} is outside the valid range [${minPower}, ${maxPower}] for ${rarity} rarity`
      );
    }

    // Validate durability range
    const [minDurability, maxDurability] = EggValidator.DURABILITY_RANGES[rarity];
    if (properties.durability < minDurability || properties.durability > maxDurability) {
      result.errors.push(
        `Durability value ${properties.durability} is outside the valid range [${minDurability}, ${maxDurability}] for ${rarity} rarity`
      );
    }

    // Validate speed
    if (properties.speed < 1 || properties.speed > 100) {
      result.errors.push('Speed must be between 1 and 100');
    }

    // Validate intelligence
    if (properties.intelligence < 1 || properties.intelligence > 100) {
      result.errors.push('Intelligence must be between 1 and 100');
    }

    // Validate luck
    if (properties.luck < 1 || properties.luck > 100) {
      result.errors.push('Luck must be between 1 and 100');
    }

    // Validate special ability
    if (properties.specialAbility && typeof properties.specialAbility !== 'string') {
      result.errors.push('Special ability must be a string');
    }
  }

  private validateMetadata(
    metadata: {
      origin: EggOrigin;
      generation: number;
      parents: string[];
      createdAt: Date;
      tags: string[];
    },
    result: EggValidationResult
  ): void {
    // Validate origin
    if (!Object.values(EggOrigin).includes(metadata.origin)) {
      result.errors.push(`Invalid origin: ${metadata.origin}`);
    }

    // Validate generation
    if (!Number.isInteger(metadata.generation) || metadata.generation < 0) {
      result.errors.push('Generation must be a non-negative integer');
    }

    // Validate parents array
    if (!Array.isArray(metadata.parents)) {
      result.errors.push('Parents must be an array');
    }

    // Validate createdAt date
    if (!(metadata.createdAt instanceof Date)) {
      result.errors.push('CreatedAt must be a valid date');
    }

    // Validate tags array
    if (!Array.isArray(metadata.tags)) {
      result.errors.push('Tags must be an array');
    } else {
      metadata.tags.forEach(tag => {
        if (typeof tag !== 'string') {
          result.errors.push('All tags must be strings');
        }
      });
    }
  }

  public getValidRarityRanges(): Record<EggRarity, [number, number]> {
    return { ...EggValidator.POWER_RANGES };
  }

  public getValidDurabilityRanges(): Record<EggRarity, [number, number]> {
    return { ...EggValidator.DURABILITY_RANGES };
  }
} 