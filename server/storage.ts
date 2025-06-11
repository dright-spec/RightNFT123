import { users, rights, transactions, type User, type InsertUser, type Right, type InsertRight, type RightWithCreator, type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Right methods
  getRight(id: number): Promise<Right | undefined>;
  getRightWithCreator(id: number): Promise<RightWithCreator | undefined>;
  getRights(limit?: number, offset?: number, type?: string, isListed?: boolean): Promise<Right[]>;
  getRightsWithCreator(limit?: number, offset?: number, type?: string, isListed?: boolean): Promise<RightWithCreator[]>;
  getRightsByCreator(creatorId: number): Promise<Right[]>;
  getRightsByOwner(ownerId: number): Promise<Right[]>;
  createRight(right: InsertRight & { creatorId: number; ownerId: number }): Promise<Right>;
  updateRight(id: number, updates: Partial<Right>): Promise<Right | undefined>;
  
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByRight(rightId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rights: Map<number, Right>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentRightId: number;
  private currentTransactionId: number;
  private currentTokenId: number;

  constructor() {
    this.users = new Map();
    this.rights = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentRightId = 1;
    this.currentTransactionId = 1;
    this.currentTokenId = 1;
    
    // Seed with sample data
    this.seedData();
  }

  private seedData() {
    // Create sample users
    const user1: User = {
      id: this.currentUserId++,
      username: "creator1",
      password: "hashed_password",
      walletAddress: "0x1234567890123456789012345678901234567890",
      createdAt: new Date(),
    };
    
    const user2: User = {
      id: this.currentUserId++,
      username: "creator2", 
      password: "hashed_password",
      walletAddress: "0x2345678901234567890123456789012345678901",
      createdAt: new Date(),
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);

    // Create sample rights
    const sampleRights: (InsertRight & { creatorId: number; ownerId: number })[] = [
      {
        title: 'Streaming Rights: "Digital Dreams"',
        type: "copyright",
        description: "Exclusive streaming royalty rights for the hit song 'Digital Dreams' across all major platforms.",
        symbol: "📄",
        paysDividends: true,
        paymentAddress: "0x1234567890123456789012345678901234567890",
        paymentFrequency: "monthly",
        price: "2.5",
        currency: "ETH",
        legalDocumentHash: "QmHash1",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash1",
        creatorId: user1.id,
        ownerId: user1.id,
      },
      {
        title: "Real Estate Income Share",
        type: "royalty",
        description: "25% profit share from luxury apartment building in downtown Miami. Quarterly distributions.",
        symbol: "💰",
        paysDividends: true,
        paymentAddress: "0x2345678901234567890123456789012345678901",
        paymentFrequency: "quarterly",
        price: "18.0",
        currency: "ETH",
        legalDocumentHash: "QmHash2",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash2",
        creatorId: user2.id,
        ownerId: user2.id,
      },
      {
        title: "VIP Event Access Pass",
        type: "access",
        description: "Lifetime VIP access to all TechCon events worldwide, including backstage and speaker dinners.",
        symbol: "🔐",
        paysDividends: false,
        price: "0.8",
        currency: "ETH",
        legalDocumentHash: "QmHash3",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash3",
        creatorId: user1.id,
        ownerId: user1.id,
      },
      {
        title: "Digital Art License",
        type: "license",
        description: "Commercial licensing rights for 'Cyber Punk 2024' digital artwork. Revenue from prints and merchandise.",
        symbol: "📜",
        paysDividends: true,
        paymentAddress: "0x3456789012345678901234567890123456789012",
        paymentFrequency: "monthly",
        price: "5.2",
        currency: "ETH",
        legalDocumentHash: "QmHash4",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash4",
        creatorId: user2.id,
        ownerId: user2.id,
      },
      {
        title: "Podcast Ad Revenue",
        type: "royalty",
        description: "15% share of advertising revenue from 'Tech Talk Weekly' podcast with 500K+ monthly listeners.",
        symbol: "💰",
        paysDividends: true,
        paymentAddress: "0x4567890123456789012345678901234567890123",
        paymentFrequency: "monthly",
        price: "3.7",
        currency: "ETH",
        legalDocumentHash: "QmHash5",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash5",
        creatorId: user1.id,
        ownerId: user1.id,
      },
      {
        title: "Gaming Beta Access",
        type: "access",
        description: "Early access rights to all future game releases from StarForge Studios, including exclusive content.",
        symbol: "🔐",
        paysDividends: false,
        price: "1.2",
        currency: "ETH",
        legalDocumentHash: "QmHash6",
        legalDocumentUrl: "https://ipfs.io/ipfs/QmHash6",
        creatorId: user2.id,
        ownerId: user2.id,
      },
    ];

    sampleRights.forEach(rightData => {
      const right: Right = {
        ...rightData,
        id: this.currentRightId++,
        tokenId: this.currentTokenId++,
        metadataHash: `QmMetadata${this.currentRightId - 1}`,
        metadataUrl: `https://ipfs.io/ipfs/QmMetadata${this.currentRightId - 1}`,
        isListed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.rights.set(right.id, right);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getRight(id: number): Promise<Right | undefined> {
    return this.rights.get(id);
  }

  async getRightWithCreator(id: number): Promise<RightWithCreator | undefined> {
    const right = this.rights.get(id);
    if (!right) return undefined;
    
    const creator = this.users.get(right.creatorId!);
    const owner = this.users.get(right.ownerId!);
    
    if (!creator || !owner) return undefined;
    
    return { ...right, creator, owner };
  }

  async getRights(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<Right[]> {
    let allRights = Array.from(this.rights.values());
    
    if (type) {
      allRights = allRights.filter(right => right.type === type);
    }
    
    if (isListed !== undefined) {
      allRights = allRights.filter(right => right.isListed === isListed);
    }
    
    return allRights
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(offset, offset + limit);
  }

  async getRightsWithCreator(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<RightWithCreator[]> {
    const rights = await this.getRights(limit, offset, type, isListed);
    const rightsWithCreator: RightWithCreator[] = [];
    
    for (const right of rights) {
      const creator = this.users.get(right.creatorId!);
      const owner = this.users.get(right.ownerId!);
      
      if (creator && owner) {
        rightsWithCreator.push({ ...right, creator, owner });
      }
    }
    
    return rightsWithCreator;
  }

  async getRightsByCreator(creatorId: number): Promise<Right[]> {
    return Array.from(this.rights.values()).filter(right => right.creatorId === creatorId);
  }

  async getRightsByOwner(ownerId: number): Promise<Right[]> {
    return Array.from(this.rights.values()).filter(right => right.ownerId === ownerId);
  }

  async createRight(rightData: InsertRight & { creatorId: number; ownerId: number }): Promise<Right> {
    const id = this.currentRightId++;
    const tokenId = this.currentTokenId++;
    
    const right: Right = {
      ...rightData,
      id,
      tokenId,
      metadataHash: `QmMetadata${id}`,
      metadataUrl: `https://ipfs.io/ipfs/QmMetadata${id}`,
      isListed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.rights.set(id, right);
    return right;
  }

  async updateRight(id: number, updates: Partial<Right>): Promise<Right | undefined> {
    const right = this.rights.get(id);
    if (!right) return undefined;
    
    const updatedRight = { ...right, ...updates, updatedAt: new Date() };
    this.rights.set(id, updatedRight);
    return updatedRight;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByRight(rightId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(tx => tx.rightId === rightId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();
