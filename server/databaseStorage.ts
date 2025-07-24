import { users, type User, type InsertUser, rights, type Right, type InsertRight, type RightWithCreator, transactions, type Transaction, type InsertTransaction, categories, type Category } from "@shared/schema";
import { rightTypeSymbols } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, isNull, isNotNull } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Check if we have any users, if not create test data
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        await this.createTestData();
      }
    } catch (error) {
      console.log("Database not ready yet, will initialize when available");
    }
  }

  private async createTestData() {
    try {
      // Create test users
      const alice = await db.insert(users).values({
        username: "alice",
        password: "hashed_password",
        walletAddress: "0x742d35Cc6C6C4532F14C4b25f6E4d54e7a3c4a5e",
        email: "alice@example.com",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b884d5be?w=400&h=400&fit=crop&crop=face",
        coverImageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=200&fit=crop",
        bio: "Content creator and digital rights pioneer. Passionate about empowering creators through blockchain technology.",
        website: "https://alice-creates.com",
        twitter: "@alicecreates",
        instagram: "@alice_creates",
        isVerified: true,
        totalEarnings: "2.5",
        totalSales: 12,
        followersCount: 1250,
        followingCount: 340,
        isBanned: false,
      }).returning();

      const bob = await db.insert(users).values({
        username: "bob",
        password: "hashed_password",
        walletAddress: "0x8ba1f109551bD432803012645Hac136c30r213Bd",
        email: "bob@example.com",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        bio: "Music producer and sound engineer with 10+ years experience.",
        isVerified: false,
        totalEarnings: "0.75",
        totalSales: 3,
        followersCount: 89,
        followingCount: 234,
        isBanned: false,
      }).returning();

      // Create test rights
      await db.insert(rights).values({
        tokenId: "906445",
        contractAddress: "0x1234567890123456789012345678901234567890",
        transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        ownerAddress: "0x742d35Cc6C6C4532F14C4b25f6E4d54e7a3c4a5e",
        blockNumber: 18456789,
        chainId: 11155111, // Sepolia testnet
        title: "Summer Vibes Music Video",
        type: "copyright",
        description: "Exclusive rights to 'Summer Vibes' music video featuring 2M+ views on YouTube. Includes streaming royalties and sync rights.",
        tags: ["music", "summer", "pop", "youtube"],
        symbol: "📄",
        imageUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&h=400&fit=crop&auto=format",
        paysDividends: true,
        paymentAddress: "0x742d35Cc6C6C4532F14C4b25f6E4d54e7a3c4a5e",
        paymentFrequency: "monthly",
        revenueDistributionMethod: "automatic",
        distributionPercentage: "15.00",
        minimumDistribution: "0.01",
        distributionDetails: "15% of all streaming revenue distributed monthly to NFT holder. Historical monthly earnings: $50-200.",
        price: "0.75",
        currency: "ETH",
        metadataHash: "QmX8z5RqGX9H2N4Y3F6K8B1C7J9M5P2A4S8W9Q1E3R6T8Y",
        metadataUrl: "https://ipfs.io/ipfs/QmX8z5RqGX9H2N4Y3F6K8B1C7J9M5P2A4S8W9Q1E3R6T8Y",
        creatorId: alice[0].id,
        ownerId: alice[0].id,
        isListed: true,
        listingType: "fixed",
        royaltyPercentage: "7.50",
        views: 45,
        favorites: 12,
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verifiedBy: "admin",
        verificationNotes: "YouTube channel ownership verified via Google OAuth",
        metadataUri: "https://ipfs.io/ipfs/QmX8z5RqGX9H2N4Y3F6K8B1C7J9M5P2A4S8W9Q1E3R6T8Y",
      });

      await db.insert(rights).values({
        tokenId: "906446",
        contractAddress: "0x1234567890123456789012345678901234567890",
        transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ownerAddress: "0x8ba1f109551bD432803012645Hac136c30r213Bd",
        blockNumber: 18456790,
        chainId: 11155111, // Sepolia testnet
        title: "Test Auction Right",
        type: "royalty",
        description: "Test auction for development",
        tags: ["test", "auction"],
        symbol: "💰",
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop&auto=format",
        paysDividends: false,
        price: "0.05",
        currency: "ETH",
        creatorId: bob[0].id,
        ownerId: bob[0].id,
        isListed: true,
        listingType: "auction",
        auctionEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        auctionDuration: 24,
        startingBid: "0.01",
        reservePrice: "0.05",
        minBidAmount: "0.005",
        royaltyPercentage: "10.00",
        views: 12,
        favorites: 3,
        verificationStatus: "pending",
        metadataUri: "https://ipfs.io/ipfs/QmY9z6RqGY9H3N5Y4F7K9B2C8J0M6P3A5S9W0Q2E4R7T9Y",
      });

      console.log("Test data created successfully");
    } catch (error) {
      console.log("Test data already exists or error creating:", error);
    }
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

    if (!creator) return undefined;

    return {
      ...right,
      creator,
      owner: creator, // Assuming creator is also owner initially
    };
  }

  async getRights(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<Right[]> {
    const conditions = [];
    if (type) conditions.push(eq(rights.type, type));
    if (isListed !== undefined) conditions.push(eq(rights.isListed, isListed));

    if (conditions.length > 0) {
      return await db.select().from(rights)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(rights.createdAt));
    }

    return await db.select().from(rights)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(rights.createdAt));
  }

  async getRightsWithCreator(limit = 20, offset = 0, type?: string, isListed?: boolean): Promise<RightWithCreator[]> {
    const conditions = [];
    if (type) conditions.push(eq(rights.type, type));
    if (isListed !== undefined) conditions.push(eq(rights.isListed, isListed));

    let result;
    if (conditions.length > 0) {
      result = await db
        .select()
        .from(rights)
        .leftJoin(users, eq(rights.creatorId, users.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(rights.createdAt));
    } else {
      result = await db
        .select()
        .from(rights)
        .leftJoin(users, eq(rights.creatorId, users.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(rights.createdAt));
    }

    return result
      .filter(row => row.users !== null)
      .map(row => ({
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

  async updateRight(id: number, updates: any): Promise<Right | undefined> {
    const [right] = await db
      .update(rights)
      .set({ ...updates, updatedAt: new Date() })
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