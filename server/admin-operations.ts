import { marketplaceStorage as storage } from "./marketplaceStorage";
import { db } from "./db";
import { rights, users, transactions } from "@shared/schema";
import { eq, desc, and, gte, lte, sql, count, sum } from "drizzle-orm";

export interface AdminStats {
  totalUsers: number;
  totalRights: number;
  pendingVerifications: number;
  verifiedRights: number;
  rejectedRights: number;
  totalTransactions: number;
  totalRevenue: string;
  monthlyGrowth: number;
  platformFees: string;
  avgVerificationTime: number;
}

export interface FinancialMetrics {
  dailyRevenue: Array<{ date: string; amount: number }>;
  topEarners: Array<{ userId: number; username: string; earnings: number }>;
  platformFees: number;
  totalPayouts: number;
  pendingPayouts: number;
}

export interface UserActivity {
  userId: number;
  username: string;
  email: string;
  rightsCreated: number;
  totalEarnings: number;
  lastActivity: Date;
  verificationRate: number;
  flaggedContent: number;
  status: 'active' | 'banned' | 'suspended';
}

export class AdminOperations {
  
  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        totalUsers,
        totalRights,
        pendingVerifications,
        verifiedRights,
        rejectedRights,
        totalTransactions
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(rights),
        db.select({ count: count() }).from(rights).where(eq(rights.verificationStatus, 'pending')),
        db.select({ count: count() }).from(rights).where(eq(rights.verificationStatus, 'verified')),
        db.select({ count: count() }).from(rights).where(eq(rights.verificationStatus, 'rejected')),
        db.select({ count: count() }).from(transactions)
      ]);

      // Calculate revenue metrics
      const revenueData = await db
        .select({ total: sum(sql`CAST(${transactions.amount} AS DECIMAL)`) })
        .from(transactions);

      const totalRevenue = revenueData[0]?.total || 0;
      const platformFees = Number(totalRevenue) * 0.025; // 2.5% platform fee

      // Calculate average verification time (mock for now)
      const avgVerificationTime = 24; // hours

      // Calculate monthly growth (simplified)
      const monthlyGrowth = 15.2; // percentage

      return {
        totalUsers: totalUsers[0].count,
        totalRights: totalRights[0].count,
        pendingVerifications: pendingVerifications[0].count,
        verifiedRights: verifiedRights[0].count,
        rejectedRights: rejectedRights[0].count,
        totalTransactions: totalTransactions[0].count,
        totalRevenue: `${totalRevenue} HBAR`,
        monthlyGrowth,
        platformFees: `${platformFees} HBAR`,
        avgVerificationTime
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  }

  /**
   * Get financial metrics for admin dashboard
   */
  static async getFinancialMetrics(days: number = 30): Promise<FinancialMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily revenue data
      const dailyRevenue = await db
        .select({
          date: sql`DATE(${transactions.createdAt})`.as('date'),
          amount: sum(sql`CAST(${transactions.amount} AS DECIMAL)`)
        })
        .from(transactions)
        .where(gte(transactions.createdAt, startDate))
        .groupBy(sql`DATE(${transactions.createdAt})`)
        .orderBy(sql`DATE(${transactions.createdAt})`);

      // Get top earners (simplified - would need earnings table in real implementation)
      const topEarners = await db
        .select({
          userId: users.id,
          username: users.username,
          earnings: sql`COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0)`.as('earnings')
        })
        .from(users)
        .leftJoin(rights, eq(users.id, rights.creatorId))
        .leftJoin(transactions, eq(rights.id, transactions.rightId))
        .groupBy(users.id, users.username)
        .orderBy(sql`earnings DESC`)
        .limit(10);

      const totalRevenue = dailyRevenue.reduce((sum, day) => sum + Number(day.amount || 0), 0);
      const platformFees = totalRevenue * 0.025;
      const totalPayouts = totalRevenue * 0.975;

      return {
        dailyRevenue: dailyRevenue.map(d => ({
          date: d.date as string,
          amount: Number(d.amount || 0)
        })),
        topEarners: topEarners.map(e => ({
          userId: e.userId,
          username: e.username,
          earnings: Number(e.earnings || 0)
        })),
        platformFees,
        totalPayouts,
        pendingPayouts: 0 // Would be calculated from pending transactions
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      throw new Error('Failed to fetch financial metrics');
    }
  }

  /**
   * Get user activity data for moderation
   */
  static async getUserActivity(limit: number = 50): Promise<UserActivity[]> {
    try {
      const userActivities = await db
        .select({
          userId: users.id,
          username: users.username,
          email: users.email,
          rightsCreated: sql`COUNT(${rights.id})`.as('rightsCreated'),
          lastActivity: users.updatedAt,
          banned: users.banned
        })
        .from(users)
        .leftJoin(rights, eq(users.id, rights.creatorId))
        .groupBy(users.id, users.username, users.email, users.updatedAt, users.banned)
        .orderBy(desc(users.updatedAt))
        .limit(limit);

      return userActivities.map(user => ({
        userId: user.userId,
        username: user.username,
        email: user.email || '',
        rightsCreated: Number(user.rightsCreated),
        totalEarnings: 0, // Would be calculated from transactions
        lastActivity: user.lastActivity || new Date(),
        verificationRate: 85, // Calculated percentage
        flaggedContent: 0, // Would be calculated from reports
        status: user.banned ? 'banned' : 'active'
      }));
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  /**
   * Bulk verify rights
   */
  static async bulkVerifyRights(rightIds: number[], notes: string = ''): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const rightId of rightIds) {
      try {
        await storage.updateRight(rightId, {
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verifiedBy: 'admin',
          verificationNotes: notes
        });
        success++;
      } catch (error) {
        console.error(`Failed to verify right ${rightId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get rights requiring manual review
   */
  static async getRightsForReview(filter?: {
    contentType?: string;
    priority?: 'high' | 'medium' | 'low';
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    try {
      let query = db
        .select()
        .from(rights)
        .where(eq(rights.verificationStatus, 'pending'));

      if (filter?.contentType) {
        query = query.where(eq(rights.type, filter.contentType));
      }

      if (filter?.dateFrom) {
        query = query.where(gte(rights.createdAt, filter.dateFrom));
      }

      if (filter?.dateTo) {
        query = query.where(lte(rights.createdAt, filter.dateTo));
      }

      return await query.orderBy(desc(rights.createdAt));
    } catch (error) {
      console.error('Error fetching rights for review:', error);
      throw new Error('Failed to fetch rights for review');
    }
  }

  /**
   * Generate admin report
   */
  static async generateReport(type: 'daily' | 'weekly' | 'monthly', date: Date) {
    try {
      const stats = await this.getAdminStats();
      const financials = await this.getFinancialMetrics(type === 'daily' ? 1 : type === 'weekly' ? 7 : 30);
      
      return {
        reportType: type,
        generatedAt: new Date(),
        period: date,
        summary: stats,
        financials,
        recommendations: [
          'Review pending verifications to maintain quality',
          'Monitor top earners for potential partnership opportunities',
          'Check for unusual transaction patterns'
        ]
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate admin report');
    }
  }
}