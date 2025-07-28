import { Express } from 'express';
import multer from 'multer';
import { secureFileService, SecureFileUpload } from './secure-file-service';

// In-memory storage for file metadata (in production, use database)
const fileMetadataStore = new Map<string, SecureFileUpload>();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Basic file filter - detailed validation happens in SecureFileService
    const allowedMimes = [
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
    
    cb(null, allowedMimes.includes(file.mimetype));
  }
});

export function setupSecureFileRoutes(app: Express) {
  
  // Secure file upload endpoint
  app.post('/api/secure-upload/:rightId', upload.array('files', 10), async (req, res) => {
    try {
      const rightId = parseInt(req.params.rightId);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      if (isNaN(rightId)) {
        return res.status(400).json({ error: 'Invalid right ID' });
      }

      const uploaderInfo = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const uploadedFiles: SecureFileUpload[] = [];

      // Process each file securely
      for (const file of files) {
        try {
          const secureFile = await secureFileService.uploadFile(
            file.buffer,
            file.originalname,
            rightId,
            uploaderInfo
          );
          
          // Store metadata for later retrieval
          fileMetadataStore.set(secureFile.id, secureFile);
          uploadedFiles.push(secureFile);
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError);
          // Continue with other files, but log the error
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'No files could be processed successfully' });
      }

      // Return sanitized file info (no sensitive paths)
      const fileResponses = uploadedFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        securityChecks: {
          typeValidated: file.securityChecks.typeValidated,
          sizeValidated: file.securityChecks.sizeValidated,
          virusScanned: file.securityChecks.virusScanned
        }
      }));

      res.json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded securely`,
        files: fileResponses
      });

    } catch (error) {
      console.error('Secure upload error:', error);
      res.status(500).json({ error: 'Failed to upload files securely' });
    }
  });

  // Admin-only file access endpoint
  app.get('/api/admin/secure-file/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const adminToken = req.headers.authorization?.replace('Bearer ', '');

      if (!adminToken) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      // Validate admin access
      const access = await secureFileService.validateAdminAccess(adminToken);
      if (!access) {
        return res.status(403).json({ error: 'Invalid or expired admin token' });
      }

      // Get file metadata
      const fileMetadata = fileMetadataStore.get(fileId);
      if (!fileMetadata) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Validate file integrity
      const isIntegrityValid = await secureFileService.validateFileIntegrity(
        fileId, 
        fileMetadata.securityChecks.fileHash
      );

      if (!isIntegrityValid) {
        await secureFileService.auditFileAccess(fileId, access.adminId, 'INTEGRITY_VIOLATION');
        return res.status(400).json({ error: 'File integrity check failed' });
      }

      // Get the actual file
      const fileBuffer = await secureFileService.getSecureFile(fileId, adminToken);
      if (!fileBuffer) {
        return res.status(404).json({ error: 'File data not accessible' });
      }

      // Update access tracking
      fileMetadata.adminAccess.accessCount += 1;
      fileMetadata.adminAccess.viewedBy = access.adminId;
      fileMetadata.adminAccess.viewedAt = new Date();

      // Audit the access
      await secureFileService.auditFileAccess(fileId, access.adminId, 'FILE_ACCESSED');

      // Set appropriate headers
      res.setHeader('Content-Type', fileMetadata.fileType);
      res.setHeader('Content-Length', fileMetadata.fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.originalName}"`);
      res.setHeader('X-File-Security-Validated', 'true');
      
      res.send(fileBuffer);

    } catch (error) {
      console.error('Admin file access error:', error);
      res.status(500).json({ error: 'Failed to access file' });
    }
  });

  // Admin endpoint to generate file access tokens
  app.post('/api/admin/file-access-token/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const adminId = req.body.adminId || 'admin'; // In production, get from session

      // Verify file exists
      const fileMetadata = fileMetadataStore.get(fileId);
      if (!fileMetadata) {
        return res.status(404).json({ error: 'File not found' });
      }

      const token = await secureFileService.generateAdminViewToken(fileId, adminId);
      
      res.json({
        token,
        fileInfo: {
          id: fileMetadata.id,
          originalName: fileMetadata.originalName,
          fileType: fileMetadata.fileType,
          fileSize: fileMetadata.fileSize,
          uploadedAt: fileMetadata.uploadedAt,
          rightId: fileMetadata.rightId
        }
      });

    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: 'Failed to generate access token' });
    }
  });

  // Endpoint to get file metadata for admin (without actual file content)
  app.get('/api/admin/file-metadata/:rightId', async (req, res) => {
    try {
      const rightId = parseInt(req.params.rightId);
      
      if (isNaN(rightId)) {
        return res.status(400).json({ error: 'Invalid right ID' });
      }

      // Get all files for this right
      const rightFiles = Array.from(fileMetadataStore.values())
        .filter(file => file.rightId === rightId);

      const fileList = rightFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        securityChecks: file.securityChecks,
        accessInfo: {
          viewedBy: file.adminAccess.viewedBy,
          viewedAt: file.adminAccess.viewedAt,
          accessCount: file.adminAccess.accessCount
        }
      }));

      res.json({
        rightId,
        files: fileList,
        totalFiles: fileList.length
      });

    } catch (error) {
      console.error('File metadata error:', error);
      res.status(500).json({ error: 'Failed to get file metadata' });
    }
  });
}