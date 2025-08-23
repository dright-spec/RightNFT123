import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, index, varchar, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"), // Full name for display
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  hederaAccountId: text("hedera_account_id"), // Format: 0.0.12345
  hederaCollectionTokenId: text("hedera_collection_token_id"), // User's dedicated NFT collection token ID (e.g., 0.0.12346)
  collectionCreationStatus: text("collection_creation_status").default("not_created"), // not_created, creating, created, failed
  collectionCreatedAt: timestamp("collection_created_at"),
  walletType: text("wallet_type"), // 'metamask' or 'hashpack'
  networkType: text("network_type"), // 'ethereum' or 'hedera'
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  profileImageUrl: text("profile_image_url"),
  coverImageUrl: text("cover_image_url"),
  bio: text("bio"),
  website: text("website"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  isVerified: boolean("is_verified").default(false),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 8 }).default("0"),
  totalSales: integer("total_sales").default(0),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  isBanned: boolean("is_banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("📄"),
  parentId: integer("parent_id"),
  itemCount: integer("item_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rights = pgTable("rights", {
  id: serial("id").primaryKey(),
  // Blockchain fields (Ethereum/Hedera)
  contractAddress: text("contract_address"), // NFT contract address (Ethereum) or Token ID (Hedera)
  tokenId: text("token_id").unique(), // NFT token ID
  transactionHash: text("transaction_hash"), // Mint transaction hash
  ownerAddress: text("owner_address"), // Current owner's address (Ethereum or Hedera)
  hederaTokenId: text("hedera_token_id"), // Hedera Token Service ID (e.g., 0.0.12345)
  hederaSerialNumber: text("hedera_serial_number"), // Hedera NFT serial number
  blockNumber: integer("block_number"), // Block number (Ethereum) or consensus timestamp (Hedera)
  chainId: integer("chain_id").default(1), // 1 = Ethereum mainnet, 295 = Hedera mainnet
  networkType: text("network_type").default("ethereum"), // 'ethereum' or 'hedera'
  
  title: text("title").notNull(),
  type: text("type").notNull(), // copyright, royalty, access, ownership, license
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description").notNull(),
  tags: text("tags").array().default([]), // searchable tags
  symbol: text("symbol"), // 📄, 💰, 🔐, etc.
  imageUrl: text("image_url"),
  paysDividends: boolean("pays_dividends").default(false),
  paymentAddress: text("payment_address"),
  paymentFrequency: text("payment_frequency"), // monthly, quarterly, yearly, streaming
  revenueDistributionMethod: text("revenue_distribution_method"), // automatic, manual, escrow
  distributionPercentage: decimal("distribution_percentage", { precision: 5, scale: 2 }), // percentage of revenue shared
  minimumDistribution: decimal("minimum_distribution", { precision: 18, scale: 8 }), // minimum amount before distribution
  distributionDetails: text("distribution_details"), // detailed explanation for buyers
  price: decimal("price", { precision: 18, scale: 8 }),
  currency: text("currency").default("ETH"),
  contentFileHash: text("content_file_hash"), // SHA-256 hash of uploaded content
  contentFileUrl: text("content_file_url"), // IPFS URL of the actual content
  contentFileName: text("content_file_name"),
  contentFileSize: integer("content_file_size"),
  contentFileType: text("content_file_type"), // audio/mp3, video/mp4, etc.
  metadataHash: text("metadata_hash"),
  metadataUrl: text("metadata_url"),
  creatorId: integer("creator_id").references(() => users.id),
  ownerId: integer("owner_id").references(() => users.id),
  isListed: boolean("is_listed").default(false),
  listingType: text("listing_type").default("fixed"), // fixed, auction
  auctionEndTime: timestamp("auction_end_time"),
  auctionDuration: integer("auction_duration"), // duration in hours
  startingBid: decimal("starting_bid", { precision: 18, scale: 8 }),
  reservePrice: decimal("reserve_price", { precision: 18, scale: 8 }),
  minBidAmount: decimal("min_bid_amount", { precision: 18, scale: 8 }),
  highestBidAmount: decimal("highest_bid_amount", { precision: 18, scale: 8 }),
  highestBidderId: integer("highest_bidder_id").references(() => users.id),
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).default("7.5"),
  views: integer("views").default(0),
  favorites: integer("favorites").default(0),
  
  // Verification system
  verificationStatus: text("verification_status").default("pending"), // "pending", "verified", "rejected"
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  verificationNotes: text("verification_notes"),
  
  // Ownership documents for verification
  ownershipDocumentHash: text("ownership_document_hash"), // IPFS hash of ownership documents metadata
  ownershipDocumentUrl: text("ownership_document_url"), // IPFS URL of ownership documents metadata
  
  // NFT minting status
  mintingStatus: text("minting_status").default("not_started"), // not_started, processing, completed, failed
  metadataUri: text("metadata_uri"), // IPFS URI for NFT metadata
  

  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rights_title_idx").on(table.title),
  index("rights_type_idx").on(table.type),
  index("rights_category_idx").on(table.categoryId),
  index("rights_creator_idx").on(table.creatorId),
  index("rights_price_idx").on(table.price),
]);

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  rightId: integer("right_id").notNull().references(() => rights.id),
  bidderId: integer("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").default("ETH"),
  isActive: boolean("is_active").default(true),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rightId: integer("right_id").notNull().references(() => rights.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  rightId: integer("right_id").references(() => rights.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  transactionHash: text("transaction_hash"),
  price: decimal("price", { precision: 18, scale: 8 }),
  currency: text("currency").default("ETH"),
  type: text("type").notNull(), // mint, transfer, sale, bid
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'right_approved', 'right_rejected', 'nft_minted', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedRightId: integer("related_right_id").references(() => rights.id),
  actionUrl: varchar("action_url", { length: 500 }), // URL for user to take action
  createdAt: timestamp("created_at").defaultNow(),
});

export const abTestChoices = pgTable("ab_test_choices", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // Browser session ID
  userAgent: text("user_agent"), // For analytics
  ipAddress: text("ip_address"), // For analytics (anonymized)
  variant: text("variant").notNull(), // "original" or "minimalist"
  duration: integer("duration"), // How long user spent on page (seconds)
  converted: boolean("converted").default(false), // Did user click "Create Right" button
  createdAt: timestamp("created_at").defaultNow(),
});

export const stakes = pgTable("stakes", {
  id: serial("id").primaryKey(),
  rightId: integer("right_id").notNull().references(() => rights.id),
  stakerId: integer("staker_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  revenueSharePercentage: decimal("revenue_share_percentage", { precision: 5, scale: 2 }).notNull(), // % staker receives
  totalRevenue: decimal("total_revenue", { precision: 18, scale: 8 }).default("0"), // Total revenue generated
  stakerEarnings: decimal("staker_earnings", { precision: 18, scale: 8 }).default("0"), // Amount paid to staker
  managementFee: decimal("management_fee", { precision: 5, scale: 2 }).default("15.00"), // Platform fee %
  terms: text("terms"), // Custom terms and conditions
  duration: integer("duration"), // Stake duration in months (null = indefinite)
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"), // Auto-calculated from duration
  lastRevenueUpdate: timestamp("last_revenue_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("stakes_right_idx").on(table.rightId),
  index("stakes_staker_idx").on(table.stakerId),
  index("stakes_status_idx").on(table.status),
]);

export const revenueDistributions = pgTable("revenue_distributions", {
  id: serial("id").primaryKey(),
  stakeId: integer("stake_id").notNull().references(() => stakes.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").default("ETH"),
  distributionType: text("distribution_type").notNull(), // streaming, performance, licensing, etc.
  description: text("description"), // Description of revenue source
  transactionHash: text("transaction_hash"), // Blockchain transaction hash
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  hederaAccountId: true,
  walletType: true,
  networkType: true,
  email: true,
  profileImageUrl: true,
  bio: true,
  website: true,
  twitter: true,
  instagram: true,
  displayName: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  icon: true,
  parentId: true,
});

export const insertRightSchema = createInsertSchema(rights).pick({
  title: true,
  type: true,
  categoryId: true,
  description: true,
  tags: true,
  imageUrl: true,
  paysDividends: true,
  paymentAddress: true,
  paymentFrequency: true,
  revenueDistributionMethod: true,
  distributionPercentage: true,
  minimumDistribution: true,
  distributionDetails: true,
  price: true,
  currency: true,
  contentFileHash: true,
  contentFileUrl: true,
  contentFileName: true,
  contentFileSize: true,
  contentFileType: true,
  listingType: true,
  auctionEndTime: true,
  minBidAmount: true,
  ownershipDocumentHash: true,
  ownershipDocumentUrl: true,
}).extend({
  symbol: z.string().optional(),
  contentSource: z.string(),
  verificationStatus: z.string(),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  rightId: true,
  bidderId: true,
  amount: true,
  currency: true,
  transactionHash: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  rightId: true,
  fromUserId: true,
  toUserId: true,
  transactionHash: true,
  price: true,
  currency: true,
  type: true,
});

export const insertAbTestChoiceSchema = createInsertSchema(abTestChoices).pick({
  sessionId: true,
  userAgent: true,
  ipAddress: true,
  variant: true,
  duration: true,
  converted: true,
});

export const insertStakeSchema = createInsertSchema(stakes).pick({
  rightId: true,
  stakerId: true,
  revenueSharePercentage: true,
  managementFee: true,
  terms: true,
  duration: true,
});

export const insertRevenueDistributionSchema = createInsertSchema(revenueDistributions).pick({
  stakeId: true,
  amount: true,
  currency: true,
  distributionType: true,
  description: true,
  transactionHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertRight = z.infer<typeof insertRightSchema>;
export type Right = typeof rights.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertAbTestChoice = z.infer<typeof insertAbTestChoiceSchema>;
export type AbTestChoice = typeof abTestChoices.$inferSelect;
export type InsertStake = z.infer<typeof insertStakeSchema>;
export type Stake = typeof stakes.$inferSelect;
export type InsertRevenueDistribution = z.infer<typeof insertRevenueDistributionSchema>;
export type RevenueDistribution = typeof revenueDistributions.$inferSelect;

// Extended types with relations
export type RightWithCreator = Right & {
  creator: User;
  owner: User;
  category?: Category;
  highestBidder?: User;
  isOwner?: boolean;
  isFavorited?: boolean;
  bidCount?: number;
};

export type UserProfile = User & {
  isFollowing?: boolean;
  ownedRights?: Right[];
  createdRights?: Right[];
  followersCount: number;
  followingCount: number;
};

export type BidWithUser = Bid & {
  bidder: User;
};

export type StakeWithDetails = Stake & {
  right: Right;
  staker: User;
  revenueDistributions?: RevenueDistribution[];
};

export type RightType = "copyright" | "royalty" | "access" | "ownership" | "license";

export const rightTypeSymbols: Record<RightType, string> = {
  copyright: "📄",
  royalty: "💰",
  access: "🔐",
  ownership: "🏢",
  license: "📜",
};

export const rightTypeLabels: Record<RightType, string> = {
  copyright: "Copyright",
  royalty: "Royalty",
  access: "Access",
  ownership: "Ownership",
  license: "License",
};

// Detailed categories for better organization
export const defaultCategories = [
  { name: "Music", slug: "music", icon: "🎵", description: "Music rights and royalties" },
  { name: "Streaming Rights", slug: "streaming", icon: "📻", parentSlug: "music", description: "Spotify, Apple Music, YouTube streaming rights" },
  { name: "Performance Rights", slug: "performance", icon: "🎤", parentSlug: "music", description: "Live performance and sync rights" },
  { name: "Mechanical Rights", slug: "mechanical", icon: "💿", parentSlug: "music", description: "CD, vinyl, and digital download rights" },
  
  { name: "Intellectual Property", slug: "ip", icon: "🧠", description: "Patents, trademarks, and IP" },
  { name: "Patents", slug: "patents", icon: "📜", parentSlug: "ip", description: "Utility and design patents" },
  { name: "Trademarks", slug: "trademarks", icon: "®️", parentSlug: "ip", description: "Brand names and logos" },
  { name: "Copyrights", slug: "copyrights", icon: "©️", parentSlug: "ip", description: "Creative works and content" },
  
  { name: "Real Estate", slug: "real-estate", icon: "🏢", description: "Property rights and income shares" },
  { name: "Rental Income", slug: "rental", icon: "🏠", parentSlug: "real-estate", description: "Rental property income shares" },
  { name: "Development Rights", slug: "development", icon: "🏗️", parentSlug: "real-estate", description: "Land development and building rights" },
  
  { name: "Digital Assets", slug: "digital", icon: "💻", description: "Digital and online rights" },
  { name: "Domain Names", slug: "domains", icon: "🌐", parentSlug: "digital", description: "Website domains and digital properties" },
  { name: "Social Media", slug: "social", icon: "📱", parentSlug: "digital", description: "Social media accounts and content rights" },
  
  { name: "Entertainment", slug: "entertainment", icon: "🎬", description: "Film, TV, and media rights" },
  { name: "Film Rights", slug: "film", icon: "🎥", parentSlug: "entertainment", description: "Movie and documentary rights" },
  { name: "TV Rights", slug: "tv", icon: "📺", parentSlug: "entertainment", description: "Television and streaming content" },
  
  { name: "Access Rights", slug: "access", icon: "🔑", description: "Exclusive access and memberships" },
  { name: "Event Access", slug: "events", icon: "🎟️", parentSlug: "access", description: "VIP and exclusive event access" },
  { name: "Club Memberships", slug: "clubs", icon: "🏆", parentSlug: "access", description: "Private club and venue access" },
];

// Database Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdRights: many(rights, { relationName: "creator" }),
  ownedRights: many(rights, { relationName: "owner" }),
  bids: many(bids),
  favorites: many(favorites),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  transactionsFrom: many(transactions, { relationName: "fromUser" }),
  transactionsTo: many(transactions, { relationName: "toUser" }),
  stakes: many(stakes),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent"
  }),
  children: many(categories, { relationName: "parent" }),
  rights: many(rights),
}));

export const rightsRelations = relations(rights, ({ one, many }) => ({
  creator: one(users, {
    fields: [rights.creatorId],
    references: [users.id],
    relationName: "creator"
  }),
  owner: one(users, {
    fields: [rights.ownerId],
    references: [users.id],
    relationName: "owner"
  }),
  category: one(categories, {
    fields: [rights.categoryId],
    references: [categories.id],
  }),
  highestBidder: one(users, {
    fields: [rights.highestBidderId],
    references: [users.id],
  }),
  bids: many(bids),
  favorites: many(favorites),
  transactions: many(transactions),
  stakes: many(stakes),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  right: one(rights, {
    fields: [bids.rightId],
    references: [rights.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  right: one(rights, {
    fields: [favorites.rightId],
    references: [rights.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower"
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following"
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  right: one(rights, {
    fields: [transactions.rightId],
    references: [rights.id],
  }),
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
    relationName: "fromUser"
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
    relationName: "toUser"
  }),
}));

export const stakesRelations = relations(stakes, ({ one, many }) => ({
  right: one(rights, {
    fields: [stakes.rightId],
    references: [rights.id],
  }),
  staker: one(users, {
    fields: [stakes.stakerId],
    references: [users.id],
  }),
  revenueDistributions: many(revenueDistributions),
}));

export const revenueDistributionsRelations = relations(revenueDistributions, ({ one }) => ({
  stake: one(stakes, {
    fields: [revenueDistributions.stakeId],
    references: [stakes.id],
  }),
}));
