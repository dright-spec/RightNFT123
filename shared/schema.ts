import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  email: text("email").unique(),
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
  parentId: integer("parent_id").references(() => categories.id),
  itemCount: integer("item_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rights = pgTable("rights", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").unique(),
  title: text("title").notNull(),
  type: text("type").notNull(), // copyright, royalty, access, ownership, license
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description").notNull(),
  tags: text("tags").array().default([]), // searchable tags
  symbol: text("symbol").notNull(), // 📄, 💰, 🔐, etc.
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
  minBidAmount: decimal("min_bid_amount", { precision: 18, scale: 8 }),
  highestBidAmount: decimal("highest_bid_amount", { precision: 18, scale: 8 }),
  highestBidderId: integer("highest_bidder_id").references(() => users.id),
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
  
  // Hedera blockchain integration
  hederaTokenId: text("hedera_token_id"), // Hedera token ID (e.g., "0.0.123456")
  hederaSerialNumber: integer("hedera_serial_number"), // NFT serial number
  hederaTransactionId: text("hedera_transaction_id"), // Mint transaction ID
  hederaMetadataUri: text("hedera_metadata_uri"), // IPFS URI for NFT metadata
  hederaAccountId: text("hedera_account_id"), // Current NFT holder account
  hederaNetwork: text("hedera_network").default("testnet"), // mainnet, testnet, previewnet
  
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  email: true,
  profileImageUrl: true,
  bio: true,
  website: true,
  twitter: true,
  instagram: true,
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
  symbol: true,
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
