import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Smartphone, Download, QrCode, Bug } from 'lucide-react'
import { hashPackWallet } from '@/lib/hashpack-wallet'
import { useToast } from '@/hooks/use-toast'
import { debugBrowserWallets, checkHashPackExtension } from '@/lib/browser-debug'
import { BrowserDebugPanel } from '@/components/BrowserDebugPanel'

interface HashPackConnectorProps {
  onConnect: (accountId: string) => void
}

export function HashPackConnector({ onConnect }: HashPackConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Debug what's available in the browser
    const walletDebug = debugBrowserWallets()
    const hashPackDebug = checkHashPackExtension()
    
    setDebugInfo({
      wallets: walletDebug,
      hashpack: hashPackDebug
    })
    
    console.log('Browser wallet debug:', walletDebug)
    console.log('HashPack extension debug:', hashPackDebug)
  }, [])

  const handleExtensionConnect = async () => {
    setIsConnecting(true)
    try {
      const connected = await hashPackWallet.connect()
      if (connected) {
        const accountId = hashPackWallet.getPrimaryAccount()
        if (accountId) {
          onConnect(accountId)
          toast({
            title: 'HashPack Connected!',
            description: `Connected with account ${accountId}`,
          })
        }
      } else {
        toast({
          title: 'HashPack Extension Not Found',
          description: 'Please install the HashPack browser extension or use mobile QR code',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to HashPack wallet',
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleMobileConnect = () => {
    setShowQR(true)
    toast({
      title: 'Mobile Connection',
      description: 'Use WalletConnect option in the main wallet modal for mobile HashPack',
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Wallet className="h-4 w-4" />
          Connect HashPack
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect HashPack Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Browser Extension Option */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Browser Extension</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with HashPack browser extension
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleExtensionConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect Extension'}
              </Button>
            </CardContent>
          </Card>

          {/* Mobile App Option */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Mobile App</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan QR code with HashPack mobile app
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleMobileConnect}
                variant="outline"
                className="w-full gap-2"
              >
                <QrCode className="h-4 w-4" />
                Show QR Code
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Don't have HashPack?{' '}
              <a 
                href="https://www.hashpack.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Download here
              </a>
            </p>
          </div>

          {/* Debug Panel */}
          <BrowserDebugPanel />
        </div>
      </DialogContent>
    </Dialog>
  )
}