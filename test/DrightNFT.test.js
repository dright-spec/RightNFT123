const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DrightNFT Contract Tests", function () {
  let DrightNFT;
  let contract;
  let owner;
  let creator;
  let buyer;
  let platformWallet;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, creator, buyer, platformWallet, ...addrs] = await ethers.getSigners();

    // Deploy contract
    DrightNFT = await ethers.getContractFactory("DrightNFT");
    contract = await DrightNFT.deploy(platformWallet.address);
    await contract.deployed();

    // Verify creator to allow minting
    await contract.verifyCreator(creator.address, true);
  });

  describe("Deployment", function () {
    it("Should set the right platform wallet", async function () {
      expect(await contract.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await contract.platformFeePercentage()).to.equal(250); // 2.5%
    });
  });

  describe("Right Minting", function () {
    it("Should mint a right successfully", async function () {
      const title = "Test Copyright";
      const rightType = "copyright";
      const contentHash = "QmTestHash123";
      const metadataURI = "ipfs://QmMetadataHash123";
      const price = ethers.utils.parseEther("1.0");
      const stakeholders = [creator.address];
      const shares = [10000]; // 100%

      const tx = await contract.connect(creator).mintRight(
        title,
        rightType,
        contentHash,
        metadataURI,
        price,
        true, // paysDividends
        1500, // 15% distribution
        stakeholders,
        shares
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'RightMinted');
      expect(event.args.creator).to.equal(creator.address);
      expect(event.args.contentHash).to.equal(contentHash);
    });

    it("Should prevent non-verified creators from minting", async function () {
      await expect(
        contract.connect(buyer).mintRight(
          "Test", "copyright", "hash", "uri", 1000, false, 0, [buyer.address], [10000]
        )
      ).to.be.revertedWith("Only verified creators");
    });

    it("Should prevent duplicate content hashes", async function () {
      const contentHash = "QmDuplicateHash";
      const stakeholders = [creator.address];
      const shares = [10000];

      // First mint should succeed
      await contract.connect(creator).mintRight(
        "First", "copyright", contentHash, "uri1", 1000, false, 0, stakeholders, shares
      );

      // Second mint with same hash should fail
      await expect(
        contract.connect(creator).mintRight(
          "Second", "copyright", contentHash, "uri2", 1000, false, 0, stakeholders, shares
        )
      ).to.be.revertedWith("Content hash already used");
    });
  });

  describe("Right Verification", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await contract.connect(creator).mintRight(
        "Test Right", "copyright", "hash123", "uri123", 1000, false, 0, [creator.address], [10000]
      );
      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'RightMinted').args.tokenId;
    });

    it("Should allow owner to verify rights", async function () {
      await contract.verifyRight(tokenId, true);
      const rightDetails = await contract.getRightDetails(tokenId);
      expect(rightDetails.isVerified).to.be.true;
    });

    it("Should prevent non-owners from verifying", async function () {
      await expect(
        contract.connect(creator).verifyRight(tokenId, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Marketplace Functions", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint and verify a right
      const tx = await contract.connect(creator).mintRight(
        "Market Test", "copyright", "market123", "uri123", 
        ethers.utils.parseEther("1.0"), false, 0, [creator.address], [10000]
      );
      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'RightMinted').args.tokenId;
      
      // Verify the right
      await contract.verifyRight(tokenId, true);
    });

    it("Should list a right for sale", async function () {
      const price = ethers.utils.parseEther("2.0");
      await contract.connect(creator).listRight(tokenId, price);
      
      const rightDetails = await contract.getRightDetails(tokenId);
      expect(rightDetails.isListed).to.be.true;
      expect(rightDetails.price).to.equal(price);
    });

    it("Should purchase a listed right", async function () {
      const price = ethers.utils.parseEther("1.0");
      await contract.connect(creator).listRight(tokenId, price);

      const initialCreatorBalance = await creator.getBalance();
      const initialPlatformBalance = await platformWallet.getBalance();

      await contract.connect(buyer).buyRight(tokenId, { value: price });

      // Check ownership transfer
      expect(await contract.ownerOf(tokenId)).to.equal(buyer.address);
      
      // Check right is no longer listed
      const rightDetails = await contract.getRightDetails(tokenId);
      expect(rightDetails.isListed).to.be.false;
      expect(rightDetails.currentOwner).to.equal(buyer.address);
    });

    it("Should handle platform fees correctly", async function () {
      const price = ethers.utils.parseEther("1.0");
      await contract.connect(creator).listRight(tokenId, price);

      const initialPlatformBalance = await platformWallet.getBalance();
      
      await contract.connect(buyer).buyRight(tokenId, { value: price });

      const finalPlatformBalance = await platformWallet.getBalance();
      const expectedFee = price.mul(250).div(10000); // 2.5%
      
      expect(finalPlatformBalance.sub(initialPlatformBalance)).to.equal(expectedFee);
    });
  });

  describe("Auction System", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await contract.connect(creator).mintRight(
        "Auction Test", "royalty", "auction123", "uri123",
        ethers.utils.parseEther("1.0"), false, 0, [creator.address], [10000]
      );
      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'RightMinted').args.tokenId;
      await contract.verifyRight(tokenId, true);
    });

    it("Should start an auction", async function () {
      const duration = 86400; // 24 hours
      const minBid = ethers.utils.parseEther("0.5");

      await contract.connect(creator).startAuction(tokenId, duration, minBid);

      const auctionDetails = await contract.getAuctionDetails(tokenId);
      expect(auctionDetails.isActive).to.be.true;
      expect(auctionDetails.minBidAmount).to.equal(minBid);
    });

    it("Should place bids correctly", async function () {
      const duration = 86400;
      const minBid = ethers.utils.parseEther("0.5");
      const bidAmount = ethers.utils.parseEther("1.0");

      await contract.connect(creator).startAuction(tokenId, duration, minBid);
      await contract.connect(buyer).placeBid(tokenId, { value: bidAmount });

      const auctionDetails = await contract.getAuctionDetails(tokenId);
      expect(auctionDetails.highestBidder).to.equal(buyer.address);
      expect(auctionDetails.highestBid).to.equal(bidAmount);
    });
  });

  describe("Revenue Distribution", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await contract.connect(creator).mintRight(
        "Revenue Test", "royalty", "revenue123", "uri123",
        ethers.utils.parseEther("1.0"), true, 2000, [creator.address], [10000] // 20% distribution, pays dividends
      );
      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'RightMinted').args.tokenId;
      await contract.verifyRight(tokenId, true);
    });

    it("Should distribute revenue to stakeholders", async function () {
      const revenueAmount = ethers.utils.parseEther("2.0");
      
      await contract.distributeRevenue(tokenId, { value: revenueAmount });

      const pendingDistribution = await contract.getPendingDistribution(tokenId, creator.address);
      expect(pendingDistribution).to.equal(revenueAmount); // Creator gets 100% as only stakeholder
    });

    it("Should allow stakeholders to claim distributions", async function () {
      const revenueAmount = ethers.utils.parseEther("1.0");
      
      await contract.distributeRevenue(tokenId, { value: revenueAmount });
      
      const initialBalance = await creator.getBalance();
      await contract.connect(creator).claimDistribution(tokenId);
      const finalBalance = await creator.getBalance();
      
      // Should receive the revenue minus gas costs
      expect(finalBalance.gt(initialBalance)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to verify creators", async function () {
      await contract.verifyCreator(addrs[0].address, true);
      expect(await contract.verifiedCreators(addrs[0].address)).to.be.true;
    });

    it("Should allow owner to ban addresses", async function () {
      await contract.banAddress(addrs[0].address, true);
      expect(await contract.bannedAddresses(addrs[0].address)).to.be.true;
    });

    it("Should allow owner to set platform fee", async function () {
      await contract.setPlatformFee(500); // 5%
      expect(await contract.platformFeePercentage()).to.equal(500);
    });

    it("Should prevent setting fee above 10%", async function () {
      await expect(contract.setPlatformFee(1100)).to.be.revertedWith("Fee cannot exceed 10%");
    });
  });
});