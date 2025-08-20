import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Bug, ChevronDown, ChevronRight } from 'lucide-react'
import { debugBrowserWallets } from '@/lib/browser-debug'

export function BrowserDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const info = debugBrowserWallets()
    setDebugInfo(info)
    console.log('Full browser debug:', info)
  }, [])

  if (!debugInfo) return null

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-yellow-100 transition-colors">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="h-4 w-4" />
              Browser Debug Info
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Hash/Pack Related Objects:</h4>
              {debugInfo.hashPackRelated?.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.hashPackRelated.map((key: string) => (
                    <Badge key={key} variant="outline">{key}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None found</p>
              )}
            </div>

            {debugInfo.deepScan && Object.keys(debugInfo.deepScan).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Deep Scan Results:</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(debugInfo.deepScan).map(([key, info]: [string, any]) => (
                    <div key={key} className="p-2 bg-white rounded border">
                      <div className="font-medium">{key}</div>
                      <div className="text-xs text-muted-foreground">
                        Type: {info.type}
                        {info.keys && info.keys.length > 0 && (
                          <div>Keys: {info.keys.join(', ')}</div>
                        )}
                        {info.methods && info.methods.length > 0 && (
                          <div>Methods: {info.methods.join(', ')}</div>
                        )}
                        {info.hasConnect && <Badge variant="secondary" className="ml-1">Has Connect</Badge>}
                        {info.hasInit && <Badge variant="secondary" className="ml-1">Has Init</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Available Wallets:</h4>
              {debugInfo.available?.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.available.map((wallet: any, index: number) => (
                    <div key={index} className="p-2 bg-white rounded border text-sm">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Methods: {wallet.methods.slice(0, 5).join(', ')}
                        {wallet.methods.length > 5 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No wallet objects detected</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Total window keys: {debugInfo.allWindowKeys}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}