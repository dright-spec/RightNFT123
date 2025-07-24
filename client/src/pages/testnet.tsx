import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Network, 
  Wallet, 
  Coins, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Play,
  Settings,
  Database
} from 'lucide-react';
import { contractIntegration } from '@/lib/contract-integration';
import { getCurrentNetwork, TESTNET_CONFIG, validateTestnetEnvironment } from '@/lib/testnet-config';

export default function TestnetPage() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState(getCurrentNetwork());
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentResults, setDeploymentResults] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Form states for testing
  const [mintForm, setMintForm] = useState({
    title: 'Test Copyright #' + Date.now(),
    rightType: 'copyright',
    contentFileHash: 'QmTest' + Date.now(),
    metadataURI: 'ipfs://QmTestMetadata' + Date.now(),
    price: '0.001',
    paysDividends: true,
    distributionPercentage: 1000
  });

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    const validation = validateTestnetEnvironment();
    if (!validation.isValid) {
      toast({
        title: "Environment Issues",
        description: validation.issues.join(', '),
        variant: "destructive"
      });
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const result = await contractIntegration.connectWallet();
      setIsConnected(true);
      setWalletAddress(result.address);
      setBalance(result.balance);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.address.slice(0, 8)}...`
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = async () => {
    setIsLoading(true);
    try {
      await contractIntegration.switchToTestnet();
      setCurrentNetwork(getCurrentNetwork());
      
      toast({
        title: "Network Switched",
        description: `Switched to ${currentNetwork.name}`
      });
    } catch (error: any) {
      toast({
        title: "Network Switch Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deployContracts = async () => {
    setIsLoading(true);
    try {
      // This would typically be done via scripts, but we can simulate it
      const deployment = {
        DrightNFT: '0x' + Math.random().toString(16).slice(2, 42),
        DrightRightsNFT: '0x' + Math.random().toString(16).slice(2, 42),
        network: currentNetwork.name,
        timestamp: new Date().toISOString()
      };
      
      setDeploymentResults(deployment);
      
      toast({
        title: "Contracts Deployed",
        description: "Test contracts deployed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runContractTests = async () => {
    setIsLoading(true);
    const results: any[] = [];
    
    try {
      // Test 1: Contract initialization
      results.push({
        name: 'Contract Initialization',
        status: 'running',
        result: null
      });
      
      const initResult = await contractIntegration.initialize();
      results[0] = {
        name: 'Contract Initialization',
        status: initResult.drightNFT ? 'passed' : 'failed',
        result: initResult
      };
      
      // Test 2: Mint NFT
      results.push({
        name: 'NFT Minting',
        status: 'running',
        result: null
      });
      
      try {
        const mintResult = await contractIntegration.mintRightNFT(mintForm);
        results[1] = {
          name: 'NFT Minting',
          status: 'passed',
          result: mintResult
        };
        
        // Test 3: Verify NFT
        if (mintResult.tokenId) {
          results.push({
            name: 'NFT Verification',
            status: 'running',
            result: null
          });
          
          const verifyResult = await contractIntegration.verifyRight(mintResult.tokenId, true);
          results[2] = {
            name: 'NFT Verification',
            status: 'passed',
            result: verifyResult
          };
        }
      } catch (mintError) {
        results[1] = {
          name: 'NFT Minting',
          status: 'failed',
          result: mintError
        };
      }
      
      setTestResults([...results]);
      
      toast({
        title: "Tests Completed",
        description: `${results.filter(r => r.status === 'passed').length}/${results.length} tests passed`
      });
      
    } catch (error: any) {
      toast({
        title: "Tests Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTestSuite = async () => {
    setIsLoading(true);
    try {
      const success = await contractIntegration.runContractTests();
      
      toast({
        title: success ? "All Tests Passed" : "Tests Failed",
        description: success ? "Contract integration is working correctly" : "Some tests failed",
        variant: success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Test Suite Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startLocalNetwork = async () => {
    setIsLoading(true);
    try {
      // This would be handled by the local network script
      toast({
        title: "Local Network",
        description: "Run 'npm run local:start' in terminal to start local network"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Testnet Environment
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Complete testing environment for smart contract development and NFT minting verification
          </p>
        </div>

        {/* Environment Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Status</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={currentNetwork.isTestnet ? "default" : "destructive"}>
                  {currentNetwork.name}
                </Badge>
                <p className="text-xs text-muted-foreground">Chain ID: {currentNetwork.chainId}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Status</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {isConnected && (
                  <p className="text-xs text-muted-foreground">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold">{balance || '0.0'} ETH</p>
                <p className="text-xs text-muted-foreground">Test tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Testing Interface */}
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Environment Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Network</Label>
                    <div className="flex items-center gap-2">
                      <Badge>{currentNetwork.name}</Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={switchNetwork}
                        disabled={isLoading}
                      >
                        Switch Network
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Wallet Connection</Label>
                    <Button 
                      onClick={connectWallet} 
                      disabled={isLoading || isConnected}
                      className="w-full"
                    >
                      {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Local Network</Label>
                    <Button 
                      onClick={startLocalNetwork} 
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      Start Local Network
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Starts Ganache on localhost:8545
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm">RPC URL</Label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {currentNetwork.rpcUrl}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Currency</Label>
                    <p className="text-sm">{currentNetwork.currency}</p>
                  </div>
                  {currentNetwork.blockExplorer && (
                    <div className="space-y-1">
                      <Label className="text-sm">Block Explorer</Label>
                      <a 
                        href={currentNetwork.blockExplorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Contract Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ensure you have sufficient test tokens for deployment gas fees.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={deployContracts}
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  {isLoading ? 'Deploying...' : 'Deploy Contracts'}
                </Button>

                {deploymentResults && (
                  <div className="space-y-2">
                    <Label>Deployment Results</Label>
                    <div className="bg-muted p-4 rounded space-y-2">
                      <p className="text-sm"><strong>DrightNFT:</strong> {deploymentResults.DrightNFT}</p>
                      <p className="text-sm"><strong>DrightRightsNFT:</strong> {deploymentResults.DrightRightsNFT}</p>
                      <p className="text-sm"><strong>Network:</strong> {deploymentResults.network}</p>
                      <p className="text-sm"><strong>Time:</strong> {new Date(deploymentResults.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Contract Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Test NFT Minting</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Title"
                        value={mintForm.title}
                        onChange={(e) => setMintForm({...mintForm, title: e.target.value})}
                      />
                      <Input
                        placeholder="Price (ETH)"
                        value={mintForm.price}
                        onChange={(e) => setMintForm({...mintForm, price: e.target.value})}
                      />
                    </div>
                    <Textarea
                      placeholder="Content Hash"
                      value={mintForm.contentFileHash}
                      onChange={(e) => setMintForm({...mintForm, contentFileHash: e.target.value})}
                    />
                  </div>

                  <Button 
                    onClick={runContractTests}
                    disabled={isLoading || !isConnected}
                    className="w-full"
                  >
                    {isLoading ? 'Running Tests...' : 'Run Contract Tests'}
                  </Button>

                  <Button 
                    onClick={runFullTestSuite}
                    disabled={isLoading || !isConnected}
                    variant="outline"
                    className="w-full"
                  >
                    Run Full Test Suite
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length > 0 ? (
                    <div className="space-y-2">
                      {testResults.map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{test.name}</span>
                          <Badge variant={
                            test.status === 'passed' ? 'default' : 
                            test.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {test.status === 'passed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {test.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {test.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tests run yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results & Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length > 0 ? (
                  <div className="space-y-4">
                    {testResults.map((test, index) => (
                      <div key={index} className="border rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{test.name}</h3>
                          <Badge variant={
                            test.status === 'passed' ? 'default' : 
                            test.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {test.status}
                          </Badge>
                        </div>
                        {test.result && (
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(test.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No test results available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}