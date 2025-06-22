import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function Web3ModalConnectButton() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
    <Button 
      onClick={() => open()}
      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  )
}