import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Hash, Coins, Clock, User } from "lucide-react";

interface HederaTransaction {
  transactionId: string;
  tokenId: string;
  serialNumber: number;
  type: string;
  timestamp: string;
  rightTitle: string;
  explorerUrl: string;
}

export default function HederaExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/hedera/transactions", filter],
    retry: false
  });

  const filteredTransactions = (transactions || []).filter((tx: HederaTransaction) =>
    searchQuery === "" || 
    tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.tokenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.rightTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Hash className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Hedera Explorer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track all NFT minting transactions and blockchain activity for Dright rights marketplace
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by transaction ID, token ID, or right title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === "minted" ? "default" : "outline"}
                  onClick={() => setFilter("minted")}
                  size="sm"
                >
                  Minted
                </Button>
                <Button
                  variant={filter === "transferred" ? "default" : "outline"}
                  onClick={() => setFilter("transferred")}
                  size="sm"
                >
                  Transferred
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No transactions match your search criteria." : "No Hedera transactions recorded yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTransactions.map((tx: HederaTransaction) => (
              <Card key={tx.transactionId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Coins className="h-3 w-3 mr-1" />
                          {tx.type}
                        </Badge>
                        <h3 className="font-semibold text-lg">{tx.rightTitle}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Transaction ID
                          </p>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                            {tx.transactionId}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            Token Details
                          </p>
                          <p className="font-mono text-xs">
                            {tx.tokenId} #{tx.serialNumber}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Timestamp
                          </p>
                          <p className="text-xs">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(tx.explorerUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on HashScan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Network Status */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold">Hedera Testnet Status</span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All NFT minting operations are recorded on Hedera testnet. 
              View full transaction details on HashScan explorer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}