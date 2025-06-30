import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Download, 
  Eye, 
  Image as ImageIcon, 
  FileAudio, 
  FileVideo,
  File,
  ExternalLink,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Grid3X3,
  Layers
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
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [quickViewMode, setQuickViewMode] = useState<'grid' | 'list'>('list');
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const contentSource = (right as any).contentSource || right.type;
    if (contentSource === 'patent') {
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
    } else if (contentSource === 'youtube_video') {
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
    } else if (contentSource === 'music_track') {
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

  // Enhanced media controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEnhancedPreview = (doc: DocumentFile) => {
    if (doc.type.startsWith('image/')) {
      return (
        <div className="space-y-4">
          {/* Image Controls */}
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                disabled={imageZoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{Math.round(imageZoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                disabled={imageZoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageRotation((imageRotation + 90) % 360)}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImageZoom(1);
                setImageRotation(0);
              }}
            >
              Reset
            </Button>
          </div>

          {/* Enhanced Image Viewer */}
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={doc.url} 
              alt={doc.name}
              className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200"
              style={{ 
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                cursor: imageZoom > 1 ? 'grab' : 'default'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxODBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyBjbGFzcz0idGV4dC1ncmF5LTQwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiPgo8dGV4dCB4PSIyMDAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIFByZXZpZXc8L3RleHQ+Cjwvc3ZnPgo=";
              }}
            />
          </div>
        </div>
      );
    }

    if (doc.type.startsWith('audio/')) {
      return (
        <div className="space-y-4">
          {/* Audio Controls */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-4 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-600" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (audioRef.current) audioRef.current.volume = newVolume;
                  }}
                  className="w-16"
                />
              </div>
            </div>
            <audio
              ref={audioRef}
              src={doc.url}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
          
          {/* Audio Waveform Placeholder */}
          <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileAudio className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Audio file ready for review</p>
            </div>
          </div>
        </div>
      );
    }

    if (doc.type === 'application/pdf') {
      return (
        <div className="space-y-4">
          {/* PDF Viewer with iframe */}
          <div className="w-full h-96 bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <iframe
              src={`${doc.url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full"
              title={doc.name}
              onError={() => {
                // Fallback for PDF viewing
                console.log('PDF iframe failed, showing fallback');
              }}
            />
          </div>
          
          {/* PDF Controls */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span className="font-medium">PDF Document</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.url, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${doc.url}#toolbar=0&navpanes=0&scrollbar=0`, '_blank')}
                className="flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Full Screen
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (doc.type.startsWith('video/')) {
      return (
        <div className="space-y-4">
          <video
            ref={videoRef}
            src={doc.url}
            controls
            className="w-full h-96 bg-black rounded-lg"
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FileVideo className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Video Content</span>
            </div>
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Submitted Documents ({documents.length})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickViewMode(quickViewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {quickViewMode === 'grid' ? <Layers className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              {quickViewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">All Documents</TabsTrigger>
            <TabsTrigger value="quick-preview">Quick Preview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Review all supporting documentation before making a verification decision:
            </div>
            
            {quickViewMode === 'grid' ? (
              /* Grid View for Quick Scanning */
              <div className="grid grid-cols-2 gap-4">
                {documents.map((doc, index) => (
                  <div key={index} className="bg-white rounded-lg border hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {getFileIcon(doc.type)}
                        <span className="font-medium text-sm truncate">{doc.name}</span>
                      </div>
                      
                      {/* Quick Preview */}
                      {doc.type.startsWith('image/') && (
                        <div className="mb-3 bg-gray-100 rounded aspect-video flex items-center justify-center overflow-hidden">
                          <img 
                            src={doc.url} 
                            alt={doc.name}
                            className="max-w-full max-h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDocument(doc)}
                                className="h-7 w-7 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getFileIcon(doc.type)}
                                  {doc.name}
                                  <Badge variant="outline" className="ml-2">
                                    {doc.size}
                                  </Badge>
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[75vh]">
                                {renderEnhancedPreview(doc)}
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View for Detailed Review */
              <div className="space-y-3">
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
                        <DialogContent className="max-w-5xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getFileIcon(doc.type)}
                              {doc.name}
                              <Badge variant="outline" className="ml-2">
                                {doc.size}
                              </Badge>
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[75vh]">
                            {renderEnhancedPreview(doc)}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="quick-preview" className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Quick preview mode shows all images in a gallery view for rapid assessment.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-3 gap-4">
              {documents.filter(doc => doc.type.startsWith('image/')).map((doc, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                      <img 
                        src={doc.url} 
                        alt={doc.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{doc.name}</DialogTitle>
                    </DialogHeader>
                    {renderEnhancedPreview(doc)}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Document Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Documents:</span>
                      <span className="font-medium">{documents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium">{documents.filter(d => d.type.startsWith('image/')).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PDFs:</span>
                      <span className="font-medium">{documents.filter(d => d.type === 'application/pdf').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audio Files:</span>
                      <span className="font-medium">{documents.filter(d => d.type.startsWith('audio/')).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Verified
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Request More Info
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}