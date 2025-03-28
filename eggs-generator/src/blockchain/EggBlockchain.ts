//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { createHelia } from 'helia';
import { json } from '@helia/json';
import { Egg, EggRarity, EggElement } from '../types/egg';
import { EventEmitter } from 'events';

interface BlockchainConfig {
  nodeUrl: string;
  networkId: string;
  contractAddress: string;
}

interface BlockchainMetadata {
  version: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

interface EggTransaction {
  id: string;
  eggId: string;
  operation: 'create' | 'evolve' | 'breed' | 'transfer';
  from: string;
  to: string;
  metadata: BlockchainMetadata;
}

export class EggBlockchainService extends EventEmitter {
  private helia: any;
  private jsonBlockstore: any;
  private readonly config: BlockchainConfig;
  private transactions: Map<string, EggTransaction>;

  constructor(config: BlockchainConfig) {
    super();
    this.config = config;
    this.transactions = new Map();
  }

  public async initialize(): Promise<void> {
    try {
      this.helia = await createHelia();
      this.jsonBlockstore = json(this.helia);
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to initialize blockchain service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async storeEgg(egg: Egg, owner: string): Promise<string> {
    try {
      const eggData = {
        id: egg.id,
        rarity: egg.rarity,
        element: egg.element,
        properties: egg.properties,
        metadata: egg.metadata
      };

      const cid = await this.jsonBlockstore.add(eggData);
      
      const transaction: EggTransaction = {
        id: `tx_${Date.now()}`,
        eggId: egg.id,
        operation: 'create',
        from: '0x0',
        to: owner,
        metadata: {
          version: '1.0',
          timestamp: Date.now(),
          blockNumber: 0,
          transactionHash: cid.toString()
        }
      };

      this.transactions.set(transaction.id, transaction);
      this.emit('eggStored', { egg, cid: cid.toString(), transaction });

      return cid.toString();
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to store egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async retrieveEgg(cid: string): Promise<Egg | null> {
    try {
      const eggData = await this.jsonBlockstore.get(cid);
      
      if (!eggData) {
        return null;
      }

      return {
        id: eggData.id,
        rarity: eggData.rarity as EggRarity,
        element: eggData.element as EggElement,
        properties: eggData.properties,
        metadata: eggData.metadata
      };
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to retrieve egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async transferEgg(eggId: string, from: string, to: string): Promise<void> {
    try {
      const transaction: EggTransaction = {
        id: `tx_${Date.now()}`,
        eggId,
        operation: 'transfer',
        from,
        to,
        metadata: {
          version: '1.0',
          timestamp: Date.now(),
          blockNumber: 0,
          transactionHash: ''
        }
      };

      this.transactions.set(transaction.id, transaction);
      this.emit('eggTransferred', { eggId, from, to, transaction });
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to transfer egg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getTransactionHistory(eggId: string): Promise<EggTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.eggId === eggId)
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
  }

  public async verifyOwnership(eggId: string, owner: string): Promise<boolean> {
    const transactions = await this.getTransactionHistory(eggId);
    if (transactions.length === 0) {
      return false;
    }

    const latestTransaction = transactions[0];
    return latestTransaction.to === owner;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.helia) {
        await this.helia.stop();
        this.emit('disconnected');
      }
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 