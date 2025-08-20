import type { User, Right, Transaction, InsertUser, InsertRight, InsertTransaction, RightWithCreator } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(userData: {
    walletAddress: string;
    hederaAccountId?: string;
    walletType?: string;
    username?: string;
  }): Promise<User>;
  
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
  
  // Notification methods
  createNotification(notification: any): Promise<any>;
  getUserNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
}

export class MemStorage implements IStorage {
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
    
    // Clean start - no mock data to interfere with real wallet connections
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
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
      walletAddress: insertUser.walletAddress || null,
      email: insertUser.email || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      coverImageUrl: null,
      bio: insertUser.bio || null,
      website: insertUser.website || null,
      twitter: insertUser.twitter || null,
      instagram: insertUser.instagram || null,
      youtube: null,
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

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.fromUserId === userId || transaction.toUserId === userId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      rightId: insertTransaction.rightId || null,
      fromUserId: insertTransaction.fromUserId || null,
      toUserId: insertTransaction.toUserId || null,
      type: insertTransaction.type,
      price: insertTransaction.price || null,
      currency: insertTransaction.currency || null,
      transactionHash: insertTransaction.transactionHash || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  // Mock notification methods (for now)
  async createNotification(notification: any): Promise<any> {
    console.log('Notification created:', notification);
    return { id: Date.now(), ...notification };
  }

  async getUserNotifications(userId: number): Promise<any[]> {
    // Production: Return empty array - notifications will be created as users interact
    return [];
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    console.log('Notification marked as read:', notificationId);
  }
}

import { db } from "./db";
import { eq, desc, asc, like, and, or, isNull, isNotNull } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database connection handled by db.ts
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: {
    walletAddress: string;
    hederaAccountId?: string;
    walletType?: string;
    username?: string;
  }): Promise<User> {
    // Check if user exists by wallet address or Hedera account ID
    let existingUser = await this.getUserByWalletAddress(userData.walletAddress);
    
    if (!existingUser && userData.hederaAccountId) {
      const [user] = await db.select().from(users).where(eq(users.hederaAccountId, userData.hederaAccountId));
      existingUser = user || undefined;
    }

    if (existingUser) {
      // Update existing user's login timestamp
      const [updatedUser] = await db
        .update(users)
        .set({
          walletAddress: userData.walletAddress,
          hederaAccountId: userData.hederaAccountId,
          walletType: userData.walletType || 'hashpack',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const newUser = await this.createUser({
        walletAddress: userData.walletAddress,
        hederaAccountId: userData.hederaAccountId,
        walletType: userData.walletType || 'hashpack',
        networkType: 'hedera',
        username: userData.username || `hedera_${userData.hederaAccountId?.replace(/\./g, '_') || Date.now()}`,
        password: 'wallet_auth', // Placeholder for wallet-authenticated users
        displayName: `Hedera User ${userData.hederaAccountId || ''}`,
      });
      return newUser;
    }
  }

  async getRight(id: number): Promise<Right | undefined> {
    const [right] = await db.select().from(rights).where(eq(rights.id, id));
    return right || undefined;
  }

  async getRightWithCreator(id: number): Promise<RightWithCreator | undefined> {
    const result = await db
      .select()
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id))
      .where(eq(rights.id, id));

    if (result.length === 0) return undefined;

    const right = result[0].rights;
    const creator = result[0].users;

    return {
      ...right,
      creator: creator!,
      owner: creator!, // Assuming creator is also owner initially
    };
  }

  async getRights(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<Right[]> {
    let query = db.select().from(rights);

    const conditions = [];
    if (type) conditions.push(eq(rights.type, type));
    if (isListed !== undefined) conditions.push(eq(rights.isListed, isListed));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.limit(limit).offset(offset).orderBy(desc(rights.createdAt));
  }

  async getRightsWithCreator(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<RightWithCreator[]> {
    let query = db
      .select()
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id));

    const conditions = [];
    if (type) conditions.push(eq(rights.type, type));
    if (isListed !== undefined) conditions.push(eq(rights.isListed, isListed));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.limit(limit).offset(offset).orderBy(desc(rights.createdAt));

    return result.map(row => ({
      ...row.rights,
      creator: row.users!,
      owner: row.users!, // Assuming creator is also owner initially
    }));
  }

  async getRightsByCreator(creatorId: number): Promise<Right[]> {
    return await db.select().from(rights).where(eq(rights.creatorId, creatorId));
  }

  async getRightsByOwner(ownerId: number): Promise<Right[]> {
    return await db.select().from(rights).where(eq(rights.ownerId, ownerId));
  }

  async createRight(rightData: InsertRight & { creatorId: number; ownerId: number }): Promise<Right> {
    const [right] = await db
      .insert(rights)
      .values({
        ...rightData,
        symbol: rightTypeSymbols[rightData.type as keyof typeof rightTypeSymbols] || "📄",
      })
      .returning();
    return right;
  }

  async updateRight(id: number, updates: Partial<Right>): Promise<Right | undefined> {
    const [right] = await db
      .update(rights)
      .set(updates)
      .where(eq(rights.id, id))
      .returning();
    return right || undefined;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByRight(rightId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.rightId, rightId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
}

export const storage = new DatabaseStorage();