import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Web3ModalButton() {
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()
  const { toast } = useToast()
  const [hederaAccount, setHederaAccount] = useState<string | null>(null)

  // Check for stored Hedera account
  useEffect(() => {
    const stored = localStorage.getItem('hedera_wallet_connection')
    if (stored) {
      try {
        const connection = JSON.parse(stored)
        setHederaAccount(connection.accountId)
      } catch (error) {
        console.log("Invalid stored Hedera connection")
      }
    }
  }, [])

  const copyAddress = () => {
    const addressToCopy = hederaAccount || address
    if (addressToCopy) {
      navigator.clipboard.writeText(addressToCopy)
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (hederaAccount) {
      window.open(`https://hashscan.io/testnet/account/${hederaAccount}`, '_blank')
    } else if (address) {
      window.open(`https://etherscan.io/address/${address}`, '_blank')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setHederaAccount(null)
    localStorage.removeItem('hedera_wallet_connection')
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    })
  }

  const connectHederaManually = () => {
    const accountId = prompt("Enter your Hedera Account ID (format: 0.0.123456):")
    if (accountId && /^0\.0\.\d+$/.test(accountId)) {
      const connection = {
        name: "Manual Entry",
        accountId,
        network: "testnet"
      }
      setHederaAccount(accountId)
      localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection))
      toast({
        title: "Hedera Account Connected",
        description: `Account: ${accountId}`,
      })
    } else if (accountId) {
      toast({
        title: "Invalid Format",
        description: "Please enter a valid Hedera account ID (e.g., 0.0.123456)",
        variant: "destructive",
      })
    }
  }

  // Display connected wallet info
  if (isConnected || hederaAccount) {
    const displayName = hederaAccount ? "Hedera Account" : (connector?.name || 'Wallet')
    const displayAddress = hederaAccount || address || ''
    const shortAddress = hederaAccount 
      ? hederaAccount.slice(0, 8) + '...'
      : `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">{displayName}</span>
            <span className="text-xs font-mono">{shortAddress}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={copyAddress}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Choose Wallet</p>
          <DropdownMenuItem
            onClick={() => open()}
            className="cursor-pointer mb-2"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">W3</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">WalletConnect</p>
                <p className="text-xs text-muted-foreground">300+ wallets supported</p>
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={connectHederaManually}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Hedera Account</p>
                <p className="text-xs text-muted-foreground">Manual account entry</p>
              </div>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}