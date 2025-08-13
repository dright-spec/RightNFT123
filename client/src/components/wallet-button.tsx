import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { MultiWalletModal } from "@/components/multi-wallet-modal";
import { Wallet, User, Settings, LogOut, BarChart3, Plus, ArrowRight } from "lucide-react";

export function WalletButton(props: any) {
  const {
    walletType,
    networkType,
    walletAddress,
    hederaAccountId,
    isConnecting,
    isAuthenticated,
    user,
    disconnectWallet,
  } = useMultiWallet();
  
  const [location, setLocation] = useLocation();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Get display address based on wallet type  
  const displayAddress = walletType === 'walletconnect' ? hederaAccountId : walletAddress;

  const formatDisplayAddress = (address: string | null) => {
    if (!address) return '';
    // Handle Hedera account format (0.0.12345)
    if (address.includes('.')) {
      return address;
    }
    // Handle Ethereum address format
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkBadge = () => {
    if (networkType === 'hedera') {
      return (
        <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">
          Hedera
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
        Ethereum
      </Badge>
    );
  };

  if (isConnecting) {
    return (
      <Button variant="outline" disabled {...props}>
        <Wallet className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <MultiWalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
      
      {isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" {...props}>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="hidden sm:inline">{user.username}</span>
              <Wallet className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-sm">{formatDisplayAddress(displayAddress)}</p>
              <p className="text-sm font-medium mt-1">@{user?.username || 'User'}</p>
              {getNetworkBadge()}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/my-rights" className="cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-2" />
                My Rights
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/create-right" className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Right
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="default" onClick={() => setShowWalletModal(true)} {...props}>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      )}
    </>
  );
}