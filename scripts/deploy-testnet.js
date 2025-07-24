const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Dright NFT Testnet Deployment...\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await deployer.getBalance();
  console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH\n`);

  // Deploy DrightNFT contract
  console.log("📦 Deploying DrightNFT contract...");
  const DrightNFT = await ethers.getContractFactory("DrightNFT");
  
  // Use deployer as platform wallet for testnet
  const platformWallet = deployer.address;
  
  const drightNFT = await DrightNFT.deploy(platformWallet);
  await drightNFT.deployed();
  
  console.log(`✅ DrightNFT deployed to: ${drightNFT.address}`);
  console.log(`🔗 Transaction: ${drightNFT.deployTransaction.hash}\n`);

  // Deploy DrightRightsNFT contract
  console.log("📦 Deploying DrightRightsNFT contract...");
  const DrightRightsNFT = await ethers.getContractFactory("DrightRightsNFT");
  
  const drightRightsNFT = await DrightRightsNFT.deploy(
    "Dright Rights NFT",
    "DRIGHT",
    platformWallet
  );
  await drightRightsNFT.deployed();
  
  console.log(`✅ DrightRightsNFT deployed to: ${drightRightsNFT.address}`);
  console.log(`🔗 Transaction: ${drightRightsNFT.deployTransaction.hash}\n`);

  // Wait for confirmations
  console.log("⏳ Waiting for confirmations...");
  await drightNFT.deployTransaction.wait(3);
  await drightRightsNFT.deployTransaction.wait(3);
  console.log("✅ Contracts confirmed!\n");

  // Setup initial configuration
  console.log("⚙️ Setting up initial configuration...");
  
  // Verify deployer as creator on DrightNFT
  await drightNFT.verifyCreator(deployer.address, true);
  console.log("✅ Deployer verified as creator on DrightNFT");
  
  // Add deployer as authorized verifier on DrightRightsNFT
  await drightRightsNFT.addAuthorizedVerifier(deployer.address);
  console.log("✅ Deployer added as authorized verifier on DrightRightsNFT\n");

  // Test minting functionality
  console.log("🧪 Testing NFT minting...");
  
  try {
    // Test mint on DrightNFT
    const mintTx1 = await drightNFT.mintRight(
      "Test Copyright #1",
      "copyright",
      "QmTestHash12345",
      "ipfs://QmTestMetadata12345",
      ethers.utils.parseEther("0.1"),
      true, // paysDividends
      1500, // 15% distribution
      [deployer.address],
      [10000] // 100% share
    );
    const receipt1 = await mintTx1.wait();
    const tokenId1 = receipt1.events?.find(e => e.event === 'RightMinted')?.args?.tokenId;
    console.log(`✅ DrightNFT test mint successful - Token ID: ${tokenId1}`);

    // Verify the minted right
    await drightNFT.verifyRight(tokenId1, true);
    console.log(`✅ Test right verified`);

    // Test mint on DrightRightsNFT
    const mintTx2 = await drightRightsNFT.createRight(
      deployer.address,
      "ipfs://QmTestMetadata67890",
      {
        title: "Test Rights NFT #1",
        description: "Test description for rights NFT",
        rightType: 0, // COPYRIGHT
        creator: deployer.address,
        currentOwner: deployer.address,
        verificationStatus: 0, // PENDING
        paysDividends: true,
        royaltyPercentage: 1000, // 10%
        creationTime: 0,
        verificationTime: 0,
        tags: ["test", "copyright"],
        externalUrl: "https://example.com",
        legalDocumentHash: "QmLegalDoc123"
      },
      500 // 5% royalty
    );
    const receipt2 = await mintTx2.wait();
    const tokenId2 = receipt2.events?.find(e => e.event === 'RightCreated')?.args?.tokenId;
    console.log(`✅ DrightRightsNFT test mint successful - Token ID: ${tokenId2}`);

    // Verify the rights NFT
    await drightRightsNFT.verifyRight(tokenId2, 1); // VERIFIED
    console.log(`✅ Test rights NFT verified\n`);

  } catch (error) {
    console.log(`❌ Test minting failed: ${error.message}\n`);
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      DrightNFT: {
        address: drightNFT.address,
        transaction: drightNFT.deployTransaction.hash
      },
      DrightRightsNFT: {
        address: drightRightsNFT.address,
        transaction: drightRightsNFT.deployTransaction.hash
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log("📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${deploymentInfo.network} (${deploymentInfo.chainId})`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`DrightNFT: ${deploymentInfo.contracts.DrightNFT.address}`);
  console.log(`DrightRightsNFT: ${deploymentInfo.contracts.DrightRightsNFT.address}`);
  console.log(`Deployed at: ${deploymentInfo.timestamp}`);
  console.log("=".repeat(50));

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    `deployments/${network.name}-${network.chainId}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`✅ Deployment info saved to deployments/${network.name}-${network.chainId}.json\n`);

  return deploymentInfo;
}

main()
  .then(() => {
    console.log("🎉 Testnet deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });