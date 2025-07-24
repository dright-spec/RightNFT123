import { createHash } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

// Secure file storage configuration
const UPLOAD_DIR = path.join(process.cwd(), 'secure-uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export interface SecureFileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadTime: Date;
  isVerified: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending';
  previewAvailable: boolean;
}

export class SecureFileHandler {
  private uploadDir: string;

  constructor() {
    this.uploadDir = UPLOAD_DIR;
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Configure multer for secure file uploads
  getMulterConfig() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10 // Maximum 10 files per upload
      },
      fileFilter: (req: Request, file: Express.Multer.File, callback) => {
        // Check MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(new Error(`File type ${file.mimetype} not allowed`));
        }

        // Additional security checks
        if (this.containsMaliciousExtension(file.originalname)) {
          return callback(new Error('Potentially malicious file extension detected'));
        }

        callback(null, true);
      }
    });
  }

  private containsMaliciousExtension(filename: string): boolean {
    const maliciousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.rpm', '.dmg', '.iso', '.msi', '.run'
    ];
    
    const lowercaseFilename = filename.toLowerCase();
    return maliciousExtensions.some(ext => lowercaseFilename.endsWith(ext));
  }

  // Secure file processing and storage
  async processUpload(file: Express.Multer.File, userId: number): Promise<SecureFileInfo> {
    const fileId = this.generateSecureFileId();
    const fileHash = this.calculateFileHash(file.buffer);
    
    // Virus scan simulation (in production, integrate with actual antivirus service)
    const virusScanResult = await this.performVirusScan(file.buffer);
    
    if (virusScanResult === 'infected') {
      throw new Error('File failed virus scan');
    }

    // Store file securely
    const secureFilename = `${fileId}.secure`;
    const filePath = path.join(this.uploadDir, secureFilename);
    
    // Encrypt file content before storage
    const encryptedContent = this.encryptFileContent(file.buffer);
    await writeFile(filePath, encryptedContent);

    // Create file metadata
    const fileInfo: SecureFileInfo = {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      hash: fileHash,
      uploadTime: new Date(),
      isVerified: false,
      virusScanResult,
      previewAvailable: this.canGeneratePreview(file.mimetype)
    };

    // Store metadata
    await this.storeFileMetadata(fileInfo, userId);
    
    return fileInfo;
  }

  private generateSecureFileId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return createHash('sha256').update(timestamp + random).digest('hex').substring(0, 32);
  }

  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async performVirusScan(buffer: Buffer): Promise<'clean' | 'infected' | 'pending'> {
    // Simulate virus scanning - in production, integrate with ClamAV, VirusTotal, etc.
    
    // Basic malware signature detection
    const suspiciousPatterns = [
      Buffer.from([0x4D, 0x5A]), // PE executable header
      Buffer.from('javascript:', 'utf8'),
      Buffer.from('<script', 'utf8'),
      Buffer.from('eval(', 'utf8'),
      Buffer.from('document.write', 'utf8')
    ];

    for (const pattern of suspiciousPatterns) {
      if (buffer.includes(pattern)) {
        return 'infected';
      }
    }

    return 'clean';
  }

  private encryptFileContent(buffer: Buffer): Buffer {
    // Simple XOR encryption for demonstration - use proper encryption in production
    const key = Buffer.from('secure_file_encryption_key_2024', 'utf8');
    const encrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      encrypted[i] = buffer[i] ^ key[i % key.length];
    }
    
    return encrypted;
  }

  private decryptFileContent(encryptedBuffer: Buffer): Buffer {
    // Reverse of encryption
    return this.encryptFileContent(encryptedBuffer);
  }

  private canGeneratePreview(mimeType: string): boolean {
    const previewableMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];
    
    return previewableMimeTypes.includes(mimeType);
  }

  private async storeFileMetadata(fileInfo: SecureFileInfo, userId: number) {
    const metadataPath = path.join(this.uploadDir, `${fileInfo.id}.metadata`);
    const metadata = {
      ...fileInfo,
      userId,
      uploadTime: fileInfo.uploadTime.toISOString()
    };
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  // Admin file access methods
  async getFileForAdmin(fileId: string): Promise<{ fileInfo: SecureFileInfo; content: Buffer } | null> {
    try {
      const metadataPath = path.join(this.uploadDir, `${fileId}.metadata`);
      const filePath = path.join(this.uploadDir, `${fileId}.secure`);

      if (!existsSync(metadataPath) || !existsSync(filePath)) {
        return null;
      }

      const metadataRaw = await readFile(metadataPath, 'utf8');
      const fileInfo = JSON.parse(metadataRaw) as SecureFileInfo;
      
      const encryptedContent = await readFile(filePath);
      const decryptedContent = this.decryptFileContent(encryptedContent);

      return {
        fileInfo,
        content: decryptedContent
      };
    } catch (error) {
      console.error('Error accessing file for admin:', error);
      return null;
    }
  }

  async generateSecurePreview(fileId: string): Promise<{ 
    previewType: 'image' | 'pdf' | 'text' | 'unsupported';
    previewData?: string;
    error?: string;
  }> {
    const fileData = await this.getFileForAdmin(fileId);
    
    if (!fileData) {
      return { previewType: 'unsupported', error: 'File not found' };
    }

    const { fileInfo, content } = fileData;

    try {
      switch (fileInfo.mimeType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          return {
            previewType: 'image',
            previewData: `data:${fileInfo.mimeType};base64,${content.toString('base64')}`
          };

        case 'application/pdf':
          return {
            previewType: 'pdf',
            previewData: content.toString('base64')
          };

        case 'text/plain':
          const textContent = content.toString('utf8');
          // Sanitize text content to prevent XSS
          const sanitizedText = textContent
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .substring(0, 10000); // Limit to first 10KB
          
          return {
            previewType: 'text',
            previewData: sanitizedText
          };

        default:
          return { 
            previewType: 'unsupported', 
            error: `Preview not available for ${fileInfo.mimeType}` 
          };
      }
    } catch (error) {
      return { 
        previewType: 'unsupported', 
        error: `Error generating preview: ${error}` 
      };
    }
  }

  async listFilesForAdmin(): Promise<SecureFileInfo[]> {
    const files: SecureFileInfo[] = [];
    
    try {
      const { readdir } = await import('fs/promises');
      const dirContents = await readdir(this.uploadDir);
      
      for (const filename of dirContents) {
        if (filename.endsWith('.metadata')) {
          const metadataPath = path.join(this.uploadDir, filename);
          const metadataRaw = await readFile(metadataPath, 'utf8');
          const fileInfo = JSON.parse(metadataRaw) as SecureFileInfo;
          files.push(fileInfo);
        }
      }
    } catch (error) {
      console.error('Error listing files for admin:', error);
    }
    
    return files.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
  }

  async markFileAsVerified(fileId: string, verified: boolean): Promise<boolean> {
    try {
      const metadataPath = path.join(this.uploadDir, `${fileId}.metadata`);
      
      if (!existsSync(metadataPath)) {
        return false;
      }

      const metadataRaw = await readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataRaw);
      metadata.isVerified = verified;
      
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      return true;
    } catch (error) {
      console.error('Error marking file as verified:', error);
      return false;
    }
  }

  // Clean up old files (should be run periodically)
  async cleanupOldFiles(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const files = await this.listFilesForAdmin();
      
      for (const file of files) {
        if (new Date(file.uploadTime) < cutoffDate) {
          await this.deleteFile(file.id);
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }

  private async deleteFile(fileId: string) {
    try {
      const metadataPath = path.join(this.uploadDir, `${fileId}.metadata`);
      const filePath = path.join(this.uploadDir, `${fileId}.secure`);
      
      const { unlink } = await import('fs/promises');
      
      if (existsSync(metadataPath)) {
        await unlink(metadataPath);
      }
      
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
    }
  }
}

export const secureFileHandler = new SecureFileHandler();