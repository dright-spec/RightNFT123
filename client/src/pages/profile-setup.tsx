import { useWallet } from "@/contexts/WalletContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Mail, Shield, CheckCircle, ArrowRight, Wallet } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || "",
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const setupProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest("POST", "/api/profile-setup", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been successfully created!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-user"] });
      setLocation("/marketplace");
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive",
      });
    },
  });

  const sendEmailVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("/api/send-email-verification", "POST", { email });
    },
    onSuccess: () => {
      setEmailVerificationSent(true);
      toast({
        title: "Verification Email Sent",
        description: "Check your email for the verification link",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Could not send verification email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setupProfileMutation.mutate(data);
  };

  const handleSendEmailVerification = () => {
    const email = form.getValues("email");
    if (email) {
      sendEmailVerificationMutation.mutate(email);
    }
  };

  const formatDisplayAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Set up your account to start trading digital rights</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wallet className="w-3 h-3 mr-1" />
                Wallet Connected
              </Badge>
              <span className="text-sm text-gray-500 font-mono">
                {formatDisplayAddress(walletAddress || '')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a unique username" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be your public display name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium">Email Authentication (Optional)</h3>
                    <Badge variant="secondary" className="text-xs">
                      Enhancement
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Add email as a backup login method. You can always sign in with your wallet.
                  </p>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Add email for account recovery and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("email") && !emailVerificationSent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendEmailVerification}
                      disabled={sendEmailVerificationMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Send Verification Email
                    </Button>
                  )}

                  {emailVerificationSent && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Verification email sent! Check your inbox and follow the link to verify your email.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={setupProfileMutation.isPending}
                    className="flex-1"
                  >
                    {setupProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem('profile_setup_skipped', 'true');
                      setLocation("/marketplace");
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Skip for Now
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Your wallet connection is secure and encrypted. We never store your private keys.
          </p>
        </div>
      </div>
    </div>
  );
}