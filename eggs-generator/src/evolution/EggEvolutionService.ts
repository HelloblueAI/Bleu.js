//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggProperties, EggRarity, EggElement, EggOrigin } from '../types/egg';
import { EggValidator } from '../validation/EggValidator';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface EvolutionResult {
  success: boolean;
  egg?: Egg;
  error?: string;
}

export class EggEvolutionService extends EventEmitter {
  private readonly validator: EggValidator;
  private readonly evolutionProbabilities: Record<EggRarity, number> = {
    [EggRarity.COMMON]: 0.1,
    [EggRarity.UNCOMMON]: 0.08,
    [EggRarity.RARE]: 0.05,
    [EggRarity.EPIC]: 0.02,
    [EggRarity.LEGENDARY]: 0.01
  };

  private readonly breedingProbabilities: Record<EggRarity, number> = {
    [EggRarity.COMMON]: 0.8,
    [EggRarity.UNCOMMON]: 0.6,
    [EggRarity.RARE]: 0.4,
    [EggRarity.EPIC]: 0.2,
    [EggRarity.LEGENDARY]: 0.1
  };

  constructor() {
    super();
    this.validator = new EggValidator();
  }

  public evolveEgg(egg: Egg): EvolutionResult {
    try {
      // Validate input egg
      const validation = this.validator.validate(egg);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid egg: ${validation.errors.join(', ')}`
        };
      }

      // Check if evolution is possible
      if (!this.canEvolve(egg)) {
        return {
          success: false,
          error: 'Egg cannot evolve further'
        };
      }

      // Calculate evolution probability
      const evolutionProbability = this.evolutionProbabilities[egg.rarity];
      if (Math.random() > evolutionProbability) {
        return {
          success: false,
          error: 'Evolution failed due to probability check'
        };
      }

      // Create evolved egg
      const evolvedEgg = this.createEvolvedEgg(egg);

      // Validate evolved egg
      const evolvedValidation = this.validator.validate(evolvedEgg);
      if (!evolvedValidation.isValid) {
        return {
          success: false,
          error: `Invalid evolved egg: ${evolvedValidation.errors.join(', ')}`
        };
      }

      this.emit('eggEvolved', { original: egg, evolved: evolvedEgg });
      return {
        success: true,
        egg: evolvedEgg
      };
    } catch (error) {
      return {
        success: false,
        error: `Evolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public breedEggs(parent1: Egg, parent2: Egg): EvolutionResult {
    try {
      // Validate parent eggs
      const validation1 = this.validator.validate(parent1);
      const validation2 = this.validator.validate(parent2);

      if (!validation1.isValid) {
        return {
          success: false,
          error: `Invalid parent 1: ${validation1.errors.join(', ')}`
        };
      }

      if (!validation2.isValid) {
        return {
          success: false,
          error: `Invalid parent 2: ${validation2.errors.join(', ')}`
        };
      }

      // Check if breeding is possible
      if (!this.canBreed(parent1, parent2)) {
        return {
          success: false,
          error: 'Parents cannot breed'
        };
      }

      // Calculate breeding probability
      const breedingProbability = Math.min(
        this.breedingProbabilities[parent1.rarity],
        this.breedingProbabilities[parent2.rarity]
      );

      if (Math.random() > breedingProbability) {
        return {
          success: false,
          error: 'Breeding failed due to probability check'
        };
      }

      // Create offspring
      const offspring = this.createOffspring(parent1, parent2);

      // Validate offspring
      const offspringValidation = this.validator.validate(offspring);
      if (!offspringValidation.isValid) {
        return {
          success: false,
          error: `Invalid offspring: ${offspringValidation.errors.join(', ')}`
        };
      }

      this.emit('eggsBreed', { parent1, parent2, offspring });
      return {
        success: true,
        egg: offspring
      };
    } catch (error) {
      return {
        success: false,
        error: `Breeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private canEvolve(egg: Egg): boolean {
    return egg.rarity !== EggRarity.LEGENDARY;
  }

  private canBreed(parent1: Egg, parent2: Egg): boolean {
    return parent1.id !== parent2.id;
  }

  private createEvolvedEgg(egg: Egg): Egg {
    const nextRarity = this.getNextRarity(egg.rarity);
    const evolvedProperties = this.calculateEvolvedProperties(egg.properties);

    return {
      id: uuidv4(),
      dna: this.generateDNA(),
      rarity: nextRarity,
      element: egg.element,
      properties: evolvedProperties,
      metadata: {
        origin: EggOrigin.EVOLVED,
        generation: egg.metadata.generation + 1,
        parents: [egg.id],
        createdAt: new Date(),
        tags: ['evolved', egg.metadata.tags].flat()
      }
    };
  }

  private createOffspring(parent1: Egg, parent2: Egg): Egg {
    const offspringRarity = this.calculateOffspringRarity(parent1.rarity, parent2.rarity);
    const offspringElement = this.calculateOffspringElement(parent1.element, parent2.element);
    const offspringProperties = this.calculateOffspringProperties(parent1.properties, parent2.properties);

    return {
      id: uuidv4(),
      dna: this.generateDNA(),
      rarity: offspringRarity,
      element: offspringElement,
      properties: offspringProperties,
      metadata: {
        origin: EggOrigin.BRED,
        generation: Math.max(parent1.metadata.generation, parent2.metadata.generation) + 1,
        parents: [parent1.id, parent2.id],
        createdAt: new Date(),
        tags: ['offspring', parent1.metadata.tags, parent2.metadata.tags].flat()
      }
    };
  }

  private calculateEvolvedProperties(properties: EggProperties): EggProperties {
    return {
      power: Math.min(properties.power * 1.5, 250),
      durability: Math.min(properties.durability * 1.3, 200),
      speed: Math.min(properties.speed * 1.2, 100),
      intelligence: Math.min(properties.intelligence * 1.2, 100),
      luck: Math.min(properties.luck * 1.1, 100),
      specialAbility: properties.specialAbility
    };
  }

  private calculateOffspringProperties(parent1Props: EggProperties, parent2Props: EggProperties): EggProperties {
    return {
      power: Math.floor((parent1Props.power + parent2Props.power) / 2),
      durability: Math.floor((parent1Props.durability + parent2Props.durability) / 2),
      speed: Math.floor((parent1Props.speed + parent2Props.speed) / 2),
      intelligence: Math.floor((parent1Props.intelligence + parent2Props.intelligence) / 2),
      luck: Math.floor((parent1Props.luck + parent2Props.luck) / 2),
      specialAbility: Math.random() > 0.5 ? parent1Props.specialAbility : parent2Props.specialAbility
    };
  }

  private getNextRarity(currentRarity: EggRarity): EggRarity {
    const rarityOrder = [
      EggRarity.COMMON,
      EggRarity.UNCOMMON,
      EggRarity.RARE,
      EggRarity.EPIC,
      EggRarity.LEGENDARY
    ];

    const currentIndex = rarityOrder.indexOf(currentRarity);
    return currentIndex < rarityOrder.length - 1 ? rarityOrder[currentIndex + 1] : currentRarity;
  }

  private calculateOffspringRarity(rarity1: EggRarity, rarity2: EggRarity): EggRarity {
    const rarityOrder = [
      EggRarity.COMMON,
      EggRarity.UNCOMMON,
      EggRarity.RARE,
      EggRarity.EPIC,
      EggRarity.LEGENDARY
    ];

    const index1 = rarityOrder.indexOf(rarity1);
    const index2 = rarityOrder.indexOf(rarity2);
    const averageIndex = Math.floor((index1 + index2) / 2);

    return rarityOrder[averageIndex];
  }

  private calculateOffspringElement(element1: EggElement, element2: EggElement): EggElement {
    if (element1 === element2) {
      return element1;
    }

    const elementCombinations: Record<string, EggElement> = {
      [`${EggElement.FIRE}-${EggElement.WATER}`]: EggElement.NEUTRAL,
      [`${EggElement.FIRE}-${EggElement.EARTH}`]: EggElement.DARK,
      [`${EggElement.FIRE}-${EggElement.AIR}`]: EggElement.LIGHT,
      [`${EggElement.WATER}-${EggElement.EARTH}`]: EggElement.NEUTRAL,
      [`${EggElement.WATER}-${EggElement.AIR}`]: EggElement.LIGHT,
      [`${EggElement.EARTH}-${EggElement.AIR}`]: EggElement.DARK
    };

    const combination = `${element1}-${element2}`;
    return elementCombinations[combination] || EggElement.NEUTRAL;
  }

  private generateDNA(): string {
    return uuidv4().replace(/-/g, '').toUpperCase();
  }
} 