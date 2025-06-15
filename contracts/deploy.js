const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Dright Rights NFT Contract...");

  // Get the contract factory
  const DrightRightsNFT = await ethers.getContractFactory("DrightRightsNFT");

  // Deploy the contract
  const contract = await DrightRightsNFT.deploy(
    "Dright Rights NFT", // name
    "DRIGHT", // symbol
    "0x1234567890123456789012345678901234567890" // platform fee recipient (replace with actual address)
  );

  await contract.deployed();

  console.log("DrightRightsNFT deployed to:", contract.address);
  console.log("Transaction hash:", contract.deployTransaction.hash);

  // Wait for a few confirmations
  await contract.deployTransaction.wait(5);

  console.log("Contract deployment confirmed!");
  
  // Verify contract if on a public network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: [
          "Dright Rights NFT",
          "DRIGHT",
          "0x1234567890123456789012345678901234567890"
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  return contract.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });