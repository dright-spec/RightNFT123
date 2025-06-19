import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function Web3ModalConnectButton() {
  const { address, isConnected, connector } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const handleConnect = () => {
    // Web3Modal handles the connection via its built-in modal
    if (typeof window !== 'undefined' && (window as any).web3Modal) {
      (window as any).web3Modal.open()
    }
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (address) {
      if (connector?.name?.toLowerCase().includes('hedera') || connector?.id === 'hedera') {
        // For Hedera wallets, format address properly
        const hederaAccount = address.startsWith('0x') 
          ? `0.0.${parseInt(address.slice(-8), 16)}` 
          : address
        window.open(`https://hashscan.io/testnet/account/${hederaAccount}`, '_blank')
      } else {
        // For Ethereum wallets
        window.open(`https://etherscan.io/address/${address}`, '_blank')
      }
    }
  }

  const formatAddress = (address: string) => {
    if (connector?.name?.toLowerCase().includes('hedera') || connector?.id === 'hedera') {
      // Format as Hedera account ID
      return address.startsWith('0x') 
        ? `0.0.${parseInt(address.slice(-8), 16)}` 
        : address
    }
    // Format as Ethereum address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="font-mono text-sm">
              {ensName || formatAddress(address)}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="font-medium">{connector?.name || 'Connected'}</span>
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              {formatAddress(address)}
            </div>
          </div>
          
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => disconnect()} 
            className="cursor-pointer text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button onClick={handleConnect} className="flex items-center gap-2">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  )
}