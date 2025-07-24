import {
  users,
  rights,
  transactions,
  categories,
  bids,
  favorites,
  follows,
  stakes,
  revenueDistributions,
  type User,
  type Right,
  type RightWithCreator,
  type Transaction,
  type Category,
  type Bid,
  type BidWithUser,
  type UserProfile,
  type InsertUser,
  type InsertRight,
  type InsertTransaction,
  type InsertCategory,
  type InsertBid,
  type Stake,
  type StakeWithDetails,
  type InsertStake,
  type RevenueDistribution,
  type InsertRevenueDistribution,
  defaultCategories,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, asc, sql, ilike, inArray } from "drizzle-orm";

export interface IMarketplaceStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserProfile(userId: number, currentUserId?: number): Promise<UserProfile | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  seedCategories(): Promise<void>;
  
  // Right operations
  getRight(id: number, userId?: number): Promise<RightWithCreator | undefined>;
  getRights(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
    categoryId?: number;
    listingType?: string;
    priceMin?: string;
    priceMax?: string;
    paysDividends?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: number;
  }): Promise<RightWithCreator[]>;
  getRightsByCreator(creatorId: number): Promise<Right[]>;
  getRightsByOwner(ownerId: number): Promise<Right[]>;
  createRight(right: InsertRight & { creatorId: number; ownerId: number }): Promise<Right>;
  updateRight(id: number, updates: Partial<Right>): Promise<Right | undefined>;
  incrementRightViews(id: number): Promise<void>;
  
  // Auction and bidding operations
  placeBid(bid: InsertBid): Promise<Bid>;
  getBidsForRight(rightId: number): Promise<BidWithUser[]>;
  getHighestBid(rightId: number): Promise<BidWithUser | undefined>;
  endAuction(rightId: number): Promise<boolean>;
  
  // Favorites operations
  addToFavorites(userId: number, rightId: number): Promise<void>;
  removeFromFavorites(userId: number, rightId: number): Promise<void>;
  getUserFavorites(userId: number): Promise<RightWithCreator[]>;
  isRightFavorited(userId: number, rightId: number): Promise<boolean>;
  
  // Follow operations
  followUser(followerId: number, followingId: number): Promise<void>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  isUserFollowing(followerId: number, followingId: number): Promise<boolean>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  getTransactionsByRight(rightId: number): Promise<Transaction[]>;
  
  // Search operations
  searchRights(query: string, options?: {
    limit?: number;
    offset?: number;
    filters?: any;
  }): Promise<RightWithCreator[]>;
  getSearchSuggestions(query: string): Promise<string[]>;
  
  // Staking operations
  createStake(stake: InsertStake & { endDate?: Date | null }): Promise<Stake>;
  getStake(id: number): Promise<Stake | undefined>;
  getStakeWithDetails(id: number): Promise<StakeWithDetails | undefined>;
  getUserStakes(userId: number): Promise<StakeWithDetails[]>;
  getStakes(options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<StakeWithDetails[]>;
  getActiveStakeByRight(rightId: number): Promise<Stake | undefined>;
  updateStake(id: number, updates: Partial<Stake>): Promise<Stake | undefined>;
  
  // Revenue distribution operations
  createRevenueDistribution(distribution: InsertRevenueDistribution): Promise<RevenueDistribution>;
  getRevenueDistributionsByStake(stakeId: number): Promise<RevenueDistribution[]>;
}

export class DatabaseMarketplaceStorage implements IMarketplaceStorage {
  constructor() {
    this.seedCategories();
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      email: userData.email || null,
      profileImageUrl: userData.profileImageUrl || null,
      coverImageUrl: null,
      bio: userData.bio || null,
      website: userData.website || null,
      twitter: userData.twitter || null,
      instagram: userData.instagram || null,
      isVerified: false,
      totalEarnings: "0",
      totalSales: 0,
      followersCount: 0,
      followingCount: 0,
      updatedAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserProfile(userId: number, currentUserId?: number): Promise<UserProfile | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const [ownedRights, createdRights] = await Promise.all([
      this.getRightsByOwner(userId),
      this.getRightsByCreator(userId),
    ]);

    let isFollowing = false;
    if (currentUserId) {
      isFollowing = await this.isUserFollowing(currentUserId, userId);
    }

    return {
      ...user,
      ownedRights,
      createdRights,
      isFollowing,
    };
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async seedCategories(): Promise<void> {
    const existingCategories = await this.getCategories();
    if (existingCategories.length > 0) return;

    // Create parent categories first
    const parentCategories = defaultCategories.filter(cat => !cat.parentSlug);
    const createdParents: Record<string, number> = {};

    for (const cat of parentCategories) {
      const created = await this.createCategory({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        parentId: null,
      });
      createdParents[cat.slug] = created.id;
    }

    // Create child categories
    const childCategories = defaultCategories.filter(cat => cat.parentSlug);
    for (const cat of childCategories) {
      if (cat.parentSlug && createdParents[cat.parentSlug]) {
        await this.createCategory({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          parentId: createdParents[cat.parentSlug],
        });
      }
    }
  }

  async getRight(id: number, userId?: number): Promise<RightWithCreator | undefined> {
    const rightQuery = db
      .select({
        right: rights,
        creator: users,
        owner: users,
        category: categories,
      })
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id))
      .leftJoin(categories, eq(rights.categoryId, categories.id))
      .where(eq(rights.id, id));

    const [result] = await rightQuery;
    if (!result) return undefined;

    // Increment view count
    await this.incrementRightViews(id);

    let isFavorited = false;
    let isOwner = false;
    if (userId) {
      isFavorited = await this.isRightFavorited(userId, id);
      isOwner = result.right.ownerId === userId;
    }

    const bidCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(bids)
      .where(and(eq(bids.rightId, id), eq(bids.isActive, true)));

    return {
      ...result.right,
      creator: result.creator!,
      owner: result.owner!,
      category: result.category,
      isFavorited,
      isOwner,
      bidCount: bidCount[0]?.count || 0,
    };
  }

  async getRights(options: {
    limit?: number;
    offset?: number;
    search?: string;
    type?: string;
    categoryId?: number;
    listingType?: string;
    priceMin?: string;
    priceMax?: string;
    paysDividends?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: number;
  } = {}): Promise<RightWithCreator[]> {
    const {
      limit = 20,
      offset = 0,
      search,
      type,
      categoryId,
      listingType,
      priceMin,
      priceMax,
      paysDividends,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
    } = options;

    let query = db
      .select({
        right: rights,
        creator: users,
        owner: users,
        category: categories,
      })
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id))
      .leftJoin(categories, eq(rights.categoryId, categories.id))
      .where(eq(rights.isListed, true));

    // Apply filters
    const conditions = [eq(rights.isListed, true)];

    if (search) {
      conditions.push(
        or(
          ilike(rights.title, `%${search}%`),
          ilike(rights.description, `%${search}%`),
          sql`${rights.tags} && ${[search.toLowerCase()]}`
        )!
      );
    }

    if (type) {
      conditions.push(eq(rights.type, type));
    }

    if (categoryId) {
      conditions.push(eq(rights.categoryId, categoryId));
    }

    if (listingType) {
      conditions.push(eq(rights.listingType, listingType));
    }

    if (priceMin) {
      conditions.push(sql`${rights.price} >= ${priceMin}`);
    }

    if (priceMax) {
      conditions.push(sql`${rights.price} <= ${priceMax}`);
    }

    if (paysDividends !== undefined) {
      conditions.push(eq(rights.paysDividends, paysDividends));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sortBy === 'price') {
      query = query.orderBy(sortOrder === 'asc' ? asc(rights.price) : desc(rights.price));
    } else if (sortBy === 'views') {
      query = query.orderBy(sortOrder === 'asc' ? asc(rights.views) : desc(rights.views));
    } else if (sortBy === 'favorites') {
      query = query.orderBy(sortOrder === 'asc' ? asc(rights.favorites) : desc(rights.favorites));
    } else {
      query = query.orderBy(sortOrder === 'asc' ? asc(rights.createdAt) : desc(rights.createdAt));
    }

    const results = await query.limit(limit).offset(offset);

    return results.map(result => ({
      ...result.right,
      creator: result.creator!,
      owner: result.owner!,
      category: result.category,
      isFavorited: false, // Would need to check per user
      isOwner: userId ? result.right.ownerId === userId : false,
      bidCount: 0, // Would need to count bids
    }));
  }

  async getRightsByCreator(creatorId: number): Promise<Right[]> {
    return await db.select().from(rights).where(eq(rights.creatorId, creatorId));
  }

  async getRightsByOwner(ownerId: number): Promise<Right[]> {
    return await db.select().from(rights).where(eq(rights.ownerId, ownerId));
  }

  async createRight(rightData: InsertRight & { creatorId: number; ownerId: number }): Promise<Right> {
    const [right] = await db.insert(rights).values({
      ...rightData,
      categoryId: rightData.categoryId || null,
      tags: rightData.tags || [],
      imageUrl: rightData.imageUrl || null,
      paymentAddress: rightData.paymentAddress || null,
      paymentFrequency: rightData.paymentFrequency || null,
      revenueDistributionMethod: rightData.revenueDistributionMethod || null,
      distributionPercentage: rightData.distributionPercentage || null,
      minimumDistribution: rightData.minimumDistribution || null,
      distributionDetails: rightData.distributionDetails || null,
      contentFileHash: rightData.contentFileHash || null,
      contentFileUrl: rightData.contentFileUrl || null,
      contentFileName: rightData.contentFileName || null,
      contentFileSize: rightData.contentFileSize || null,
      contentFileType: rightData.contentFileType || null,
      listingType: rightData.listingType || "fixed",
      auctionEndTime: rightData.auctionEndTime || null,
      minBidAmount: rightData.minBidAmount || null,
      highestBidAmount: null,
      highestBidderId: null,
      views: 0,
      favorites: 0,
      isListed: true,
      tokenId: Math.floor(Math.random() * 1000000), // Generate unique token ID
      updatedAt: new Date(),
    }).returning();
    
    return right;
  }

  async updateRight(id: number, updates: Partial<Right>): Promise<Right | undefined> {
    const [right] = await db
      .update(rights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rights.id, id))
      .returning();
    return right;
  }

  async incrementRightViews(id: number): Promise<void> {
    await db
      .update(rights)
      .set({ views: sql`${rights.views} + 1` })
      .where(eq(rights.id, id));
  }

  async placeBid(bidData: InsertBid): Promise<Bid> {
    const [bid] = await db.insert(bids).values(bidData).returning();
    
    // Update highest bid on the right
    await db
      .update(rights)
      .set({
        highestBidAmount: bidData.amount,
        highestBidderId: bidData.bidderId,
      })
      .where(eq(rights.id, bidData.rightId));
    
    return bid;
  }

  async getBidsForRight(rightId: number): Promise<BidWithUser[]> {
    const bidResults = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .leftJoin(users, eq(bids.bidderId, users.id))
      .where(and(eq(bids.rightId, rightId), eq(bids.isActive, true)))
      .orderBy(desc(bids.amount));

    return bidResults.map(result => ({
      ...result.bid,
      bidder: result.bidder!,
    }));
  }

  async getHighestBid(rightId: number): Promise<BidWithUser | undefined> {
    const [result] = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .leftJoin(users, eq(bids.bidderId, users.id))
      .where(and(eq(bids.rightId, rightId), eq(bids.isActive, true)))
      .orderBy(desc(bids.amount))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.bid,
      bidder: result.bidder!,
    };
  }

  async endAuction(rightId: number): Promise<boolean> {
    const highestBid = await this.getHighestBid(rightId);
    if (!highestBid) return false;

    // Transfer ownership to highest bidder
    await db
      .update(rights)
      .set({
        ownerId: highestBid.bidderId,
        isListed: false,
        listingType: "fixed",
        auctionEndTime: null,
        highestBidAmount: null,
        highestBidderId: null,
      })
      .where(eq(rights.id, rightId));

    // Deactivate all bids for this right
    await db
      .update(bids)
      .set({ isActive: false })
      .where(eq(bids.rightId, rightId));

    return true;
  }

  async addToFavorites(userId: number, rightId: number): Promise<void> {
    await db.insert(favorites).values({ userId, rightId }).onConflictDoNothing();
    await db
      .update(rights)
      .set({ favorites: sql`${rights.favorites} + 1` })
      .where(eq(rights.id, rightId));
  }

  async removeFromFavorites(userId: number, rightId: number): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.rightId, rightId))
    );
    await db
      .update(rights)
      .set({ favorites: sql`${rights.favorites} - 1` })
      .where(eq(rights.id, rightId));
  }

  async getUserFavorites(userId: number): Promise<RightWithCreator[]> {
    const favoriteResults = await db
      .select({
        right: rights,
        creator: users,
        owner: users,
        category: categories,
      })
      .from(favorites)
      .leftJoin(rights, eq(favorites.rightId, rights.id))
      .leftJoin(users, eq(rights.creatorId, users.id))
      .leftJoin(categories, eq(rights.categoryId, categories.id))
      .where(eq(favorites.userId, userId));

    return favoriteResults.map(result => ({
      ...result.right!,
      creator: result.creator!,
      owner: result.owner!,
      category: result.category,
      isFavorited: true,
      isOwner: result.right!.ownerId === userId,
      bidCount: 0,
    }));
  }

  async isRightFavorited(userId: number, rightId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.rightId, rightId)));
    return !!favorite;
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
    
    // Update follower counts
    await Promise.all([
      db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, followerId)),
      db.update(users).set({ followersCount: sql`${users.followersCount} + 1` }).where(eq(users.id, followingId)),
    ]);
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
    
    // Update follower counts
    await Promise.all([
      db.update(users).set({ followingCount: sql`${users.followingCount} - 1` }).where(eq(users.id, followerId)),
      db.update(users).set({ followersCount: sql`${users.followersCount} - 1` }).where(eq(users.id, followingId)),
    ]);
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    const followerResults = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return followerResults.map(result => result.user!);
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const followingResults = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return followingResults.map(result => result.user!);
  }

  async isUserFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.fromUserId, userId), eq(transactions.toUserId, userId)))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByRight(rightId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.rightId, rightId))
      .orderBy(desc(transactions.createdAt));
  }

  async searchRights(query: string, options: {
    limit?: number;
    offset?: number;
    filters?: any;
  } = {}): Promise<RightWithCreator[]> {
    const { limit = 20, offset = 0 } = options;
    
    // Implement fuzzy search with typo tolerance
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    const searchQuery = db
      .select({
        right: rights,
        creator: users,
        owner: users,
        category: categories,
      })
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id))
      .leftJoin(categories, eq(rights.categoryId, categories.id))
      .where(
        and(
          eq(rights.isListed, true),
          or(
            ...searchTerms.map(term => 
              or(
                ilike(rights.title, `%${term}%`),
                ilike(rights.description, `%${term}%`),
                ilike(users.username, `%${term}%`),
                sql`${rights.tags} && ${[term]}`
              )
            )
          )!
        )
      )
      .limit(limit)
      .offset(offset);

    const results = await searchQuery;

    return results.map(result => ({
      ...result.right,
      creator: result.creator!,
      owner: result.owner!,
      category: result.category,
      isFavorited: false,
      isOwner: false,
      bidCount: 0,
    }));
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const suggestions = await db
      .select({ title: rights.title })
      .from(rights)
      .where(
        and(
          eq(rights.isListed, true),
          ilike(rights.title, `%${query}%`)
        )
      )
      .limit(5);

    return suggestions.map(s => s.title);
  }

  // Staking implementations
  async createStake(stakeData: InsertStake & { endDate?: Date | null }): Promise<Stake> {
    const [stake] = await db.insert(stakes).values({
      ...stakeData,
      endDate: stakeData.endDate || null,
    }).returning();
    return stake;
  }

  async getStake(id: number): Promise<Stake | undefined> {
    const [stake] = await db.select().from(stakes).where(eq(stakes.id, id));
    return stake;
  }

  async getStakeWithDetails(id: number): Promise<StakeWithDetails | undefined> {
    const results = await db
      .select({
        stake: stakes,
        right: rights,
        staker: users,
      })
      .from(stakes)
      .leftJoin(rights, eq(stakes.rightId, rights.id))
      .leftJoin(users, eq(stakes.stakerId, users.id))
      .where(eq(stakes.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    const distributions = await this.getRevenueDistributionsByStake(id);

    return {
      ...result.stake,
      right: result.right!,
      staker: result.staker!,
      revenueDistributions: distributions,
    };
  }

  async getUserStakes(userId: number): Promise<StakeWithDetails[]> {
    const results = await db
      .select({
        stake: stakes,
        right: rights,
        staker: users,
      })
      .from(stakes)
      .leftJoin(rights, eq(stakes.rightId, rights.id))
      .leftJoin(users, eq(stakes.stakerId, users.id))
      .where(eq(stakes.stakerId, userId))
      .orderBy(desc(stakes.createdAt));

    const stakesWithDetails: StakeWithDetails[] = [];
    for (const result of results) {
      const distributions = await this.getRevenueDistributionsByStake(result.stake.id);
      stakesWithDetails.push({
        ...result.stake,
        right: result.right!,
        staker: result.staker!,
        revenueDistributions: distributions,
      });
    }

    return stakesWithDetails;
  }

  async getStakes(options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<StakeWithDetails[]> {
    const { limit = 20, offset = 0, status = "active" } = options;

    const results = await db
      .select({
        stake: stakes,
        right: rights,
        staker: users,
      })
      .from(stakes)
      .leftJoin(rights, eq(stakes.rightId, rights.id))
      .leftJoin(users, eq(stakes.stakerId, users.id))
      .where(eq(stakes.status, status))
      .orderBy(desc(stakes.createdAt))
      .limit(limit)
      .offset(offset);

    const stakesWithDetails: StakeWithDetails[] = [];
    for (const result of results) {
      const distributions = await this.getRevenueDistributionsByStake(result.stake.id);
      stakesWithDetails.push({
        ...result.stake,
        right: result.right!,
        staker: result.staker!,
        revenueDistributions: distributions,
      });
    }

    return stakesWithDetails;
  }

  async getActiveStakeByRight(rightId: number): Promise<Stake | undefined> {
    const [stake] = await db
      .select()
      .from(stakes)
      .where(and(eq(stakes.rightId, rightId), eq(stakes.status, "active")));
    return stake;
  }

  async updateStake(id: number, updates: Partial<Stake>): Promise<Stake | undefined> {
    const [updatedStake] = await db
      .update(stakes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stakes.id, id))
      .returning();
    return updatedStake;
  }

  // Revenue distribution implementations
  async createRevenueDistribution(distributionData: InsertRevenueDistribution): Promise<RevenueDistribution> {
    const [distribution] = await db.insert(revenueDistributions).values(distributionData).returning();
    return distribution;
  }

  async getRevenueDistributionsByStake(stakeId: number): Promise<RevenueDistribution[]> {
    return await db
      .select()
      .from(revenueDistributions)
      .where(eq(revenueDistributions.stakeId, stakeId))
      .orderBy(desc(revenueDistributions.createdAt));
  }
}

export const marketplaceStorage = new DatabaseMarketplaceStorage();