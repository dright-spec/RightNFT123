import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, Copy, ExternalLink, Settings } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useAppKit } from '@reown/appkit/react'
import { useToast } from '@/hooks/use-toast'
import { HashPackConnector } from '@/components/HashPackConnector'

export function WalletButton() {
  const { 
    isConnected, 
    address, 
    balance, 
    networkName, 
    isHedera, 
    disconnect, 
    switchToHedera 
  } = useWallet()
  
  const { open } = useAppKit()
  const { toast } = useToast()
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast({
        title: 'Address copied!',
        description: 'Wallet address copied to clipboard',
      })
    }
  }
  
  const openExplorer = () => {
    if (!address) return
    
    const explorerUrl = isHedera 
      ? `https://hashscan.io/${networkName.includes('Testnet') ? 'testnet' : 'mainnet'}/account/${address}`
      : `https://etherscan.io/address/${address}`
    
    window.open(explorerUrl, '_blank')
  }
  
  const handleSwitchToHedera = async () => {
    try {
      await switchToHedera()
      toast({
        title: 'Network switched!',
        description: 'Successfully switched to Hedera network',
      })
    } catch (error) {
      toast({
        title: 'Network switch failed',
        description: 'Please try switching networks in your wallet',
        variant: 'destructive',
      })
    }
  }
  
  const handleHashPackConnect = (accountId: string) => {
    console.log('HashPack connected with account:', accountId)
    // The connection will be handled by the HashPack extension
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <HashPackConnector onConnect={handleHashPackConnect} />
          <Button 
            onClick={() => open()} 
            variant="outline"
            className="gap-2"
          >
            <Wallet className="w-4 h-4" />
            Other Wallets
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Connect HashPack (recommended) or use WalletConnect for mobile
        </p>
      </div>
    )
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[140px]">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-mono text-sm">
            {formatAddress(address!)}
          </span>
          <Badge 
            variant={isHedera ? "default" : "secondary"}
            className={`ml-1 ${isHedera ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
          >
            {isHedera ? 'ℏ' : 'ETH'}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(address!)}
              </p>
            </div>
            <Badge variant={isHedera ? "default" : "secondary"}>
              {networkName}
            </Badge>
          </div>
          
          {balance && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">{balance}</p>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyAddress} className="gap-2">
          <Copy className="w-4 h-4" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openExplorer} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          View on Explorer
        </DropdownMenuItem>
        
        {!isHedera && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchToHedera} className="gap-2">
              <Settings className="w-4 h-4" />
              Switch to Hedera
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => open({ view: 'Account' })} 
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Wallet Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={disconnect} 
          className="gap-2 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}