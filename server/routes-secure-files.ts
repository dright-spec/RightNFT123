import express from 'express';
import { secureFileHandler } from './secure-file-handler';
// Middleware for authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  req.user = req.session.user;
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || !req.session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  req.user = req.session.user;
  next();
};

const router = express.Router();

// File upload endpoint for users
router.post('/upload', requireAuth, (req, res, next) => {
  const upload = secureFileHandler.getMulterConfig().array('files', 10);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: `Upload failed: ${err.message}`
      });
    }

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const uploadedFiles = [];
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      for (const file of files) {
        try {
          const fileInfo = await secureFileHandler.processUpload(file, userId);
          uploadedFiles.push(fileInfo);
        } catch (fileError: any) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          // Continue with other files, but log the error
          uploadedFiles.push({
            originalName: file.originalname,
            error: fileError.message,
            failed: true
          });
        }
      }

      res.json({
        success: true,
        data: {
          uploadedFiles,
          totalFiles: files.length,
          successfulUploads: uploadedFiles.filter(f => !f.failed).length
        }
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during file upload'
      });
    }
  });
});

// Admin endpoints for secure file access
router.get('/admin/files', requireAdmin, async (req, res) => {
  try {
    const files = await secureFileHandler.listFilesForAdmin();
    
    res.json({
      success: true,
      data: files
    });
  } catch (error: any) {
    console.error('Error listing files for admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
});

// Secure file preview endpoint for admins
router.get('/admin/preview/:fileId', requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId || !/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    const preview = await secureFileHandler.generateSecurePreview(fileId);
    
    if (preview.error) {
      return res.status(404).json({
        success: false,
        error: preview.error
      });
    }

    res.json({
      success: true,
      data: preview
    });

  } catch (error: any) {
    console.error('Error generating file preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview'
    });
  }
});

// File verification endpoint for admins
router.post('/admin/verify/:fileId', requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { verified } = req.body;

    if (!fileId || !/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Verified status must be a boolean'
      });
    }

    const success = await secureFileHandler.markFileAsVerified(fileId, verified);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: {
        fileId,
        verified
      }
    });

  } catch (error: any) {
    console.error('Error verifying file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify file'
    });
  }
});

// Get file metadata (for admins)
router.get('/admin/file/:fileId', requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId || !/^[a-f0-9]{32}$/.test(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    const fileData = await secureFileHandler.getFileForAdmin(fileId);
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Return only metadata, not file content
    res.json({
      success: true,
      data: {
        ...fileData.fileInfo,
        contentSize: fileData.content.length
      }
    });

  } catch (error: any) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file information'
    });
  }
});

// Health check endpoint for file system
router.get('/health', async (req, res) => {
  try {
    const stats = {
      uploadDirectoryExists: true,
      filesCount: (await secureFileHandler.listFilesForAdmin()).length,
      maxFileSize: '50MB',
      allowedTypes: [
        'PDF', 'Images', 'Audio', 'Video', 'Text', 'Office Documents'
      ],
      securityFeatures: [
        'Virus scanning',
        'File type validation',
        'Content encryption',
        'Secure previews',
        'XSS protection'
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'File system health check failed'
    });
  }
});

export default router;