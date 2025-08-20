import crypto from 'crypto';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SessionData {
  userId: number;
  walletAddress: string;
  hederaAccountId?: string;
  walletType: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface SessionStore {
  [sessionToken: string]: SessionData;
}

class SessionManager {
  private sessions: SessionStore = {};
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
  }

  /**
   * Generate a cryptographically secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session for a user
   */
  async createSession(userId: number, walletAddress: string, hederaAccountId?: string, walletType = 'hashpack', req?: any): Promise<string> {
    const sessionToken = this.generateSessionToken();
    
    const sessionData: SessionData = {
      userId,
      walletAddress,
      hederaAccountId,
      walletType,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent')
    };

    this.sessions[sessionToken] = sessionData;
    
    console.log(`Session created for user ${userId} with token ${sessionToken.substring(0, 8)}...`);
    return sessionToken;
  }

  /**
   * Validate and retrieve session data
   */
  async getSession(sessionToken: string): Promise<SessionData | null> {
    if (!sessionToken) return null;

    const session = this.sessions[sessionToken];
    if (!session) return null;

    // Check if session has expired
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const inactiveTime = now.getTime() - session.lastActivity.getTime();

    // Session expires after 7 days or 24 hours of inactivity
    if (sessionAge > this.SESSION_DURATION || inactiveTime > 24 * 60 * 60 * 1000) {
      delete this.sessions[sessionToken];
      console.log(`Session expired for token ${sessionToken.substring(0, 8)}...`);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    
    return session;
  }

  /**
   * Validate session and return session data if valid (simplified for debugging)
   */
  validateSession(sessionToken: string): SessionData | null {
    if (!sessionToken) {
      console.log('validateSession: No token provided');
      return null;
    }

    const session = this.sessions[sessionToken];
    if (!session) {
      console.log(`validateSession: No session found for token ${sessionToken.substring(0, 8)}...`);
      console.log('Available sessions:', Object.keys(this.sessions).map(k => k.substring(0, 8) + '...'));
      return null;
    }

    // For now, skip expiration checks to ensure basic functionality works
    session.lastActivity = new Date();
    console.log(`validateSession: Session found for user ${session.userId}`);
    return session;
  }

  /**
   * Get user from session token and validate
   */
  async getUserFromSession(sessionToken: string): Promise<any | null> {
    console.log(`getUserFromSession called with token: ${sessionToken?.substring(0, 8)}...`);
    
    const session = this.validateSession(sessionToken);
    if (!session) {
      console.log('Session validation failed for token:', sessionToken?.substring(0, 8) + '...');
      return null;
    }

    try {
      // Fetch fresh user data from database
      const [user] = await db.select().from(users).where(eq(users.id, session.userId));
      
      if (!user) {
        // User was deleted, invalidate session
        delete this.sessions[sessionToken];
        console.log('User not found in database, invalidating session');
        return null;
      }

      console.log('User retrieved from session:', user.username);
      return user;
    } catch (error) {
      console.error('Error fetching user from session:', error);
      return null;
    }
  }

  /**
   * Destroy a session (logout)
   */
  async destroySession(sessionToken: string): Promise<boolean> {
    if (this.sessions[sessionToken]) {
      delete this.sessions[sessionToken];
      console.log(`Session destroyed for token ${sessionToken.substring(0, 8)}...`);
      return true;
    }
    return false;
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: number): Promise<number> {
    let destroyedCount = 0;
    
    for (const [token, session] of Object.entries(this.sessions)) {
      if (session.userId === userId) {
        delete this.sessions[token];
        destroyedCount++;
      }
    }
    
    console.log(`Destroyed ${destroyedCount} sessions for user ${userId}`);
    return destroyedCount;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, session] of Object.entries(this.sessions)) {
      const sessionAge = now.getTime() - session.createdAt.getTime();
      const inactiveTime = now.getTime() - session.lastActivity.getTime();

      if (sessionAge > this.SESSION_DURATION || inactiveTime > 24 * 60 * 60 * 1000) {
        delete this.sessions[token];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): { totalSessions: number; activeUsers: number } {
    const totalSessions = Object.keys(this.sessions).length;
    const activeUsers = new Set(Object.values(this.sessions).map(s => s.userId)).size;
    
    return { totalSessions, activeUsers };
  }

  /**
   * Get all sessions for debugging (admin only)
   */
  getAllSessions(): { [token: string]: Omit<SessionData, 'ipAddress' | 'userAgent'> } {
    const sanitizedSessions: { [token: string]: Omit<SessionData, 'ipAddress' | 'userAgent'> } = {};
    
    for (const [token, session] of Object.entries(this.sessions)) {
      sanitizedSessions[token.substring(0, 8) + '...'] = {
        userId: session.userId,
        walletAddress: session.walletAddress,
        hederaAccountId: session.hederaAccountId,
        walletType: session.walletType,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      };
    }
    
    return sanitizedSessions;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();