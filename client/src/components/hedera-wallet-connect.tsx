import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, LogOut, ExternalLink, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { hederaWalletManager, type HederaWalletConfig } from "@/lib/hedera-wallet-config"

export function HederaWalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState<HederaWalletConfig[]>([])
  const { toast } = useToast()

  useEffect(() => {
    initializeWallets()
  }, [])

  const initializeWallets = async () => {
    try {
      // Don't wait for initialization, just get wallets
      setAvailableWallets(hederaWalletManager.getAvailableWallets())
      setIsConnected(hederaWalletManager.isConnected)
      setConnectedAccount(hederaWalletManager.connectedAccount || null)
    } catch (error) {
      console.error('Failed to initialize wallets:', error)
    }
  }

  const handleWalletConnect = async (wallet: HederaWalletConfig) => {
    setIsConnecting(wallet.name)
    
    try {
      await wallet.connectMethod()
      setIsConnected(true)
      setConnectedAccount(hederaWalletManager.connectedAccount || null)
      setIsOpen(false)
      
      toast({
        title: "Wallet Connected!",
        description: `Successfully connected to ${wallet.name}`,
      })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      const errorMessage = error instanceof Error ? error.message : `Failed to connect to ${wallet.name}. Please try again.`
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      await hederaWalletManager.disconnect()
      setIsConnected(false)
      setConnectedAccount(null)
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      })
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  // Format Hedera account ID for display
  const formatAccountId = (accountId: string) => {
    if (accountId.startsWith('0.0.')) {
      const parts = accountId.split('.')
      return `${parts[0]}.${parts[1]}.${parts[2].slice(0, 4)}...${parts[2].slice(-4)}`
    }
    return accountId
  }

  if (isConnected && connectedAccount) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          {formatAccountId(connectedAccount)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
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
          Connect Hedera Wallet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Hedera Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Hedera wallet to access the marketplace
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {availableWallets.map((wallet) => {
            const isLoading = isConnecting === wallet.name
            
            return (
              <Card 
                key={wallet.name}
                className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50"
                onClick={() => handleWalletConnect(wallet)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{wallet.icon}</div>
                      <div>
                        <h3 className="font-medium">{wallet.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {wallet.description}
                        </p>
                      </div>
                    </div>
                    
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">New to Hedera wallets?</p>
              <p>HashPack is the most popular choice for Hedera users. It's free and easy to set up.</p>
              <p className="mt-1">
                <a 
                  href="https://www.hashpack.app/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Download HashPack →
                </a>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}