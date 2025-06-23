import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Eye, 
  Image as ImageIcon, 
  FileAudio, 
  FileVideo,
  File,
  ExternalLink,
  Maximize2
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

interface AdminDocumentViewerProps {
  right: RightWithCreator;
}

interface DocumentFile {
  name: string;
  url: string;
  type: string;
  size: string;
  description: string;
}

export function AdminDocumentViewer({ right }: AdminDocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);

  // Mock document data based on the right's properties - in production this would come from the API
  const getDocuments = (): DocumentFile[] => {
    const documents: DocumentFile[] = [];

    // Add content file if it exists
    if (right.contentFileUrl) {
      documents.push({
        name: right.contentFileName || "Main Content File",
        url: right.contentFileUrl,
        type: right.contentFileType || "application/octet-stream",
        size: right.contentFileSize ? `${(right.contentFileSize / 1024 / 1024).toFixed(2)} MB` : "Unknown",
        description: "Primary content file submitted by user"
      });
    }

    // Add ownership documents if they exist
    if (right.ownershipDocumentUrl) {
      documents.push({
        name: "Ownership Documentation",
        url: right.ownershipDocumentUrl,
        type: "application/pdf",
        size: "2.4 MB",
        description: "Legal documentation proving ownership rights"
      });
    }

    // Generate example documents based on content source
    if (right.contentSource === 'patent') {
      documents.push(
        {
          name: "Patent Application.pdf",
          url: "/api/documents/patent-app.pdf",
          type: "application/pdf",
          size: "3.2 MB",
          description: "Official patent application documentation"
        },
        {
          name: "Prior Art Research.pdf",
          url: "/api/documents/prior-art.pdf",
          type: "application/pdf",
          size: "1.8 MB",
          description: "Research documentation showing novelty"
        },
        {
          name: "Technical Drawings.png",
          url: "/api/documents/drawings.png",
          type: "image/png",
          size: "5.4 MB",
          description: "Technical diagrams and illustrations"
        }
      );
    } else if (right.contentSource === 'youtube_video') {
      documents.push(
        {
          name: "Channel Ownership Proof.pdf",
          url: "/api/documents/channel-proof.pdf",
          type: "application/pdf",
          size: "892 KB",
          description: "YouTube channel ownership verification"
        },
        {
          name: "Video Thumbnail.jpg",
          url: "/api/documents/thumbnail.jpg",
          type: "image/jpeg",
          size: "245 KB",
          description: "Video thumbnail for identification"
        }
      );
    } else if (right.contentSource === 'music_track') {
      documents.push(
        {
          name: "Master Recording Agreement.pdf",
          url: "/api/documents/recording-agreement.pdf",
          type: "application/pdf",
          size: "1.6 MB",
          description: "Recording rights and ownership agreement"
        },
        {
          name: "Copyright Certificate.pdf",
          url: "/api/documents/copyright-cert.pdf",
          type: "application/pdf",
          size: "756 KB",
          description: "Official copyright registration"
        },
        {
          name: "Audio Sample.mp3",
          url: "/api/documents/sample.mp3",
          type: "audio/mpeg",
          size: "4.2 MB",
          description: "Audio sample for verification"
        }
      );
    }

    return documents;
  };

  const documents = getDocuments();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const canPreview = (type: string) => {
    return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('text/');
  };

  const renderPreview = (doc: DocumentFile) => {
    if (doc.type.startsWith('image/')) {
      return (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <img 
            src={doc.url} 
            alt={doc.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxODBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyBjbGFzcz0idGV4dC1ncmF5LTQwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiPgo8dGV4dCB4PSIyMDAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIFByZXZpZXc8L3RleHQ+Cjwvc3ZnPgo=";
            }}
          />
        </div>
      );
    }

    if (doc.type === 'application/pdf') {
      return (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">PDF Document</p>
            <p className="text-sm text-gray-500 mb-4">Click "Open in New Tab" to view the full document</p>
            <Button
              variant="outline"
              onClick={() => window.open(doc.url, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center border">
        <div className="text-center">
          <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Preview not available</p>
          <p className="text-sm text-gray-500">Download the file to view its contents</p>
        </div>
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Documents Submitted</h3>
          <p className="text-sm text-gray-500">
            No supporting documents were uploaded with this submission.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Submitted Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-4">
            Review all supporting documentation before making a verification decision:
          </div>
          
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                {getFileIcon(doc.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <span className="text-xs text-gray-500">{doc.size}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {canPreview(doc.type) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocument(doc)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getFileIcon(doc.type)}
                          {doc.name}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh]">
                        {renderPreview(doc)}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In production, this would trigger an actual download
                    window.open(doc.url, '_blank');
                  }}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-yellow-800 mb-1">Verification Guidelines</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Verify ownership documents match the submitted content</li>
                  <li>• Check for authenticity and legal validity</li>
                  <li>• Ensure all required documentation is present</li>
                  <li>• Look for any signs of fraud or misrepresentation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}