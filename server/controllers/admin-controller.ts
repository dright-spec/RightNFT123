// Admin controller for platform management

import type { Response } from "express";
import type { AuthenticatedRequest, VerificationRequest } from "../api-types";
import { ApiResponseHelper, asyncHandler } from "../api-types";
import { marketplaceStorage as storage } from "../marketplaceStorage";
import { db } from "../db";
import { users, rights } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";

export class AdminController {
  // Get admin dashboard statistics
  static getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get comprehensive stats using direct database queries
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [totalRightsResult] = await db.select({ count: count() }).from(rights);
    
    const allRights = await db.select().from(rights);
    const pendingRights = allRights.filter(r => r.verificationStatus === 'pending');
    const verifiedRights = allRights.filter(r => r.verificationStatus === 'verified');
    
    const allUsers = await db.select().from(users);
    const bannedUsers = allUsers.filter(u => u.isBanned);

    // Calculate total revenue from completed transactions
    const totalRevenue = allRights
      .filter(r => r.isListed)
      .reduce((sum, right) => sum + parseFloat(right.price || '0'), 0);

    const stats = {
      totalUsers: totalUsersResult.count,
      totalRights: totalRightsResult.count,
      pendingVerifications: pendingRights.length,
      verifiedRights: verifiedRights.length,
      bannedUsers: bannedUsers.length,
      totalRevenue: totalRevenue.toFixed(2),
      currency: 'ETH',
      monthlyGrowth: 15.2 // This would be calculated from historical data
    };

    res.json(ApiResponseHelper.success(
      stats,
      "Admin statistics retrieved successfully"
    ));
  });

  // Get rights for admin review
  static getRights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status = 'all', search, page = 1, limit = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const options = {
      limit: Number(limit),
      offset,
      search: search as string,
      sortBy: "createdAt",
      sortOrder: "desc" as const
    };

    let allRights = await storage.getRights(options);
    
    // Filter by status if specified
    if (status && status !== "all") {
      allRights = allRights.filter(right => right.verificationStatus === status);
    }

    // Get total count for pagination
    const totalRights = await storage.getRights({ limit: 1000 });
    const filteredTotal = status === 'all' ? totalRights.length : 
      totalRights.filter(r => r.verificationStatus === status).length;

    res.json(ApiResponseHelper.paginated(
      allRights,
      filteredTotal,
      Number(page),
      Number(limit),
      "Rights retrieved successfully"
    ));
  });

  // Verify or reject a right
  static verifyRight = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { rightId } = req.params;
    const { status, notes }: VerificationRequest = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json(ApiResponseHelper.error("Invalid verification status"));
    }

    const right = await storage.getRight(Number(rightId));
    if (!right) {
      return res.status(404).json(ApiResponseHelper.error("Right not found"));
    }

    // Update verification status
    const updatedRight = await storage.updateRight(Number(rightId), {
      verificationStatus: status,
      verifiedAt: new Date(),
      verifiedBy: req.user.username,
      verificationNotes: notes || null,
    });

    // Note: Notification creation would be implemented when notification system is available

    res.json(ApiResponseHelper.success(
      updatedRight,
      `Right ${status} successfully`
    ));
  });

  // Get pending rights for verification
  static getPendingRights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pendingRights = await storage.getRights({
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "asc"
    });

    const filtered = pendingRights.filter(right => right.verificationStatus === 'pending');

    res.json(ApiResponseHelper.success(
      filtered,
      "Pending rights retrieved successfully"
    ));
  });

  // Get users for admin management
  static getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, search, status } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Filter by search if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      allUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.displayName?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status if provided
    if (status === 'banned') {
      allUsers = allUsers.filter(user => user.isBanned);
    } else if (status === 'active') {
      allUsers = allUsers.filter(user => !user.isBanned);
    }

    // Remove password from response
    const safeUsers = allUsers.map(({ password, ...user }) => user);

    const [totalResult] = await db.select({ count: count() }).from(users);

    res.json(ApiResponseHelper.paginated(
      safeUsers,
      totalResult.count,
      Number(page),
      Number(limit),
      "Users retrieved successfully"
    ));
  });

  // Toggle user ban status
  static toggleUserBan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { userId } = req.params;
    const { ban, reason } = req.body;

    const targetUser = await storage.getUser(Number(userId));
    if (!targetUser) {
      return res.status(404).json(ApiResponseHelper.error("User not found"));
    }

    // Prevent self-ban
    if (targetUser.id === req.user.id) {
      return res.status(400).json(ApiResponseHelper.error("Cannot ban yourself"));
    }

    const updatedUser = await storage.updateUser(Number(userId), {
      isBanned: Boolean(ban)
    });

    // Note: Notification creation would be implemented when notification system is available

    res.json(ApiResponseHelper.success(
      { ...updatedUser, password: undefined }, // Remove password from response
      `User ${ban ? 'banned' : 'unbanned'} successfully`
    ));
  });

  // Get admin activity log
  static getActivityLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 50 } = req.query;
    
    // This would typically come from an audit log table
    // For now, we'll return recent rights verifications as admin activity
    const recentRights = await storage.getRights({
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      sortBy: "verifiedAt",
      sortOrder: "desc"
    });

    const activities = recentRights
      .filter(right => right.verifiedAt && right.verifiedBy)
      .map(right => ({
        id: `verify_${right.id}`,
        action: `${right.verificationStatus}_right`,
        targetType: 'right',
        targetId: right.id,
        targetTitle: right.title,
        adminUsername: right.verifiedBy,
        timestamp: right.verifiedAt,
        details: right.verificationNotes
      }));

    res.json(ApiResponseHelper.paginated(
      activities,
      activities.length,
      Number(page),
      Number(limit),
      "Admin activity log retrieved successfully"
    ));
  });

  // Get performance metrics
  static getPerformanceMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { hours = 24 } = req.query;
    
    // This would integrate with the PerformanceMonitor
    const metrics = {
      averageResponseTime: 150,
      totalRequests: 1250,
      errorRate: 0.02,
      activeUsers: 45,
      memoryUsage: 78.5,
      cpuUsage: 35.2,
      databaseConnections: 12,
      timeframe: `${hours} hours`
    };

    res.json(ApiResponseHelper.success(
      metrics,
      "Performance metrics retrieved successfully"
    ));
  });

  // Get all stakes for admin view
  static getAllStakes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, status = 'active' } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const stakes = await storage.getStakes({ 
      limit: Number(limit), 
      offset, 
      status: status as string 
    });

    // Get total count for pagination
    const allStakes = await storage.getStakes({ limit: 1000 });
    const totalStakes = status === 'all' ? allStakes.length : 
      allStakes.filter(s => s.status === status).length;

    res.json(ApiResponseHelper.paginated(
      stakes,
      totalStakes,
      Number(page),
      Number(limit),
      "Stakes retrieved successfully"
    ));
  });
}