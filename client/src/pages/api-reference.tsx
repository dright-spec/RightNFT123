import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Code, Copy, ExternalLink, Shield, Zap, Book, Database, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  method: string;
  path: string;
  auth: string;
  description: string;
  requestBody?: any;
  response?: any;
  example?: string;
}

const authBadgeColors = {
  none: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  required: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
};

export default function ApiReferencePage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code example copied successfully",
    });
  };

  const endpoints: Record<string, ApiEndpoint[]> = {
    authentication: [
      {
        method: "POST",
        path: "/api/auth/wallet",
        auth: "none",
        description: "Connect with wallet address to authenticate user",
        requestBody: {
          walletAddress: "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
          walletType: "ethereum"
        },
        response: {
          success: true,
          data: {
            user: {
              id: 1,
              username: "crypto_user_123",
              walletAddress: "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
              displayName: "Crypto User"
            }
          },
          message: "Wallet connected successfully"
        },
        example: `import api from '@/lib/api-client';

const connectWallet = async () => {
  try {
    const result = await api.auth.connectWallet(
      "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
      "ethereum"
    );
    console.log("Connected user:", result.user);
  } catch (error) {
    console.error("Connection failed:", api.handleError(error));
  }
};`
      },
      {
        method: "POST",
        path: "/api/auth/login",
        auth: "none",
        description: "Login with email/username and password",
        requestBody: {
          identifier: "user@example.com",
          password: "securePassword123"
        },
        response: {
          success: true,
          data: {
            user: {
              id: 1,
              username: "john_creator",
              email: "user@example.com",
              displayName: "John Creator"
            }
          },
          message: "Login successful"
        },
        example: `const loginUser = async () => {
  try {
    const result = await api.auth.login("user@example.com", "password123");
    console.log("Logged in:", result.user);
  } catch (error) {
    console.error("Login failed:", api.handleError(error));
  }
};`
      },
      {
        method: "GET",
        path: "/api/auth/user",
        auth: "required",
        description: "Get current authenticated user information",
        response: {
          success: true,
          data: {
            id: 1,
            username: "john_creator",
            email: "user@example.com",
            walletAddress: "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
            displayName: "John Creator",
            bio: "Digital artist and content creator",
            createdAt: "2025-01-15T10:30:00Z"
          }
        },
        example: `const getCurrentUser = async () => {
  try {
    const user = await api.auth.getCurrentUser();
    console.log("Current user:", user);
  } catch (error) {
    console.error("Not authenticated:", api.handleError(error));
  }
};`
      }
    ],
    rights: [
      {
        method: "GET",
        path: "/api/rights",
        auth: "none",
        description: "Get all rights with filtering, searching, and pagination",
        response: {
          success: true,
          data: [
            {
              id: 1,
              title: "Sunset Photography Collection",
              type: "copyright",
              price: "2.50",
              currency: "ETH",
              description: "Beautiful sunset photographs from around the world",
              verificationStatus: "verified",
              creator: {
                username: "photo_artist",
                displayName: "Photo Artist"
              }
            }
          ],
          meta: {
            total: 150,
            page: 1,
            limit: 20,
            hasMore: true
          }
        },
        example: `// Get rights with filters
const getRights = async () => {
  try {
    const rights = await api.rights.getRights({
      page: 1,
      limit: 20,
      search: "photography",
      type: "copyright",
      sortBy: "createdAt",
      sortOrder: "desc"
    });
    console.log("Found", rights.meta.total, "rights");
    console.log("Rights:", rights.data);
  } catch (error) {
    console.error("Failed to fetch:", api.handleError(error));
  }
};`
      },
      {
        method: "POST",
        path: "/api/rights",
        auth: "required",
        description: "Create a new intellectual property right",
        requestBody: {
          title: "My Original Song",
          type: "copyright",
          categoryId: 2,
          description: "An original composition I created",
          price: "1.50",
          currency: "ETH",
          paysDividends: true,
          royaltyPercentage: "10.00",
          tags: ["music", "original", "indie"]
        },
        response: {
          success: true,
          data: {
            id: 42,
            title: "My Original Song",
            type: "copyright",
            price: "1.50",
            currency: "ETH",
            verificationStatus: "pending",
            ownerId: 1,
            createdAt: "2025-07-24T11:30:00Z"
          },
          message: "Right created successfully"
        },
        example: `const createRight = async () => {
  try {
    const newRight = await api.rights.createRight({
      title: "My Original Song",
      type: "copyright",
      categoryId: 2,
      description: "An original composition I created",
      price: "1.50",
      currency: "ETH",
      paysDividends: true,
      royaltyPercentage: "10.00",
      tags: ["music", "original", "indie"]
    });
    console.log("Created right:", newRight);
  } catch (error) {
    console.error("Creation failed:", api.handleError(error));
  }
};`
      },
      {
        method: "GET",
        path: "/api/rights/:id",
        auth: "none",
        description: "Get detailed information about a specific right",
        response: {
          success: true,
          data: {
            id: 1,
            title: "Sunset Photography Collection",
            type: "copyright",
            description: "Beautiful sunset photographs from around the world",
            price: "2.50",
            currency: "ETH",
            paysDividends: true,
            royaltyPercentage: "15.00",
            verificationStatus: "verified",
            tags: ["photography", "nature", "art"],
            creator: {
              id: 5,
              username: "photo_artist",
              displayName: "Photo Artist",
              profileImageUrl: "https://example.com/avatar.jpg"
            },
            createdAt: "2025-07-20T14:22:00Z"
          }
        },
        example: `const getRight = async (rightId) => {
  try {
    const right = await api.rights.getRight(rightId);
    console.log("Right details:", right);
    console.log("Creator:", right.creator.displayName);
  } catch (error) {
    console.error("Not found:", api.handleError(error));
  }
};`
      }
    ],
    staking: [
      {
        method: "GET",
        path: "/api/stakes/available-rights",
        auth: "required",
        description: "Get user's own verified rights available for staking",
        response: {
          success: true,
          data: [
            {
              id: 3,
              title: "Mobile App UI Design",
              type: "copyright",
              verificationStatus: "verified",
              price: "3.00",
              currency: "ETH"
            }
          ],
          message: "Available rights for staking retrieved successfully"
        },
        example: `const getAvailableRights = async () => {
  try {
    const rights = await api.staking.getAvailableRights();
    console.log("Can stake", rights.length, "rights");
    rights.forEach(right => {
      console.log("-", right.title, "worth", right.price, right.currency);
    });
  } catch (error) {
    console.error("Failed to fetch:", api.handleError(error));
  }
};`
      },
      {
        method: "POST",
        path: "/api/stakes",
        auth: "required",
        description: "Create a new stake with fixed platform terms (75% user, 15% platform fee)",
        requestBody: {
          rightId: 3,
          terms: "Professional revenue management for mobile app design rights",
          duration: "12"
        },
        response: {
          success: true,
          data: {
            id: 15,
            rightId: 3,
            stakerId: 1,
            status: "active",
            revenueSharePercentage: 75,
            managementFee: 15,
            terms: "Professional revenue management for mobile app design rights",
            duration: "12",
            startDate: "2025-07-24T11:30:00Z",
            endDate: "2026-07-24T11:30:00Z"
          },
          message: "Stake created successfully"
        },
        example: `const createStake = async () => {
  try {
    const stake = await api.staking.createStake({
      rightId: 3,
      terms: "Professional revenue management for mobile app design rights",
      duration: "12" // months
    });
    console.log("Stake created:", stake);
    console.log("You'll receive 75% of generated revenue");
  } catch (error) {
    console.error("Staking failed:", api.handleError(error));
  }
};`
      },
      {
        method: "GET",
        path: "/api/stakes/user",
        auth: "required",
        description: "Get current user's stakes with revenue information",
        response: {
          success: true,
          data: [
            {
              id: 15,
              status: "active",
              revenueSharePercentage: 75,
              totalRevenue: "0.45",
              stakerEarnings: "0.34",
              managementFee: 15,
              right: {
                id: 3,
                title: "Mobile App UI Design",
                type: "copyright"
              },
              startDate: "2025-07-24T11:30:00Z",
              revenueDistributions: []
            }
          ],
          message: "User stakes retrieved successfully"
        },
        example: `const getUserStakes = async () => {
  try {
    const stakes = await api.staking.getUserStakes();
    console.log("Active stakes:", stakes.length);
    stakes.forEach(stake => {
      console.log("-", stake.right.title);
      console.log("  Earnings:", stake.stakerEarnings, "ETH");
      console.log("  Status:", stake.status);
    });
  } catch (error) {
    console.error("Failed to fetch:", api.handleError(error));
  }
};`
      },
      {
        method: "GET",
        path: "/api/stakes/stats",
        auth: "required",
        description: "Get comprehensive staking statistics for the user",
        response: {
          success: true,
          data: {
            totalStakes: 3,
            activeStakes: 2,
            totalEarnings: 1.25,
            availableRights: 5,
            averageRevenuShare: 75,
            platformFee: 15
          },
          message: "Staking statistics retrieved successfully"
        },
        example: `const getStakingStats = async () => {
  try {
    const stats = await api.staking.getStakingStats();
    console.log("Staking Overview:");
    console.log("- Total earnings:", stats.totalEarnings, "ETH");
    console.log("- Active stakes:", stats.activeStakes);
    console.log("- Available to stake:", stats.availableRights, "rights");
  } catch (error) {
    console.error("Failed to get stats:", api.handleError(error));
  }
};`
      }
    ],
    admin: [
      {
        method: "GET",
        path: "/api/admin/stats",
        auth: "admin",
        description: "Get comprehensive platform statistics (admin only)",
        response: {
          success: true,
          data: {
            totalUsers: 245,
            totalRights: 1832,
            pendingVerifications: 23,
            verifiedRights: 1756,
            bannedUsers: 3,
            totalRevenue: "45.67",
            currency: "ETH",
            monthlyGrowth: 15.2
          },
          message: "Admin statistics retrieved successfully"
        },
        example: `const getAdminStats = async () => {
  try {
    const stats = await api.admin.getStats();
    console.log("Platform Stats:");
    console.log("- Users:", stats.totalUsers);
    console.log("- Rights:", stats.totalRights);
    console.log("- Pending verification:", stats.pendingVerifications);
    console.log("- Revenue:", stats.totalRevenue, stats.currency);
  } catch (error) {
    console.error("Access denied:", api.handleError(error));
  }
};`
      },
      {
        method: "PUT",
        path: "/api/admin/rights/:id/verify",
        auth: "admin",
        description: "Verify or reject a right submission",
        requestBody: {
          status: "verified",
          notes: "All ownership documents verified successfully"
        },
        response: {
          success: true,
          data: {
            id: 42,
            title: "My Original Song",
            verificationStatus: "verified",
            verifiedAt: "2025-07-24T11:35:00Z",
            verifiedBy: "admin",
            verificationNotes: "All ownership documents verified successfully"
          },
          message: "Right verified successfully"
        },
        example: `const verifyRight = async (rightId) => {
  try {
    const result = await api.admin.verifyRight(
      rightId, 
      "verified", 
      "All ownership documents verified successfully"
    );
    console.log("Right verified:", result.title);
  } catch (error) {
    console.error("Verification failed:", api.handleError(error));
  }
};`
      }
    ]
  };

  const renderRequestBody = (body: any) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Request Body:</h4>
      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-x-auto">
        <code>{JSON.stringify(body, null, 2)}</code>
      </pre>
    </div>
  );

  const renderResponse = (response: any) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Response:</h4>
      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-x-auto">
        <code>{JSON.stringify(response, null, 2)}</code>
      </pre>
    </div>
  );

  const renderExample = (example: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">TypeScript Example:</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(example)}
          className="h-6 px-2"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
        <code>{example}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                API Reference
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete guide to integrating with the Dright marketplace API
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Secure Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Session-based auth with wallet support</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">RESTful Design</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Consistent patterns and responses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Type-Safe Client</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Full TypeScript support included</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="authentication" orientation="vertical">
                  <TabsList className="grid w-full grid-cols-1 h-auto">
                    <TabsTrigger value="authentication" className="justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      Authentication
                    </TabsTrigger>
                    <TabsTrigger value="rights" className="justify-start">
                      <Book className="h-4 w-4 mr-2" />
                      Rights
                    </TabsTrigger>
                    <TabsTrigger value="staking" className="justify-start">
                      <Zap className="h-4 w-4 mr-2" />
                      Staking
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="authentication" orientation="vertical">
              {Object.entries(endpoints).map(([category, categoryEndpoints]) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 capitalize">{category} API</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {category === 'authentication' && "Manage user sessions and wallet connections"}
                      {category === 'rights' && "Create, read, update, and manage intellectual property rights"}
                      {category === 'staking' && "Stake rights for professional revenue management"}
                      {category === 'admin' && "Administrative functions for platform management"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {categoryEndpoints.map((endpoint, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant="outline" 
                                className={`font-mono ${
                                  endpoint.method === 'GET' ? 'border-green-500 text-green-700 dark:text-green-400' :
                                  endpoint.method === 'POST' ? 'border-blue-500 text-blue-700 dark:text-blue-400' :
                                  endpoint.method === 'PUT' ? 'border-orange-500 text-orange-700 dark:text-orange-400' :
                                  'border-red-500 text-red-700 dark:text-red-400'
                                }`}
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                            <Badge 
                              className={authBadgeColors[endpoint.auth as keyof typeof authBadgeColors]}
                              variant="secondary"
                            >
                              {endpoint.auth === 'none' ? 'Public' : 
                               endpoint.auth === 'required' ? 'Auth Required' : 'Admin Only'}
                            </Badge>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {endpoint.requestBody && renderRequestBody(endpoint.requestBody)}
                          {endpoint.response && renderResponse(endpoint.response)}
                          {endpoint.example && renderExample(endpoint.example)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Getting Started Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Install the Client Library</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm">
                    <code>import api from '@/lib/api-client';</code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Most endpoints require authentication. Connect with a wallet or login with credentials:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                    <code>{`// Wallet authentication
const user = await api.auth.connectWallet(walletAddress, "ethereum");

// Or traditional login
const user = await api.auth.login("user@example.com", "password");`}</code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Error Handling</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    All API calls should include proper error handling:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                    <code>{`try {
  const rights = await api.rights.getRights({ page: 1 });
  console.log("Success:", rights);
} catch (error) {
  const message = api.handleError(error);
  console.error("Error:", message);
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. Base URL</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    All API endpoints are relative to:
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm">
                    <code>
                      Development: http://localhost:5000/api<br/>
                      Production: https://your-domain.replit.app/api
                    </code>
                  </pre>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button asChild>
                    <a href="/docs" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Full Documentation
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a 
                      href="https://github.com/your-repo/dright-api-examples" 
                      className="flex items-center gap-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Code className="h-4 w-4" />
                      Code Examples
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}