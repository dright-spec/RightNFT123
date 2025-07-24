import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmojiErrorDisplay, CompactEmojiError, FloatingEmojiError } from "@/components/emoji-error-display";
import { useEmojiErrorHandler, useWalletErrorHandler, useNFTErrorHandler, useUploadErrorHandler } from "@/hooks/use-emoji-error-handler";
import { translateError } from "@/lib/emoji-error-translator";
import { Bug, Zap, AlertTriangle, Info } from "lucide-react";

const sampleErrors = [
  "User rejected the request",
  "MetaMask wallet not installed",
  "Network error: Connection refused",
  "Insufficient funds for transaction",
  "Gas limit exceeded",
  "Transaction failed - reverted",
  "File too large - maximum size is 10MB",
  "Invalid file type - only JPG, PNG allowed",
  "Upload failed - network timeout",
  "Email is required field",
  "Invalid email address format",
  "Password too weak - use 8+ characters",
  "Database connection timeout",
  "Duplicate entry - username already exists",
  "Not the owner of this NFT",
  "NFT already listed for sale",
  "Price must be greater than 0.001 ETH",
  "Rate limit exceeded - too many requests",
  "Internal server error - 500",
  "Request timeout - server took too long",
  "IPFS pinning failed - storage error",
  "YouTube video not found",
  "Ownership verification failed",
  "Unauthorized access - login required",
  "Access denied - insufficient permissions"
];

export default function ErrorDemo() {
  const [customError, setCustomError] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [demoError, setDemoError] = useState<string | null>(null);
  const [floatingError, setFloatingError] = useState<string | null>(null);
  
  const walletErrorHandler = useWalletErrorHandler();
  const nftErrorHandler = useNFTErrorHandler();
  const uploadErrorHandler = useUploadErrorHandler();
  const generalErrorHandler = useEmojiErrorHandler({ context: selectedContext });

  const triggerSampleError = (error: string) => {
    setDemoError(error);
  };

  const triggerFloatingError = (error: string) => {
    setFloatingError(error);
    setTimeout(() => setFloatingError(null), 5000); // Auto-dismiss after 5 seconds
  };

  const simulateWalletError = () => {
    walletErrorHandler.handleError("User rejected the request");
  };

  const simulateNFTError = () => {
    nftErrorHandler.handleError("Not the owner of this NFT");
  };

  const simulateUploadError = () => {
    uploadErrorHandler.handleError("File too large - maximum size is 10MB");
  };

  const translateCustomError = () => {
    if (!customError.trim()) return;
    const translated = translateError(customError);
    setDemoError(customError);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 Emoji Error Translator Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Transform confusing technical errors into friendly, emoji-powered messages that users actually understand!
          </p>
        </div>

        {/* Sample Errors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Error Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Error Gallery
              </CardTitle>
              <CardDescription>
                Click any error to see it translated with emojis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {sampleErrors.map((error, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto p-3 whitespace-normal"
                    onClick={() => triggerSampleError(error)}
                  >
                    <code className="text-xs text-red-600 dark:text-red-400">
                      {error.length > 50 ? error.slice(0, 50) + '...' : error}
                    </code>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Translated Error
              </CardTitle>
              <CardDescription>
                See how technical errors become user-friendly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demoError ? (
                <EmojiErrorDisplay
                  error={demoError}
                  context={selectedContext}
                  onRetry={() => console.log('Retry clicked')}
                  onDismiss={() => setDemoError(null)}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click an error from the gallery to see the translation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Custom Error Tester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Custom Error Tester
            </CardTitle>
            <CardDescription>
              Test the translator with your own error messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="error-input">Error Message</Label>
                <Textarea
                  id="error-input"
                  placeholder="Enter any error message to translate..."
                  value={customError}
                  onChange={(e) => setCustomError(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="context-select">Context (Optional)</Label>
                <Select value={selectedContext} onValueChange={setSelectedContext}>
                  <SelectTrigger id="context-select">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Context</SelectItem>
                    <SelectItem value="wallet">Wallet Operations</SelectItem>
                    <SelectItem value="nft">NFT Operations</SelectItem>
                    <SelectItem value="upload">File Upload</SelectItem>
                    <SelectItem value="api">API Requests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={translateCustomError} disabled={!customError.trim()}>
              🔄 Translate Error
            </Button>
          </CardContent>
        </Card>

        {/* Error Handler Demos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🦊 Wallet Errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateWalletError} className="w-full">
                Trigger Wallet Error
              </Button>
              {walletErrorHandler.error && (
                <CompactEmojiError 
                  error={walletErrorHandler.error.message}
                  context="wallet"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 NFT Errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateNFTError} className="w-full">
                Trigger NFT Error
              </Button>
              {nftErrorHandler.error && (
                <CompactEmojiError 
                  error={nftErrorHandler.error.message}
                  context="nft"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📁 Upload Errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateUploadError} className="w-full">
                Trigger Upload Error
              </Button>
              {uploadErrorHandler.error && (
                <CompactEmojiError 
                  error={uploadErrorHandler.error.message}
                  context="upload"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Floating Error Demo */}
        <Card>
          <CardHeader>
            <CardTitle>🎈 Floating Error Demo</CardTitle>
            <CardDescription>
              Test floating notifications (appears in top-right corner)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={() => triggerFloatingError("Network connection lost")}
              >
                Network Error
              </Button>
              <Button 
                variant="outline" 
                onClick={() => triggerFloatingError("Transaction failed - insufficient gas")}
              >
                Gas Error
              </Button>
              <Button 
                variant="outline" 
                onClick={() => triggerFloatingError("File upload failed - server timeout")}
              >
                Upload Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <h4 className="font-semibold">Emoji-Powered</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Every error gets a contextual emoji for instant recognition
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h4 className="font-semibold">Smart Translation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Converts technical jargon into plain English
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-semibold">Context Aware</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Different messages for wallet, NFT, upload contexts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h4 className="font-semibold">Auto Retry</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart retry logic with exponential backoff
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎈</span>
                <div>
                  <h4 className="font-semibold">Multiple Displays</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toast notifications, floating alerts, inline errors
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-semibold">Easy Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drop-in replacement for existing error handling
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Error */}
      <FloatingEmojiError
        error={floatingError}
        onDismiss={() => setFloatingError(null)}
      />
    </div>
  );
}