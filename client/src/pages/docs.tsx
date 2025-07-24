import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  BookOpen,
  Code,
  Shield,
  Zap,
  FileText,
  ExternalLink,
  Download,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">
                D<span className="text-accent">right</span> Documentation
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete guide to creating, verifying, and trading legal rights as NFTs on the Dright platform
          </p>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="smart-contracts">Smart Contracts</TabsTrigger>
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription>
                  Get started with Dright in 5 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold">Connect Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your MetaMask or compatible wallet to start creating and trading rights
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold">Verify Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      Prove you own the rights using our YouTube verification system
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold">Create & Trade</h3>
                    <p className="text-sm text-muted-foreground">
                      Mint your rights as NFTs and list them on the marketplace
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">Supported Right Types</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Badge variant="secondary">📄 Copyright</Badge>
                    <Badge variant="secondary">💰 Royalty</Badge>
                    <Badge variant="secondary">🔐 Access</Badge>
                    <Badge variant="secondary">🏢 Ownership</Badge>
                    <Badge variant="secondary">📜 License</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Web3 Wallet</h4>
                    <p className="text-sm text-muted-foreground">MetaMask, WalletConnect, or compatible wallet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Legal Ownership</h4>
                    <p className="text-sm text-muted-foreground">Must actually own the rights you're tokenizing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Verification Method</h4>
                    <p className="text-sm text-muted-foreground">YouTube account access, verification code, or manual review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Ownership Verification Methods
                </CardTitle>
                <CardDescription>
                  Three ways to prove you own the content rights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="text-lg">Google OAuth</CardTitle>
                      <Badge variant="secondary" className="w-fit">Instant</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Login with your YouTube channel's Google account for immediate verification
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Instant verification</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Most secure method</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <CardTitle className="text-lg">Verification Code</CardTitle>
                      <Badge variant="secondary" className="w-fit">5-10 min</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Add a verification code to your video description
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Quick process</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>No login required</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-lg">Manual Review</CardTitle>
                      <Badge variant="secondary" className="w-fit">2-5 days</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Upload legal documents for manual verification by our team
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>For complex rights</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Legal document review</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-100">Important</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Creating rights for content you don't own is fraud and will result in account termination and legal action.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal */}
          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legal Framework
                </CardTitle>
                <CardDescription>
                  Understanding the legal aspects of digital rights trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Legal Ownership Tool Notice</h3>
                  <p className="text-amber-800 dark:text-amber-200 mb-4">
                    Dright is a legal ownership transfer platform, not a securities trading platform or investment product.
                  </p>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li>• Income streams are controlled directly by original right owners via payment protocols</li>
                    <li>• Platform acts as marketplace facilitator only, not dividend manager</li>
                    <li>• No promises of price appreciation or investment returns</li>
                    <li>• Rights trading involves legal ownership transfer, not financial speculation</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What You Can Tokenize</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Music streaming and performance rights</li>
                        <li>• Video content licensing rights</li>
                        <li>• Patent licensing agreements</li>
                        <li>• Real estate income rights</li>
                        <li>• Software licensing rights</li>
                        <li>• Trademark usage rights</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What You Cannot Tokenize</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Rights you don't legally own</li>
                        <li>• Copyrighted content without permission</li>
                        <li>• Securities or investment products</li>
                        <li>• Illegal or harmful content</li>
                        <li>• Rights under dispute</li>
                        <li>• Derivative works without original rights</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Streams & Income Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Original rights owners maintain direct control over income streams through decentralized payment protocols:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Superfluid Integration</h4>
                        <p className="text-sm text-muted-foreground">
                          Real-time streaming payments directly to NFT holders
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Smart Contract Automation</h4>
                        <p className="text-sm text-muted-foreground">
                          Automated distribution based on ownership percentages
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  API Reference
                </CardTitle>
                <CardDescription>
                  Integrate Dright functionality into your applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Base URL</h4>
                  <code className="text-sm bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                    https://api.dright.com/v1
                  </code>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    All API requests require wallet signature authentication
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm">
{`Authorization: Bearer <wallet_signature>
Content-Type: application/json`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Endpoints</h4>
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-green-600">GET</Badge>
                          <code className="text-sm">/rights</code>
                        </div>
                        <p className="text-sm text-muted-foreground">List all available rights</p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-blue-600">POST</Badge>
                          <code className="text-sm">/rights</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Create a new right</p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-orange-600">POST</Badge>
                          <code className="text-sm">/youtube/verify</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Verify YouTube ownership</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href="/api-reference" className="flex-1">
                    <Button className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Complete API Reference
                    </Button>
                  </Link>
                  <Button variant="outline" asChild>
                    <a href="https://github.com/dright/examples" target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Examples
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Contracts */}
          <TabsContent value="smart-contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Smart Contracts
                </CardTitle>
                <CardDescription>
                  Blockchain infrastructure powering Dright
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">DrightNFT Contract</CardTitle>
                      <Badge variant="secondary">ERC-721</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Main NFT contract for minting and managing digital rights
                      </p>
                      <div className="bg-muted/50 p-3 rounded text-xs">
                        <code>0x1234...5678</code>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Etherscan
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Marketplace Contract</CardTitle>
                      <Badge variant="secondary">Custom</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Handles trading, auctions, and marketplace operations
                      </p>
                      <div className="bg-muted/50 p-3 rounded text-xs">
                        <code>0xABCD...EFGH</code>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Etherscan
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Streaming</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Powered by Superfluid for real-time income distribution
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Network</span>
                        <span className="text-sm">Polygon</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Protocol</span>
                        <span className="text-sm">Superfluid</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm font-medium">Token</span>
                        <span className="text-sm">fUSDCx</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contract Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      All contracts are verified and audited for security
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download ABI
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Audit Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}