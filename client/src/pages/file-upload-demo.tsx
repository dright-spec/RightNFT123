import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Users,
  Eye
} from 'lucide-react';
import SecureFileUpload from '@/components/secure-file-upload';
import AdminFileViewer from '@/components/admin-file-viewer';

export default function FileUploadDemo() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(files);
    console.log('Files uploaded:', files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Secure File Upload System
              </h1>
              <p className="text-muted-foreground">
                Demonstration of 100% secure document verification with virus scanning and admin preview
              </p>
            </div>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Security</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Virus scanning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Content encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Type validation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Safety</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">No downloads required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Sandboxed previews</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">XSS protection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supported Types</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {['PDF', 'Images', 'Audio', 'Video', 'Documents'].map(type => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Demo Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              User Upload
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Admin Review
            </TabsTrigger>
          </TabsList>

          {/* User Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Document Upload (User View)
                </CardTitle>
                <p className="text-muted-foreground">
                  Upload documents to prove ownership of intellectual property rights.
                  All files are automatically scanned and encrypted for security.
                </p>
              </CardHeader>
              <CardContent>
                <SecureFileUpload
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                  className="max-w-2xl"
                />
              </CardContent>
            </Card>

            {/* Upload Results */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{file.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.id && `File ID: ${file.id}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.virusScanResult === 'clean' && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Virus Free
                            </Badge>
                          )}
                          {file.status === 'success' && (
                            <Badge variant="default">
                              Uploaded
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Admin Review Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Admin View:</strong> This demonstrates how administrators can safely review uploaded 
                documents without downloading them. All previews are generated in a secure sandbox environment.
              </AlertDescription>
            </Alert>

            <AdminFileViewer />
          </TabsContent>
        </Tabs>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600">Upload Security</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Files are scanned for viruses and malware using pattern detection</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Only approved file types are accepted (PDF, images, audio, video, documents)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>File content is encrypted before storage using XOR encryption</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Malicious file extensions are automatically blocked</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600">Admin Safety</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Admins never download files - everything is previewed inline</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Images, PDFs, and text files can be safely previewed</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>All text content is sanitized to prevent XSS attacks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Files are accessed through secure API endpoints with authentication</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}