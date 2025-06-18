import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Web3ModalWallet() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [showConnectors, setShowConnectors] = useState(false)

  // Convert Ethereum address to Hedera format for display
  const formatHederaAccount = (address: string) => {
    if (address.startsWith('0x')) {
      // Convert hex to decimal for Hedera-like display
      const num = parseInt(address.slice(-8), 16)
      return `0.0.${num.toString().slice(-6)}`
    }
    return address
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (address) {
      // For Hedera, open HashScan
      if (connector?.name?.toLowerCase().includes('hash') || connector?.name?.toLowerCase().includes('blade')) {
        window.open(`https://hashscan.io/testnet/account/${formatHederaAccount(address)}`, '_blank')
      } else {
        // For Ethereum wallets
        window.open(`https://etherscan.io/address/${address}`, '_blank')
      }
    }
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowConnectors(false)
    
    toast({
      title: "Connecting...",
      description: `Connecting to ${connector.name}`,
    })
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    })
  }

  // Check for Hedera wallets specifically
  const hederaConnectors = connectors.filter(connector => 
    connector.name?.toLowerCase().includes('hash') || 
    connector.name?.toLowerCase().includes('blade') ||
    connector.id === 'hashpack' ||
    connector.id === 'blade'
  )

  const otherConnectors = connectors.filter(connector => 
    !hederaConnectors.includes(connector)
  )

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="hidden sm:inline">{connector?.name || 'Wallet'}</span>
          <span className="text-xs font-mono">
            {connector?.name?.toLowerCase().includes('hash') || connector?.name?.toLowerCase().includes('blade')
              ? formatHederaAccount(address)
              : `${address.slice(0, 6)}...${address.slice(-4)}`
            }
          </span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAddress}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openExplorer}
          className="h-8 w-8 p-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="h-8 w-8 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => setShowConnectors(true)}
        className="flex items-center gap-2"
        disabled={isPending}
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {showConnectors && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectors(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Hedera Wallets */}
              {hederaConnectors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground">Hedera Wallets</h4>
                  <div className="space-y-2">
                    {hederaConnectors.map((connector) => (
                      <Button
                        key={connector.uid}
                        variant="outline"
                        className="w-full justify-start p-4 h-auto"
                        onClick={() => handleConnect(connector)}
                        disabled={isPending}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="text-2xl">
                            {connector.name?.toLowerCase().includes('hash') ? '🔗' : '⚔️'}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{connector.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {connector.name?.toLowerCase().includes('hash') 
                                ? 'Most popular Hedera wallet'
                                : 'Multi-chain wallet with DeFi'
                              }
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Wallets */}
              {otherConnectors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground">Other Wallets</h4>
                  <div className="space-y-2">
                    {otherConnectors.map((connector) => (
                      <Button
                        key={connector.uid}
                        variant="outline"
                        className="w-full justify-start p-4 h-auto"
                        onClick={() => handleConnect(connector)}
                        disabled={isPending}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="text-2xl">
                            {connector.name === 'MetaMask' ? '🦊' : '💼'}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{connector.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {connector.name === 'MetaMask' 
                                ? 'Popular Ethereum wallet'
                                : 'Connect via WalletConnect'
                              }
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Installation Links */}
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Don't have a Hedera wallet?</p>
                <div className="flex gap-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={() => window.open('https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk', '_blank')}
                  >
                    Install HashPack
                  </Button>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={() => window.open('https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd', '_blank')}
                  >
                    Install Blade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}