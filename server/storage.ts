import type { User, Right, Transaction, InsertUser, InsertRight, InsertTransaction, RightWithCreator } from "@shared/schema";
import { rightTypeSymbols } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  getUserByHederaAccountId(hederaAccountId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
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
  getRightsByCollectionId(collectionId: string): Promise<Right[]>;
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
  
  // Category methods
  getCategories(): Promise<any[]>;
  
  // Search methods
  searchRights(query: string, options: { limit: number; offset: number }): Promise<Right[]>;
  
  // Bidding methods
  placeBid(bid: any): Promise<any>;
  getBidsForRight(rightId: number): Promise<any[]>;
  
  // Favorites methods
  addToFavorites(userId: number, rightId: number): Promise<void>;
  removeFromFavorites(userId: number, rightId: number): Promise<void>;
  
  // Stake methods
  getStake(id: number): Promise<any>;
  createRevenueDistribution(distribution: any): Promise<any>;
  updateStake(id: number, updates: any): Promise<any>;
}

export class MemStorage {
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
    
    // Add sample pending rights for admin review
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const sampleUser: User = {
      id: 1,
      username: "test_creator",
      displayName: "Test Creator",
      password: "wallet_auth",
      walletAddress: "0x1234567890abcdef",
      hederaAccountId: "0.0.123456",
      hederaCollectionTokenId: null,
      collectionCreationStatus: "not_created",
      collectionCreatedAt: null,
      walletType: "hashpack",
      networkType: "hedera",
      email: null,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      profileImageUrl: null,
      coverImageUrl: null,
      bio: null,
      website: null,
      twitter: null,
      instagram: null,
      isVerified: false,
      isBanned: false,
      totalEarnings: "0",
      totalSales: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, sampleUser);

    // Create sample pending rights
    const pendingRights: Right[] = [
      {
        id: 1,
        contractAddress: null,
        tokenId: null,
        transactionHash: null,
        ownerAddress: null,
        hederaTokenId: null,
        hederaSerialNumber: null,
        blockNumber: null,
        chainId: 295,
        networkType: "hedera",
        title: "Music Copyright - Original Song",
        type: "copyright",
        description: "Original music composition rights for 'Digital Dreams'",
        symbol: "©️",
        categoryId: null,
        tags: ["music", "original", "composition"],
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
        paysDividends: true,
        paymentAddress: null,
        paymentFrequency: "monthly",
        revenueDistributionMethod: "automatic",
        distributionPercentage: 85,
        minimumDistribution: "100",
        distributionDetails: "Monthly royalty payments from streaming platforms",
        listingType: "fixed",
        price: "500",
        currency: "HBAR",
        contentFileHash: "QmTestHash1",
        contentFileUrl: "https://example.com/audio1.mp3",
        contentFileName: "digital_dreams.mp3",
        contentFileSize: 5242880,
        contentFileType: "audio/mp3",
        verificationStatus: "pending",
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
        ownershipDocumentHash: "QmOwnershipDoc1",
        ownershipDocumentUrl: "https://example.com/ownership1.pdf",
        mintingStatus: "not_started",
        metadataUri: null,
        isListed: false,
        auctionEndTime: null,
        auctionDuration: null,
        startingBid: null,
        reservePrice: null,
        minBidAmount: null,
        highestBidAmount: null,
        highestBidderId: null,
        royaltyPercentage: "7.5",
        views: 0,
        favorites: 0,
        metadataHash: null,
        metadataUrl: null,
        creatorId: 1,
        ownerId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        tokenId: null,
        title: "Film Licensing Rights",
        type: "license",
        description: "Distribution rights for independent film 'Tomorrow's Echo'",
        symbol: "🎬",
        categoryId: null,
        tags: ["film", "distribution", "licensing"],
        imageUrl: "https://images.unsplash.com/photo-1489599162022-98e8ac14ceb4?w=400",
        paysDividends: false,
        paymentAddress: null,
        paymentFrequency: null,
        revenueDistributionMethod: null,
        distributionPercentage: null,
        minimumDistribution: null,
        distributionDetails: null,
        listingType: "auction",
        price: "2000",
        currency: "HBAR",
        contentFileHash: "QmTestHash2",
        contentFileUrl: "https://example.com/trailer2.mp4",
        contentFileName: "tomorrows_echo_trailer.mp4",
        contentFileSize: 15728640,
        contentFileType: "video/mp4",
        verificationStatus: "pending",
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
        ownershipDocumentHash: "QmOwnershipDoc2",
        ownershipDocumentUrl: "https://example.com/ownership2.pdf",
        mintingStatus: "not_started",
        metadataUri: null,
        isListed: false,
        auctionEndTime: null,
        auctionDuration: null,
        startingBid: null,
        reservePrice: null,
        minBidAmount: null,
        highestBidAmount: null,
        highestBidderId: null,
        royaltyPercentage: "7.5",
        views: 0,
        favorites: 0,
        metadataHash: null,
        metadataUrl: null,
        creatorId: 1,
        ownerId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        tokenId: null,
        title: "Digital Art Ownership",
        type: "ownership",
        description: "Full ownership rights to digital artwork 'Cyber Landscape'",
        symbol: "🎨",
        categoryId: null,
        tags: ["art", "digital", "ownership"],
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
        paysDividends: true,
        paymentAddress: null,
        paymentFrequency: "quarterly",
        revenueDistributionMethod: "manual",
        distributionPercentage: 75,
        minimumDistribution: "50",
        distributionDetails: "Quarterly profits from print sales and licensing",
        listingType: "fixed",
        price: "1500",
        currency: "HBAR",
        contentFileHash: "QmTestHash3",
        contentFileUrl: "https://example.com/artwork3.jpg",
        contentFileName: "cyber_landscape.jpg",
        contentFileSize: 2097152,
        contentFileType: "image/jpeg",
        verificationStatus: "pending",
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
        ownershipDocumentHash: "QmOwnershipDoc3",
        ownershipDocumentUrl: "https://example.com/ownership3.pdf",
        mintingStatus: "not_started",
        metadataUri: null,
        isListed: false,
        auctionEndTime: null,
        auctionDuration: null,
        startingBid: null,
        reservePrice: null,
        minBidAmount: null,
        highestBidAmount: null,
        highestBidderId: null,
        royaltyPercentage: "7.5",
        views: 0,
        favorites: 0,
        metadataHash: null,
        metadataUrl: null,
        creatorId: 1,
        ownerId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    pendingRights.forEach(right => {
      this.rights.set(right.id, right);
    });
    
    this.currentRightId = 4; // Next ID after sample data
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

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.emailVerificationToken === token) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByHederaAccountId(hederaAccountId: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.hederaAccountId === hederaAccountId) {
        return user;
      }
    }
    return undefined;
  }

  async upsertUser(userData: {
    walletAddress: string;
    hederaAccountId?: string;
    walletType?: string;
    username?: string;
  }): Promise<User> {
    let existingUser = await this.getUserByWalletAddress(userData.walletAddress);
    
    if (!existingUser && userData.hederaAccountId) {
      existingUser = await this.getUserByHederaAccountId(userData.hederaAccountId);
    }

    if (existingUser) {
      return await this.updateUser(existingUser.id, {
        walletAddress: userData.walletAddress,
        hederaAccountId: userData.hederaAccountId,
        walletType: userData.walletType || 'hashpack',
      }) || existingUser;
    } else {
      return await this.createUser({
        walletAddress: userData.walletAddress,
        hederaAccountId: userData.hederaAccountId,
        walletType: userData.walletType || 'hashpack',
        username: userData.username || `hedera_${userData.hederaAccountId?.replace(/\./g, '_') || Date.now()}`,
        password: 'wallet_auth',
        displayName: `Hedera User ${userData.hederaAccountId || ''}`,
      });
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      id: this.currentUserId++,
      username: insertUser.username,
      displayName: insertUser.displayName || null,
      password: insertUser.password || "",
      walletAddress: insertUser.walletAddress || null,
      hederaAccountId: insertUser.hederaAccountId || null,
      hederaCollectionTokenId: null,
      collectionCreationStatus: "not_created",
      collectionCreatedAt: null,
      walletType: insertUser.walletType || null,
      networkType: insertUser.networkType || null,
      email: insertUser.email || null,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      profileImageUrl: insertUser.profileImageUrl || null,
      coverImageUrl: null,
      bio: insertUser.bio || null,
      website: insertUser.website || null,
      twitter: insertUser.twitter || null,
      instagram: insertUser.instagram || null,
      isVerified: false,
      isBanned: false,
      totalEarnings: "0",
      totalSales: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getRight(id: number): Promise<Right | undefined> {
    return this.rights.get(id);
  }

  async getRightWithCreator(id: number): Promise<RightWithCreator | undefined> {
    const right = this.rights.get(id);
    if (!right) return undefined;

    if (!right.creatorId || !right.ownerId) return undefined;

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
      if (!right.creatorId || !right.ownerId) continue;
      
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

  async getRightsByCollectionId(collectionId: string): Promise<Right[]> {
    return Array.from(this.rights.values()).filter(r => r.hederaTokenId === collectionId);
  }

  async createRight(rightData: InsertRight & { creatorId: number; ownerId: number }): Promise<Right> {
    const right: Right = {
      id: this.currentRightId++,
      tokenId: null,
      title: rightData.title,
      type: rightData.type,
      description: rightData.description,
      symbol: rightData.symbol || null,
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
      verificationNotes: null,
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

  // Additional methods needed by routes
  async getCategories(): Promise<any[]> {
    return [
      { id: 1, name: 'Music', slug: 'music', description: 'Music rights and royalties', icon: '🎵' },
      { id: 2, name: 'Film & TV', slug: 'film-tv', description: 'Movie and television rights', icon: '🎬' },
      { id: 3, name: 'Art', slug: 'art', description: 'Artwork and visual content', icon: '🎨' },
      { id: 4, name: 'Literature', slug: 'literature', description: 'Books and written content', icon: '📚' },
      { id: 5, name: 'Technology', slug: 'technology', description: 'Patents and tech innovations', icon: '⚡' }
    ];
  }

  async searchRights(query: string, options: { limit: number; offset: number }): Promise<Right[]> {
    const { limit = 20, offset = 0 } = options;
    const allRights = Array.from(this.rights.values());
    const filtered = allRights.filter(right => 
      right.title.toLowerCase().includes(query.toLowerCase()) ||
      (right.description && right.description.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.slice(offset, offset + limit);
  }

  async placeBid(bid: any): Promise<any> {
    return { id: Date.now(), ...bid, isActive: true };
  }

  async getBidsForRight(rightId: number): Promise<any[]> {
    return [];
  }

  async addToFavorites(userId: number, rightId: number): Promise<void> {
    console.log(`User ${userId} added right ${rightId} to favorites`);
  }

  async removeFromFavorites(userId: number, rightId: number): Promise<void> {
    console.log(`User ${userId} removed right ${rightId} from favorites`);
  }

  async getStake(id: number): Promise<any> {
    return null;
  }

  async createRevenueDistribution(distribution: any): Promise<any> {
    return { id: Date.now(), ...distribution };
  }

  async updateStake(id: number, updates: any): Promise<any> {
    return null;
  }
}

import { db } from "./db";
import { users, rights, transactions } from "@shared/schema";
import { eq, desc, asc, like, and, or, isNull, isNotNull } from "drizzle-orm";

export class DatabaseStorage {
  constructor() {
    // Database connection handled by db.ts
  }

  // Add missing methods for production functionality
  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
    return user;
  }

  async getUserByHederaAccountId(hederaAccountId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.hederaAccountId, hederaAccountId)).limit(1);
    return user;
  }

  async getCategories(): Promise<any[]> {
    // Return mock categories for now
    return [];
  }

  async searchRights(query: string, options: { limit: number; offset: number }): Promise<Right[]> {
    // Return empty for now - can be implemented later
    return [];
  }

  async placeBid(bid: any): Promise<any> {
    // Return mock implementation for now
    return bid;
  }

  async getBidsForRight(rightId: number): Promise<any[]> {
    // Return empty for now
    return [];
  }

  async addToFavorites(userId: number, rightId: number): Promise<void> {
    // Mock implementation for now
  }

  async removeFromFavorites(userId: number, rightId: number): Promise<void> {
    // Mock implementation for now
  }

  async getStake(id: number): Promise<any> {
    // Mock implementation for now
    return null;
  }

  async createRevenueDistribution(distribution: any): Promise<any> {
    // Mock implementation for now
    return distribution;
  }

  async updateStake(id: number, updates: any): Promise<any> {
    // Mock implementation for now
    return null;
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

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
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

  async getRightsByCollectionId(collectionId: string): Promise<Right[]> {
    return await db.select().from(rights).where(eq(rights.hederaTokenId, collectionId));
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

export const storage = new MemStorage();