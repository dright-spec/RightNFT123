import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, LogOut, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SimpleWalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const { address, isConnected, connector } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
    setIsOpen(false)
    toast({
      title: "Connecting...",
      description: `Connecting to ${connector.name}`,
    })
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          {formatAddress(address)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to Dright
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {connectors.map((connector) => (
            <Card 
              key={connector.id}
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
              onClick={() => handleConnect(connector)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {connector.name === 'MetaMask' && '🦊'}
                      {connector.name === 'Injected' && '🌐'}
                      {(!['MetaMask', 'Injected'].includes(connector.name)) && '💳'}
                    </div>
                    <div>
                      <h3 className="font-medium">{connector.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {connector.name === 'MetaMask' && 'Popular browser extension wallet'}
                        {connector.name === 'Injected' && 'Browser wallet extension'}
                        {(!['MetaMask', 'Injected'].includes(connector.name)) && 'Crypto wallet'}
                      </p>
                    </div>
                  </div>
                  
                  {isPending && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">New to wallets?</p>
              <p>We recommend MetaMask for beginners. It's free and easy to set up.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}