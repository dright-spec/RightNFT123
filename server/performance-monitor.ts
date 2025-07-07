import { marketplaceStorage as storage } from "./marketplaceStorage";
import { db } from "./db";
import { rights, users, transactions } from "@shared/schema";
import { eq, desc, gte, sql, count, avg } from "drizzle-orm";

export interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  pendingVerifications: number;
  recentTransactions: number;
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
  };
  hederaNetwork: {
    status: 'healthy' | 'degraded' | 'down';
    lastTransactionTime: Date | null;
    pendingTransactions: number;
  };
  verification: {
    averageTime: number;
    successRate: number;
    backlogSize: number;
  };
  revenue: {
    todayTotal: number;
    hourlyRate: number;
    topPerformingCategory: string;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: RealTimeMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private startTime = new Date();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Collect current real-time metrics
   */
  async collectMetrics(): Promise<RealTimeMetrics> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Database queries for metrics
      const [
        activeUsersResult,
        pendingVerificationsResult,
        recentTransactionsResult,
        todayTransactionsResult,
        verificationStats
      ] = await Promise.all([
        db.select({ count: count() }).from(users).where(gte(users.updatedAt, hourAgo)),
        db.select({ count: count() }).from(rights).where(eq(rights.verificationStatus, 'pending')),
        db.select({ count: count() }).from(transactions).where(gte(transactions.createdAt, hourAgo)),
        db.select({ 
          count: count(),
          total: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
        }).from(transactions).where(gte(transactions.createdAt, dayAgo)),
        this.getVerificationStats()
      ]);

      // System performance metrics
      const systemLoad = this.getSystemLoad();
      
      // Hedera network status
      const hederaStatus = await this.checkHederaStatus();

      const metrics: RealTimeMetrics = {
        timestamp: now,
        activeUsers: activeUsersResult[0]?.count || 0,
        pendingVerifications: pendingVerificationsResult[0]?.count || 0,
        recentTransactions: recentTransactionsResult[0]?.count || 0,
        systemLoad,
        hederaNetwork: hederaStatus,
        verification: verificationStats,
        revenue: {
          todayTotal: Number(todayTransactionsResult[0]?.total || 0),
          hourlyRate: Number(todayTransactionsResult[0]?.total || 0) / 24,
          topPerformingCategory: 'YouTube Video' // Would be calculated from actual data
        }
      };

      // Store metrics (keep last 100 entries)
      this.metrics.push(metrics);
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }

      // Check for alerts
      await this.checkAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      throw new Error('Failed to collect performance metrics');
    }
  }

  /**
   * Get verification statistics
   */
  private async getVerificationStats() {
    try {
      const [avgTimeResult, successRateResult, backlogResult] = await Promise.all([
        db.select({
          avg: sql`AVG(EXTRACT(EPOCH FROM (verified_at - created_at)) / 3600)`
        }).from(rights).where(eq(rights.verificationStatus, 'verified')),
        db.select({
          verified: count(sql`CASE WHEN verification_status = 'verified' THEN 1 END`),
          total: count()
        }).from(rights),
        db.select({ count: count() }).from(rights).where(eq(rights.verificationStatus, 'pending'))
      ]);

      const avgTime = Number(avgTimeResult[0]?.avg || 24);
      const successRate = successRateResult[0]?.total > 0 
        ? (Number(successRateResult[0]?.verified) / Number(successRateResult[0]?.total)) * 100
        : 0;

      return {
        averageTime: avgTime,
        successRate: Math.round(successRate),
        backlogSize: backlogResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return {
        averageTime: 0,
        successRate: 0,
        backlogSize: 0
      };
    }
  }

  /**
   * Get system performance metrics
   */
  private getSystemLoad() {
    const used = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // Convert to ms
      memoryUsage: Math.round(used.heapUsed / used.heapTotal * 100),
      responseTime: Math.round(Math.random() * 50 + 10) // Mock response time
    };
  }

  /**
   * Check Hedera network status
   */
  private async checkHederaStatus() {
    try {
      // In production, this would check actual Hedera network status
      const lastTransactionTime = await db
        .select({ createdAt: transactions.createdAt })
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(1);

      const pendingTransactions = await db
        .select({ count: count() })
        .from(rights)
        .where(eq(rights.verificationStatus, 'verified'));

      return {
        status: 'healthy' as const,
        lastTransactionTime: lastTransactionTime[0]?.createdAt || null,
        pendingTransactions: pendingTransactions[0]?.count || 0
      };
    } catch (error) {
      return {
        status: 'degraded' as const,
        lastTransactionTime: null,
        pendingTransactions: 0
      };
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(metrics: RealTimeMetrics) {
    const alerts: PerformanceAlert[] = [];

    // High pending verifications alert
    if (metrics.pendingVerifications > 50) {
      alerts.push({
        id: `pending-verifications-${Date.now()}`,
        type: 'warning',
        title: 'High Verification Backlog',
        message: `${metrics.pendingVerifications} rights pending verification`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // High memory usage alert
    if (metrics.systemLoad.memoryUsage > 85) {
      alerts.push({
        id: `memory-usage-${Date.now()}`,
        type: 'error',
        title: 'High Memory Usage',
        message: `Memory usage at ${metrics.systemLoad.memoryUsage}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Slow verification time alert
    if (metrics.verification.averageTime > 48) {
      alerts.push({
        id: `slow-verification-${Date.now()}`,
        type: 'warning',
        title: 'Slow Verification Time',
        message: `Average verification time: ${metrics.verification.averageTime.toFixed(1)} hours`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Low success rate alert
    if (metrics.verification.successRate < 80) {
      alerts.push({
        id: `low-success-rate-${Date.now()}`,
        type: 'warning',
        title: 'Low Verification Success Rate',
        message: `Success rate: ${metrics.verification.successRate}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): RealTimeMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get current alerts
   */
  getAlerts(unresolved: boolean = false): PerformanceAlert[] {
    return unresolved 
      ? this.alerts.filter(a => !a.resolved)
      : this.alerts;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get uptime in hours
   */
  getUptime(): number {
    return (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const latest = this.metrics[this.metrics.length - 1];
    const unresolvedAlerts = this.getAlerts(true);
    
    return {
      status: unresolvedAlerts.length === 0 ? 'healthy' : 
              unresolvedAlerts.some(a => a.type === 'error') ? 'critical' : 'warning',
      uptime: this.getUptime(),
      activeIssues: unresolvedAlerts.length,
      lastUpdated: latest?.timestamp || new Date(),
      keyMetrics: latest ? {
        activeUsers: latest.activeUsers,
        pendingVerifications: latest.pendingVerifications,
        systemLoad: latest.systemLoad.memoryUsage,
        hederaStatus: latest.hederaNetwork.status
      } : null
    };
  }
}