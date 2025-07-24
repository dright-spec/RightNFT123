// Staking controller for cohesive staking management

import type { Response } from "express";
import type { AuthenticatedRequest, CreateStakeRequest } from "../api-types";
import { ApiResponseHelper, asyncHandler } from "../api-types";
import { marketplaceStorage as storage } from "../marketplaceStorage";
import { z } from "zod";

// Create stake validation schema
const createStakeSchema = z.object({
  rightId: z.number().min(1, "Valid right ID required"),
  terms: z.string().optional(),
  duration: z.string().optional().transform(val => val && val !== "" ? val : undefined),
});

// Fixed platform terms
const REVENUE_SHARE_PERCENTAGE = 75; // 75% to user
const MANAGEMENT_FEE = 15; // 15% platform fee

export class StakingController {
  // Get available rights for staking (user's own verified rights)
  static getAvailableRights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const verifiedRights = await storage.getRights({
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc"
    });

    // Filter to only show rights owned by the current user and not already staked
    const availableRights = [];
    for (const right of verifiedRights) {
      // Only include rights owned by the current user and verified
      if (right.ownerId === req.user.id && right.verificationStatus === 'verified') {
        const existingStake = await storage.getActiveStakeByRight(right.id);
        if (!existingStake) {
          availableRights.push(right);
        }
      }
    }

    res.json(ApiResponseHelper.success(
      availableRights,
      "Available rights for staking retrieved successfully"
    ));
  });

  // Create new stake
  static createStake = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { rightId, terms, duration } = createStakeSchema.parse(req.body);

    // Verify the right exists and is verified
    const right = await storage.getRight(rightId);
    if (!right) {
      return res.status(404).json(ApiResponseHelper.error("Right not found"));
    }

    if (right.verificationStatus !== "verified") {
      return res.status(400).json(ApiResponseHelper.error("Only verified rights can be staked"));
    }

    // Check if user owns the right
    if (right.ownerId !== req.user.id) {
      return res.status(403).json(ApiResponseHelper.error("You can only stake rights you own"));
    }

    // Check if right is already staked
    const existingStake = await storage.getActiveStakeByRight(rightId);
    if (existingStake) {
      return res.status(400).json(ApiResponseHelper.error("This right is already staked"));
    }

    // Calculate end date if duration is specified
    let endDate = null;
    if (duration) {
      const startDate = new Date();
      const durationMonths = parseInt(duration);
      endDate = new Date(startDate.getTime() + (durationMonths * 30 * 24 * 60 * 60 * 1000));
    }

    const stake = await storage.createStake({
      rightId,
      stakerId: req.user.id,
      revenueSharePercentage: REVENUE_SHARE_PERCENTAGE,
      managementFee: MANAGEMENT_FEE,
      terms: terms || "",
      duration: duration || null,
      endDate,
      status: 'active',
      startDate: new Date(),
    });

    res.status(201).json(ApiResponseHelper.success(
      stake,
      "Stake created successfully"
    ));
  });

  // Get user's stakes
  static getUserStakes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const userStakes = await storage.getUserStakes(req.user.id);

    res.json(ApiResponseHelper.success(
      userStakes,
      "User stakes retrieved successfully"
    ));
  });

  // Get single stake with details
  static getStake = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { id } = req.params;
    const stakeId = Number(id);

    if (isNaN(stakeId)) {
      return res.status(400).json(ApiResponseHelper.error("Invalid stake ID"));
    }

    const stake = await storage.getStakeWithDetails(stakeId);
    if (!stake) {
      return res.status(404).json(ApiResponseHelper.error("Stake not found"));
    }

    // Check if user owns the stake
    if (stake.stakerId !== req.user.id) {
      return res.status(403).json(ApiResponseHelper.error("You can only view your own stakes"));
    }

    res.json(ApiResponseHelper.success(
      stake,
      "Stake retrieved successfully"
    ));
  });

  // Update stake
  static updateStake = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { id } = req.params;
    const stakeId = Number(id);
    const { terms } = req.body;

    if (isNaN(stakeId)) {
      return res.status(400).json(ApiResponseHelper.error("Invalid stake ID"));
    }

    const stake = await storage.getStake(stakeId);
    if (!stake) {
      return res.status(404).json(ApiResponseHelper.error("Stake not found"));
    }

    // Check if user owns the stake
    if (stake.stakerId !== req.user.id) {
      return res.status(403).json(ApiResponseHelper.error("You can only update your own stakes"));
    }

    const updatedStake = await storage.updateStake(stakeId, { terms });

    res.json(ApiResponseHelper.success(
      updatedStake,
      "Stake updated successfully"
    ));
  });

  // End stake
  static endStake = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const { id } = req.params;
    const stakeId = Number(id);

    if (isNaN(stakeId)) {
      return res.status(400).json(ApiResponseHelper.error("Invalid stake ID"));
    }

    const stake = await storage.getStake(stakeId);
    if (!stake) {
      return res.status(404).json(ApiResponseHelper.error("Stake not found"));
    }

    // Check if user owns the stake
    if (stake.stakerId !== req.user.id) {
      return res.status(403).json(ApiResponseHelper.error("You can only end your own stakes"));
    }

    if (stake.status !== 'active') {
      return res.status(400).json(ApiResponseHelper.error("Stake is not active"));
    }

    const endedStake = await storage.updateStake(stakeId, { 
      status: 'ended',
      endDate: new Date(),
    });

    res.json(ApiResponseHelper.success(
      endedStake,
      "Stake ended successfully"
    ));
  });

  // Get staking statistics
  static getStakingStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiResponseHelper.error("Authentication required"));
    }

    const userStakes = await storage.getUserStakes(req.user.id);
    const availableRights = await this.getAvailableRightsCount(req.user.id);

    const stats = {
      totalStakes: userStakes.length,
      activeStakes: userStakes.filter(s => s.status === 'active').length,
      totalEarnings: userStakes.reduce((sum, stake) => sum + parseFloat(stake.stakerEarnings || '0'), 0),
      availableRights,
      averageRevenuShare: REVENUE_SHARE_PERCENTAGE,
      platformFee: MANAGEMENT_FEE,
    };

    res.json(ApiResponseHelper.success(
      stats,
      "Staking statistics retrieved successfully"
    ));
  });

  // Helper method to get available rights count
  private static async getAvailableRightsCount(userId: number): Promise<number> {
    const verifiedRights = await storage.getRights({
      limit: 1000,
    });

    // Filter to user's verified rights
    const userRights = verifiedRights.filter(r => r.ownerId === userId && r.verificationStatus === 'verified');

    let count = 0;
    for (const right of userRights) {
      const existingStake = await storage.getActiveStakeByRight(right.id);
      if (!existingStake) {
        count++;
      }
    }

    return count;
  }
}