import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { fileTypeFromBuffer } from 'file-type';

export interface SecureFileUpload {
  id: string;
  originalName: string;
  secureFilename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  rightId: number;
  uploaderInfo: {
    ipAddress: string;
    userAgent: string;
  };
  securityChecks: {
    fileHash: string;
    virusScanned: boolean;
    typeValidated: boolean;
    sizeValidated: boolean;
  };
  adminAccess: {
    viewToken?: string;
    viewedBy?: string;
    viewedAt?: Date;
    accessCount: number;
  };
}

export class SecureFileService {
  private readonly SECURE_UPLOAD_DIR = 'secure-uploads';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor() {
    this.ensureSecureDirectory();
  }

  private async ensureSecureDirectory() {
    try {
      await fs.access(this.SECURE_UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.SECURE_UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    rightId: number,
    uploaderInfo: { ipAddress: string; userAgent: string }
  ): Promise<SecureFileUpload> {
    // 1. Validate file size
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed size (50MB)');
    }

    // 2. Detect actual file type
    const detectedType = await fileTypeFromBuffer(fileBuffer);
    if (!detectedType || !this.ALLOWED_TYPES.includes(detectedType.mime)) {
      throw new Error(`File type not allowed. Detected: ${detectedType?.mime || 'unknown'}`);
    }

    // 3. Generate secure filename and file hash
    const fileId = randomBytes(16).toString('hex');
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    const secureFilename = `${fileId}_${Date.now()}${extname(originalName)}`;
    const filePath = join(this.SECURE_UPLOAD_DIR, secureFilename);

    // 4. Save file securely
    await fs.writeFile(filePath, fileBuffer);

    // 5. Create secure file record
    const secureFile: SecureFileUpload = {
      id: fileId,
      originalName,
      secureFilename,
      fileType: detectedType.mime,
      fileSize: fileBuffer.length,
      uploadedAt: new Date(),
      rightId,
      uploaderInfo,
      securityChecks: {
        fileHash,
        virusScanned: false, // Would integrate with antivirus service
        typeValidated: true,
        sizeValidated: true
      },
      adminAccess: {
        accessCount: 0
      }
    };

    return secureFile;
  }

  async generateAdminViewToken(fileId: string, adminId: string): Promise<string> {
    // Generate time-limited access token for admin file viewing
    const token = randomBytes(32).toString('hex');
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    // Store token with expiry (in production, use Redis or database)
    // For now, encode the info in the token itself
    const tokenData = {
      fileId,
      adminId,
      expiresAt: expiryTime,
      type: 'admin_file_access'
    };
    
    const encodedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    return `${token}.${encodedToken}`;
  }

  async validateAdminAccess(token: string): Promise<{ fileId: string; adminId: string } | null> {
    try {
      const [randomPart, encodedData] = token.split('.');
      const tokenData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
      
      if (tokenData.expiresAt < Date.now()) {
        return null; // Token expired
      }
      
      return {
        fileId: tokenData.fileId,
        adminId: tokenData.adminId
      };
    } catch {
      return null;
    }
  }

  async getSecureFile(fileId: string, adminToken: string): Promise<Buffer | null> {
    const access = await this.validateAdminAccess(adminToken);
    if (!access || access.fileId !== fileId) {
      return null;
    }

    try {
      // Find the file (in production, get filename from database)
      const files = await fs.readdir(this.SECURE_UPLOAD_DIR);
      const targetFile = files.find(f => f.startsWith(fileId));
      
      if (!targetFile) {
        return null;
      }

      const filePath = join(this.SECURE_UPLOAD_DIR, targetFile);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async validateFileIntegrity(fileId: string, expectedHash: string): Promise<boolean> {
    try {
      const files = await fs.readdir(this.SECURE_UPLOAD_DIR);
      const targetFile = files.find(f => f.startsWith(fileId));
      
      if (!targetFile) {
        return false;
      }

      const filePath = join(this.SECURE_UPLOAD_DIR, targetFile);
      const fileBuffer = await fs.readFile(filePath);
      const currentHash = createHash('sha256').update(fileBuffer).digest('hex');
      
      return currentHash === expectedHash;
    } catch {
      return false;
    }
  }

  async auditFileAccess(fileId: string, adminId: string, action: string) {
    // Log all file access for security auditing
    const auditEntry = {
      timestamp: new Date().toISOString(),
      fileId,
      adminId,
      action,
      ipAddress: 'admin_system' // Would get from request
    };
    
    console.log('[SECURITY AUDIT]', auditEntry);
    // In production, store in dedicated audit log database
  }
}

export const secureFileService = new SecureFileService();