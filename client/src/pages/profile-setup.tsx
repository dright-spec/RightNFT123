import { useState } from "react";
import { useWalletUser } from "@/hooks/use-wallet-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Wallet, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function ProfileSetup() {
  const {
    walletAddress,
    createUser,
    isCreatingUser,
    navigateToProfile,
    isConnected
  } = useWalletUser();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    createUser({
      username: formData.username.trim(),
      email: formData.email.trim() || undefined,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to set up your profile.
            </p>
            <Link href="/marketplace">
              <Button>Go to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Dright!</h1>
          <p className="text-muted-foreground">
            Let's set up your profile to start creating and trading rights NFTs
          </p>
        </div>

        {/* Wallet Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This will be your unique identifier on the platform
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  We'll use this for important notifications (optional)
                </p>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex-1"
                >
                  {isCreatingUser ? (
                    "Creating Profile..."
                  ) : (
                    <>
                      Create Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to Marketplace
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">What's Next?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Complete your profile with additional details</p>
              <p>• Create your first rights NFT</p>
              <p>• Explore investment opportunities in the marketplace</p>
              <p>• Connect with other creators and investors</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}