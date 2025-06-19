import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function Web3ModalConnectButton() {
  const { address, isConnected, connector } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowModal(false)
    toast({
      title: "Connecting...",
      description: `Connecting to ${connector.name}`,
    })
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
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the Hedera marketplace. MetaMask and other browser wallets work perfectly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleConnect(connector)}
              disabled={isPending}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="text-2xl">
                  {connector.name === 'MetaMask' ? '🦊' : 
                   connector.name === 'Injected' ? '💼' : '💳'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{connector.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {connector.name === 'MetaMask' ? 'Most popular wallet for Ethereum and DeFi' : 
                     connector.name === 'Injected' ? 'Use browser wallet extension' : 'Connect wallet'}
                  </p>
                </div>
              </div>
            </Button>
          ))}
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded">
            <p className="font-medium mb-1">Don't have a wallet?</p>
            <p>Install MetaMask from metamask.io to get started with Web3</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}