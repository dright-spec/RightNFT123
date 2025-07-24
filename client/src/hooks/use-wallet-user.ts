import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface WalletUserState {
  user: User | null;
  isLoading: boolean;
  walletAddress: string | null;
  isConnected: boolean;
  needsProfileSetup: boolean;
}

export function useWalletUser() {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    // Check for wallet_connection first (used by Web3ModalConnectButton)
    const walletConnection = localStorage.getItem('wallet_connection');
    if (walletConnection) {
      try {
        const parsed = JSON.parse(walletConnection);
        if (parsed.address && parsed.isConnected) {
          return parsed.address;
        }
      } catch (error) {
        console.error('Error parsing wallet connection:', error);
      }
    }
    // Fallback to wallet_address
    return localStorage.getItem('wallet_address');
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      // First check for stored wallet connection (from Web3ModalConnectButton)
      const walletConnection = localStorage.getItem('wallet_connection');
      if (walletConnection) {
        try {
          const parsed = JSON.parse(walletConnection);
          const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          if (parsed.address && parsed.isConnected && isRecent) {
            setWalletAddress(parsed.address);
            return; // Exit early if we found a valid stored connection
          } else {
            // Clear expired connection
            localStorage.removeItem('wallet_connection');
          }
        } catch (error) {
          console.error('Error parsing wallet connection:', error);
          localStorage.removeItem('wallet_connection');
        }
      }

      // Fallback to checking ethereum provider
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);
            localStorage.setItem('wallet_address', address);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Wallet disconnected
          setWalletAddress(null);
          localStorage.removeItem('wallet_address');
          queryClient.setQueryData(['wallet-auth'], null);
        } else {
          // Account changed
          const address = accounts[0];
          setWalletAddress(address);
          localStorage.setItem('wallet_address', address);
          queryClient.invalidateQueries({ queryKey: ['wallet-auth'] });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [queryClient]);

  // Authenticate wallet and fetch user data
  const { data: authData, isLoading } = useQuery<{ user: User | null; hasProfile: boolean } | null>({
    queryKey: ['wallet-auth', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      
      try {
        // Authenticate wallet with backend to establish session
        const authResponse = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            walletType: 'ethereum', 
            address: walletAddress 
          }),
          credentials: 'include', // Important for session cookies
        });
        
        if (!authResponse.ok) {
          throw new Error('Wallet authentication failed');
        }
        
        const authResult = await authResponse.json();
        return {
          user: authResult.user,
          hasProfile: authResult.hasProfile
        };
      } catch (error) {
        console.error('Error authenticating wallet:', error);
        return null;
      }
    },
    enabled: !!walletAddress,
  });

  const user = authData?.user || null;

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; email?: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          walletAddress,
          password: 'wallet-auth', // Placeholder for wallet-based auth
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(['wallet-user', walletAddress], newUser);
      toast({
        title: "Profile Created",
        description: "Your profile has been set up successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Profile Creation Failed",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user?.id) throw new Error('No user to update');
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['wallet-user', walletAddress], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return false;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem('wallet_address', address);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
        
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      return false;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_connection'); // Also clear Web3Modal connection
    queryClient.setQueryData(['wallet-auth'], null);
    queryClient.setQueryData(['wallet-user'], null);
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    });
  };

  // Navigate to profile setup
  const navigateToProfileSetup = () => {
    setLocation('/profile-setup');
  };

  // Navigate to profile
  const navigateToProfile = () => {
    setLocation('/profile');
  };

  const needsProfileSetup = walletAddress && authData && !authData.hasProfile && !isLoading;
  const isConnected = !!walletAddress;

  return {
    user,
    isLoading,
    walletAddress,
    isConnected,
    needsProfileSetup,
    connectWallet,
    disconnectWallet,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    navigateToProfileSetup,
    navigateToProfile,
  };
}