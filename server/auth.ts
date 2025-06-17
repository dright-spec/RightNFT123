import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { marketplaceStorage as storage } from './marketplaceStorage';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate email verification token
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure random password for wallet users
  static generateSecurePassword(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Login with email/username and password
  static async loginWithPassword(identifier: string, password: string): Promise<AuthResult> {
    try {
      // Try to find user by email or username
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if password matches
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Send email verification (mock implementation)
  static async sendEmailVerification(email: string, token: string, username: string): Promise<boolean> {
    try {
      // In production, integrate with email service like SendGrid, Mailgun, etc.
      console.log(`Email verification for ${email}:`);
      console.log(`Username: ${username}`);
      console.log(`Verification link: ${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`);
      console.log('Note: In production, this would send an actual email');
      
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Verify email token
  static async verifyEmailToken(token: string): Promise<AuthResult> {
    try {
      const user = await storage.getUserByEmailVerificationToken(token);
      
      if (!user) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Check if token is expired (24 hours)
      const now = new Date();
      if (user.emailVerificationExpires && now > user.emailVerificationExpires) {
        return { success: false, error: 'Verification token has expired' };
      }

      // Mark email as verified
      const updatedUser = await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });

      if (!updatedUser) {
        return { success: false, error: 'Failed to verify email' };
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Email verification failed' };
    }
  }

  // Resend email verification
  static async resendEmailVerification(email: string): Promise<boolean> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return false;
      }

      if (user.emailVerified) {
        return false; // Already verified
      }

      // Generate new token
      const token = this.generateEmailVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.updateUser(user.id, {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      });

      return this.sendEmailVerification(email, token, user.username);
    } catch (error) {
      console.error('Resend verification error:', error);
      return false;
    }
  }
}