const { spawn } = require('child_process');
const { ethers } = require('ethers');

class LocalNetworkManager {
  constructor() {
    this.ganacheProcess = null;
    this.port = 8545;
    this.networkId = 1337;
    this.accounts = [];
  }

  async startLocalNetwork() {
    console.log("🌐 Starting local Ethereum network...");
    
    return new Promise((resolve, reject) => {
      // Start Ganache with predefined accounts
      this.ganacheProcess = spawn('npx', [
        'ganache-cli',
        '--port', this.port.toString(),
        '--networkId', this.networkId.toString(),
        '--accounts', '10',
        '--defaultBalanceEther', '10000',
        '--gasLimit', '10000000',
        '--gasPrice', '20000000000',
        '--quiet'
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      this.ganacheProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
        
        // Check if network is ready
        if (output.includes('Listening on')) {
          console.log("✅ Local network started successfully!");
          resolve();
        }
      });

      this.ganacheProcess.stderr.on('data', (data) => {
        console.error(`Ganache error: ${data}`);
      });

      this.ganacheProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ganache exited with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Timeout starting local network'));
      }, 30000);
    });
  }

  async stopLocalNetwork() {
    if (this.ganacheProcess) {
      console.log("🛑 Stopping local network...");
      this.ganacheProcess.kill();
      this.ganacheProcess = null;
      console.log("✅ Local network stopped");
    }
  }

  async getProvider() {
    return new ethers.providers.JsonRpcProvider(`http://localhost:${this.port}`);
  }

  async getAccounts() {
    const provider = await this.getProvider();
    const accounts = [];
    
    for (let i = 0; i < 10; i++) {
      const wallet = new ethers.Wallet(
        '0x' + (i + 1).toString().padStart(64, '0'), // Simple private keys for testing
        provider
      );
      accounts.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        wallet: wallet
      });
    }
    
    return accounts;
  }

  async deployContracts() {
    console.log("📦 Deploying contracts to local network...");
    
    const provider = await this.getProvider();
    const [deployer] = await this.getAccounts();
    
    // Deploy contracts using the deployer wallet
    const { execSync } = require('child_process');
    
    try {
      const result = execSync('npx hardhat run scripts/deploy-testnet.js --network localhost', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(result);
      console.log("✅ Contracts deployed to local network!");
      
      return this.parseDeploymentOutput(result);
    } catch (error) {
      console.error("❌ Contract deployment failed:", error.message);
      throw error;
    }
  }

  parseDeploymentOutput(output) {
    const lines = output.split('\n');
    const contracts = {};
    
    for (const line of lines) {
      if (line.includes('deployed to:')) {
        const parts = line.split('deployed to:');
        if (parts.length === 2) {
          const contractName = parts[0].trim().replace('✅ ', '');
          const address = parts[1].trim();
          contracts[contractName] = address;
        }
      }
    }
    
    return contracts;
  }

  async testContractInteraction(contractAddresses) {
    console.log("🧪 Testing contract interactions...");
    
    const provider = await this.getProvider();
    const [deployer, user1, user2] = await this.getAccounts();
    
    // Test basic contract calls
    try {
      // Simple balance check
      const balance = await provider.getBalance(deployer.address);
      console.log(`✅ Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);
      
      // Test transaction
      const tx = await deployer.wallet.sendTransaction({
        to: user1.address,
        value: ethers.utils.parseEther("1.0")
      });
      
      await tx.wait();
      console.log(`✅ Test transaction successful: ${tx.hash}`);
      
      return true;
    } catch (error) {
      console.error("❌ Contract interaction test failed:", error.message);
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const networkManager = new LocalNetworkManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      networkManager.startLocalNetwork()
        .then(() => {
          console.log("🎉 Local network is ready for testing!");
          console.log(`📍 RPC URL: http://localhost:${networkManager.port}`);
          console.log(`🆔 Network ID: ${networkManager.networkId}`);
        })
        .catch(console.error);
      break;
      
    case 'deploy':
      networkManager.deployContracts()
        .then(contracts => {
          console.log("🎉 Deployment completed!");
          console.log("📋 Contract addresses:", contracts);
        })
        .catch(console.error);
      break;
      
    case 'test':
      networkManager.testContractInteraction()
        .then(success => {
          console.log(success ? "🎉 Tests passed!" : "❌ Tests failed!");
        })
        .catch(console.error);
      break;
      
    case 'full':
      (async () => {
        try {
          await networkManager.startLocalNetwork();
          const contracts = await networkManager.deployContracts();
          const testsPassed = await networkManager.testContractInteraction(contracts);
          
          console.log("\n" + "=".repeat(50));
          console.log("🎉 FULL LOCAL TESTNET SETUP COMPLETE!");
          console.log("=".repeat(50));
          console.log("📍 Network: http://localhost:8545");
          console.log("🆔 Chain ID: 1337");
          console.log("📋 Contracts:", contracts);
          console.log("🧪 Tests:", testsPassed ? "PASSED" : "FAILED");
          console.log("=".repeat(50));
          
        } catch (error) {
          console.error("❌ Setup failed:", error);
          process.exit(1);
        }
      })();
      break;
      
    default:
      console.log("Usage: node scripts/local-network.js [start|deploy|test|full]");
      console.log("  start  - Start local Ganache network");
      console.log("  deploy - Deploy contracts to local network");
      console.log("  test   - Test contract interactions");
      console.log("  full   - Complete setup (start + deploy + test)");
  }
}

module.exports = LocalNetworkManager;