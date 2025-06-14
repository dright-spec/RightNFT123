import type { User, Right, Transaction, InsertUser, InsertRight, InsertTransaction, RightWithCreator } from "@shared/schema";

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

export class CleanStorage implements IStorage {
  private users: Map<number, User>;
  private rights: Map<number, Right>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentRightId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.rights = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentRightId = 1;
    this.currentTransactionId = 1;
    
    // No mock data - clean start for real wallet connections
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.walletAddress === walletAddress) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      id: this.currentUserId++,
      username: insertUser.username,
      password: insertUser.password || "",
      walletAddress: insertUser.walletAddress,
      email: insertUser.email || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      coverImageUrl: null,
      bio: insertUser.bio || null,
      website: insertUser.website || null,
      twitter: insertUser.twitter || null,
      instagram: insertUser.instagram || null,
      youtube: insertUser.youtube || null,
      isVerified: false,
      isBanned: false,
      totalEarnings: "0",
      totalSales: 0,
      followerCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getRight(id: number): Promise<Right | undefined> {
    return this.rights.get(id);
  }

  async getRightWithCreator(id: number): Promise<RightWithCreator | undefined> {
    const right = this.rights.get(id);
    if (!right) return undefined;

    const creator = this.users.get(right.creatorId);
    const owner = this.users.get(right.ownerId);
    
    if (!creator || !owner) return undefined;

    return {
      ...right,
      creator,
      owner
    };
  }

  async getRights(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<Right[]> {
    let rights = Array.from(this.rights.values());
    
    if (type) {
      rights = rights.filter(r => r.type === type);
    }
    
    if (isListed !== undefined) {
      rights = rights.filter(r => r.listingType !== null);
    }
    
    return rights.slice(offset, offset + limit);
  }

  async getRightsWithCreator(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<RightWithCreator[]> {
    const rights = await this.getRights(limit, offset, type, isListed);
    const rightsWithCreator: RightWithCreator[] = [];
    
    for (const right of rights) {
      const creator = this.users.get(right.creatorId);
      const owner = this.users.get(right.ownerId);
      
      if (creator && owner) {
        rightsWithCreator.push({
          ...right,
          creator,
          owner
        });
      }
    }
    
    return rightsWithCreator;
  }

  async getRightsByCreator(creatorId: number): Promise<Right[]> {
    return Array.from(this.rights.values()).filter(r => r.creatorId === creatorId);
  }

  async getRightsByOwner(ownerId: number): Promise<Right[]> {
    return Array.from(this.rights.values()).filter(r => r.ownerId === ownerId);
  }

  async createRight(rightData: InsertRight & { creatorId: number; ownerId: number }): Promise<Right> {
    const right: Right = {
      id: this.currentRightId++,
      tokenId: null,
      title: rightData.title,
      type: rightData.type,
      description: rightData.description,
      symbol: rightData.symbol,
      categoryId: rightData.categoryId || null,
      tags: rightData.tags || null,
      imageUrl: rightData.imageUrl || null,
      paysDividends: rightData.paysDividends || false,
      paymentAddress: rightData.paymentAddress || null,
      paymentFrequency: rightData.paymentFrequency || null,
      revenueDistributionMethod: rightData.revenueDistributionMethod || null,
      distributionPercentage: rightData.distributionPercentage || null,
      minimumDistribution: rightData.minimumDistribution || null,
      distributionDetails: rightData.distributionDetails || null,
      listingType: rightData.listingType || null,
      price: rightData.price || null,
      currency: rightData.currency || null,
      contentFileHash: rightData.contentFileHash || null,
      contentFileUrl: rightData.contentFileUrl || null,
      verificationStatus: "pending",
      verifiedAt: null,
      verifiedBy: null,
      verificationNotes: rightData.verificationNotes || null,
      legalDocumentHash: rightData.legalDocumentHash || null,
      legalDocumentUrl: rightData.legalDocumentUrl || null,
      ownershipDocumentHash: rightData.ownershipDocumentHash || null,
      ownershipDocumentUrl: rightData.ownershipDocumentUrl || null,
      hederaAccountId: null,
      hederaTokenId: null,
      hederaTransactionId: null,
      hederaNftSerialNumber: null,
      hederaNetwork: null,
      creatorId: rightData.creatorId,
      ownerId: rightData.ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.rights.set(right.id, right);
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
    return Array.from(this.transactions.values()).filter(t => t.rightId === rightId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      rightId: insertTransaction.rightId,
      fromUserId: insertTransaction.fromUserId || null,
      toUserId: insertTransaction.toUserId || null,
      type: insertTransaction.type,
      amount: insertTransaction.amount || null,
      currency: insertTransaction.currency || null,
      status: insertTransaction.status || "pending",
      hederaTransactionId: insertTransaction.hederaTransactionId || null,
      hederaAccountId: insertTransaction.hederaAccountId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
}

export const storage = new CleanStorage();