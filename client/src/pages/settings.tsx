import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Wallet,
  Globe,
  Moon,
  Sun,
  Save,
  Upload,
  Link as LinkIcon,
  Mail,
  AlertCircle
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { HashPackDebugComponent } from "@/components/hashpack-debug-component";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery<UserType>({
    queryKey: ["/api/users", "profile"],
    queryFn: () => fetch("/api/users/1").then(res => res.json()),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      return apiRequest("PATCH", "/api/users/1", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      bio: formData.get("bio") as string,
      website: formData.get("website") as string,
      twitter: formData.get("twitter") as string,
      instagram: formData.get("instagram") as string,
    };
    updateProfileMutation.mutate(updates);
  };

  const notificationSettings = [
    { id: "new_bids", label: "New Bids", description: "Get notified when someone bids on your rights" },
    { id: "sale_completed", label: "Sales Completed", description: "Notification when your rights are sold" },
    { id: "verification_updates", label: "Verification Updates", description: "Updates on ownership verification status" },
    { id: "marketplace_updates", label: "Marketplace Updates", description: "New features and platform updates" },
    { id: "price_alerts", label: "Price Alerts", description: "Alert when similar rights are listed at different prices" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                <h1 className="text-xl font-bold">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information and social links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        defaultValue={userProfile?.username || ""}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={userProfile?.email || ""}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Contact support to change email</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself and your creative work..."
                      defaultValue={userProfile?.bio || ""}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="website"
                            name="website"
                            placeholder="https://yourwebsite.com"
                            defaultValue={userProfile?.website || ""}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-muted-foreground">@</span>
                          <Input
                            id="twitter"
                            name="twitter"
                            placeholder="username"
                            defaultValue={userProfile?.twitter || ""}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm text-muted-foreground">@</span>
                        <Input
                          id="instagram"
                          name="instagram"
                          placeholder="username"
                          defaultValue={userProfile?.instagram || ""}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Verification</CardTitle>
                <CardDescription>
                  Verify your profile to build trust with other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">Verify your email address</p>
                    </div>
                  </div>
                  <Badge variant={userProfile?.email ? "default" : "secondary"}>
                    {userProfile?.email ? "Verified" : "Pending"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Identity Verification</h4>
                      <p className="text-sm text-muted-foreground">Verify your identity for higher limits</p>
                    </div>
                  </div>
                  <Badge variant={userProfile?.isVerified ? "default" : "secondary"}>
                    {userProfile?.isVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={setting.id} className="font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch id={setting.id} defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Frequency</CardTitle>
                <CardDescription>
                  How often do you want to receive email notifications?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="realtime" name="frequency" value="realtime" defaultChecked />
                    <Label htmlFor="realtime">Real-time (immediate)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="daily" name="frequency" value="daily" />
                    <Label htmlFor="daily">Daily digest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="weekly" name="frequency" value="weekly" />
                    <Label htmlFor="weekly">Weekly summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="never" name="frequency" value="never" />
                    <Label htmlFor="never">Never</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>
                  Manage your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-profile" className="font-medium">
                      Public Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to view your profile and rights
                    </p>
                  </div>
                  <Switch id="public-profile" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-earnings" className="font-medium">
                      Show Earnings
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your total earnings on your profile
                    </p>
                  </div>
                  <Switch id="show-earnings" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics" className="font-medium">
                      Analytics Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the platform with anonymous usage data
                    </p>
                  </div>
                  <Switch id="analytics" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing" className="font-medium">
                      Marketing Communications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch id="marketing" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export or delete your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">Download all your data</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 dark:border-red-800">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-300">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Settings */}
          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Wallet</CardTitle>
                <CardDescription>
                  Manage your connected wallet and payment preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">MetaMask</h4>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.walletAddress 
                          ? `${userProfile.walletAddress.slice(0, 6)}...${userProfile.walletAddress.slice(-4)}`
                          : "Not connected"
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-accept" className="font-medium">
                          Auto-accept Payments
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically accept streaming payments
                        </p>
                      </div>
                      <Switch id="auto-accept" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min-payment">Minimum Payment Threshold</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="min-payment"
                          type="number"
                          placeholder="0.01"
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  View your recent transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your transaction history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* HashPack Debug Component */}
            <HashPackDebugComponent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}