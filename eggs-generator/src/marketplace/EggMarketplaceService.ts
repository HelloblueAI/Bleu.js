//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg, EggRarity } from '../types/egg';
import { EventEmitter } from 'events';

export interface Listing {
  id: string;
  egg: Egg;
  price: number;
  seller: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

export interface Transaction {
  id: string;
  listingId: string;
  buyer: string;
  seller: string;
  egg: Egg;
  price: number;
  timestamp: Date;
}

export class EggMarketplaceService extends EventEmitter {
  private listings: Map<string, Listing>;
  private transactions: Map<string, Transaction>;
  private readonly basePrice: Record<EggRarity, number> = {
    [EggRarity.COMMON]: 100,
    [EggRarity.UNCOMMON]: 250,
    [EggRarity.RARE]: 500,
    [EggRarity.EPIC]: 1000,
    [EggRarity.LEGENDARY]: 2500
  };

  constructor() {
    super();
    this.listings = new Map();
    this.transactions = new Map();
  }

  public createListing(egg: Egg, seller: string, price: number): Listing {
    const listing: Listing = {
      id: this.generateId(),
      egg,
      price,
      seller,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active'
    };

    this.listings.set(listing.id, listing);
    this.emit('listingCreated', listing);
    return listing;
  }

  public getListing(id: string): Listing | undefined {
    return this.listings.get(id);
  }

  public getActiveListings(): Listing[] {
    return Array.from(this.listings.values())
      .filter(listing => listing.status === 'active' && listing.expiresAt > new Date());
  }

  public getListingsByUser(userId: string): Listing[] {
    return Array.from(this.listings.values())
      .filter(listing => listing.seller === userId);
  }

  public cancelListing(id: string, userId: string): boolean {
    const listing = this.listings.get(id);
    if (!listing || listing.seller !== userId || listing.status !== 'active') {
      return false;
    }

    listing.status = 'cancelled';
    this.emit('listingCancelled', listing);
    return true;
  }

  public purchaseEgg(listingId: string, buyer: string): Transaction | undefined {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== 'active' || listing.expiresAt <= new Date()) {
      return undefined;
    }

    const transaction: Transaction = {
      id: this.generateId(),
      listingId,
      buyer,
      seller: listing.seller,
      egg: listing.egg,
      price: listing.price,
      timestamp: new Date()
    };

    listing.status = 'sold';
    this.transactions.set(transaction.id, transaction);
    this.emit('eggPurchased', transaction);
    return transaction;
  }

  public getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  public getUserTransactions(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.buyer === userId || transaction.seller === userId);
  }

  public getMarketStats(): {
    totalListings: number;
    activeListings: number;
    totalTransactions: number;
    averagePrice: number;
    volumeByRarity: Record<EggRarity, number>;
  } {
    const activeListings = this.getActiveListings();
    const transactions = Array.from(this.transactions.values());
    const volumeByRarity: Record<EggRarity, number> = {
      [EggRarity.COMMON]: 0,
      [EggRarity.UNCOMMON]: 0,
      [EggRarity.RARE]: 0,
      [EggRarity.EPIC]: 0,
      [EggRarity.LEGENDARY]: 0
    };

    transactions.forEach(transaction => {
      volumeByRarity[transaction.egg.rarity]++;
    });

    return {
      totalListings: this.listings.size,
      activeListings: activeListings.length,
      totalTransactions: transactions.length,
      averagePrice: transactions.reduce((acc, t) => acc + t.price, 0) / transactions.length || 0,
      volumeByRarity
    };
  }

  public suggestPrice(egg: Egg): number {
    const basePrice = this.basePrice[egg.rarity];
    const powerMultiplier = egg.properties.power / 100;
    const durabilityMultiplier = egg.properties.durability / 100;
    const specialAbilityMultiplier = egg.properties.specialAbility ? 1.2 : 1;

    return Math.round(basePrice * powerMultiplier * durabilityMultiplier * specialAbilityMultiplier);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public cleanupExpiredListings(): void {
    const now = new Date();
    for (const listing of this.listings.values()) {
      if (listing.status === 'active' && listing.expiresAt <= now) {
        listing.status = 'expired';
        this.emit('listingExpired', listing);
      }
    }
  }
} 