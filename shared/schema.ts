import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rights = pgTable("rights", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").unique(),
  title: text("title").notNull(),
  type: text("type").notNull(), // copyright, royalty, access, ownership, license
  description: text("description").notNull(),
  symbol: text("symbol").notNull(), // 📄, 💰, 🔐, etc.
  paysDividends: boolean("pays_dividends").default(false),
  paymentAddress: text("payment_address"),
  paymentFrequency: text("payment_frequency"), // monthly, quarterly, yearly, streaming
  price: decimal("price", { precision: 18, scale: 8 }),
  currency: text("currency").default("ETH"),
  legalDocumentHash: text("legal_document_hash"),
  legalDocumentUrl: text("legal_document_url"),
  metadataHash: text("metadata_hash"),
  metadataUrl: text("metadata_url"),
  creatorId: integer("creator_id").references(() => users.id),
  ownerId: integer("owner_id").references(() => users.id),
  isListed: boolean("is_listed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  rightId: integer("right_id").references(() => rights.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  transactionHash: text("transaction_hash"),
  price: decimal("price", { precision: 18, scale: 8 }),
  currency: text("currency").default("ETH"),
  type: text("type").notNull(), // mint, transfer, sale
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertRightSchema = createInsertSchema(rights).pick({
  title: true,
  type: true,
  description: true,
  symbol: true,
  paysDividends: true,
  paymentAddress: true,
  paymentFrequency: true,
  price: true,
  currency: true,
  legalDocumentHash: true,
  legalDocumentUrl: true,
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
export type InsertRight = z.infer<typeof insertRightSchema>;
export type Right = typeof rights.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Extended types with relations
export type RightWithCreator = Right & {
  creator: User;
  owner: User;
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
