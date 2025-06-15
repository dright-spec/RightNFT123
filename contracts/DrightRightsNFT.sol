// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DrightRightsNFT
 * @dev Advanced NFT contract for tokenizing legal rights with automated revenue distribution
 * @notice This contract represents legal rights as NFTs with built-in revenue sharing capabilities
 */
contract DrightRightsNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Burnable, 
    ERC721Royalty, 
    Ownable, 
    Pausable, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Rights types enum
    enum RightType { COPYRIGHT, ROYALTY, ACCESS, OWNERSHIP, LICENSE }

    // Verification status enum
    enum VerificationStatus { PENDING, VERIFIED, REJECTED }

    // Listing type enum
    enum ListingType { FIXED_PRICE, AUCTION, NOT_LISTED }

    // Right metadata structure
    struct RightMetadata {
        string title;
        string description;
        RightType rightType;
        address creator;
        address currentOwner;
        VerificationStatus verificationStatus;
        bool paysDividends;
        uint256 royaltyPercentage; // In basis points (100 = 1%)
        uint256 creationTime;
        uint256 verificationTime;
        string[] tags;
        string externalUrl;
        string legalDocumentHash;
    }

    // Marketplace listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        ListingType listingType;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        uint256 reservePrice;
        bool isActive;
    }

    // Revenue distribution structure
    struct RevenueDistribution {
        uint256 tokenId;
        uint256 totalAmount;
        uint256 distributionTime;
        string source; // e.g., "Spotify Royalties", "Licensing Deal"
        mapping(address => uint256) holderAmounts;
        address[] holders;
        bool isDistributed;
    }

    // Storage mappings
    mapping(uint256 => RightMetadata) public rightMetadata;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256[]) public tokenRevenueDistributions;
    mapping(uint256 => RevenueDistribution) public revenueDistributions;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => uint256[]) public creatorTokens;
    mapping(RightType => uint256) public rightTypeCount;

    // Revenue distribution counter
    Counters.Counter private _distributionIdCounter;

    // Platform settings
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    address public platformFeeRecipient;
    uint256 public minimumListingPrice = 0.001 ether;
    uint256 public auctionExtensionTime = 300; // 5 minutes

    // Events
    event RightCreated(
        uint256 indexed tokenId,
        address indexed creator,
        RightType rightType,
        string title
    );
    
    event RightVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        VerificationStatus status
    );
    
    event RightListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        ListingType listingType
    );
    
    event RightSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    
    event RevenueDistributed(
        uint256 indexed distributionId,
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 holderCount
    );
    
    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    constructor(
        string memory name,
        string memory symbol,
        address _platformFeeRecipient
    ) ERC721(name, symbol) {
        platformFeeRecipient = _platformFeeRecipient;
        authorizedVerifiers[msg.sender] = true;
    }

    /**
     * @dev Create a new right NFT
     * @param to Address to mint the NFT to
     * @param metadataUri IPFS URI containing the metadata
     * @param rightData Struct containing right information
     * @param royaltyBasisPoints Royalty percentage in basis points
     */
    function createRight(
        address to,
        string memory metadataUri,
        RightMetadata memory rightData,
        uint96 royaltyBasisPoints
    ) public whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataUri).length > 0, "Metadata URI required");
        require(royaltyBasisPoints <= 10000, "Royalty cannot exceed 100%");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Set token metadata
        rightMetadata[tokenId] = RightMetadata({
            title: rightData.title,
            description: rightData.description,
            rightType: rightData.rightType,
            creator: msg.sender,
            currentOwner: to,
            verificationStatus: VerificationStatus.PENDING,
            paysDividends: rightData.paysDividends,
            royaltyPercentage: rightData.royaltyPercentage,
            creationTime: block.timestamp,
            verificationTime: 0,
            tags: rightData.tags,
            externalUrl: rightData.externalUrl,
            legalDocumentHash: rightData.legalDocumentHash
        });

        // Track creator tokens
        creatorTokens[msg.sender].push(tokenId);
        rightTypeCount[rightData.rightType]++;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataUri);
        
        // Set royalty information
        _setTokenRoyalty(tokenId, msg.sender, royaltyBasisPoints);

        emit RightCreated(tokenId, msg.sender, rightData.rightType, rightData.title);
        return tokenId;
    }

    /**
     * @dev Verify a right (only authorized verifiers)
     * @param tokenId Token ID to verify
     * @param status Verification status
     */
    function verifyRight(
        uint256 tokenId,
        VerificationStatus status
    ) public {
        require(authorizedVerifiers[msg.sender], "Not authorized to verify");
        require(_exists(tokenId), "Token does not exist");
        require(
            rightMetadata[tokenId].verificationStatus == VerificationStatus.PENDING,
            "Right already processed"
        );

        rightMetadata[tokenId].verificationStatus = status;
        rightMetadata[tokenId].verificationTime = block.timestamp;

        emit RightVerified(tokenId, msg.sender, status);
    }

    /**
     * @dev List a right for sale
     * @param tokenId Token ID to list
     * @param price Listing price
     * @param listingType Type of listing (fixed price or auction)
     * @param auctionDuration Duration for auction (0 for fixed price)
     * @param reservePrice Reserve price for auction
     */
    function listRight(
        uint256 tokenId,
        uint256 price,
        ListingType listingType,
        uint256 auctionDuration,
        uint256 reservePrice
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            rightMetadata[tokenId].verificationStatus == VerificationStatus.VERIFIED,
            "Right not verified"
        );
        require(price >= minimumListingPrice, "Price below minimum");
        require(!listings[tokenId].isActive, "Already listed");

        uint256 auctionEndTime = 0;
        if (listingType == ListingType.AUCTION) {
            require(auctionDuration > 0, "Invalid auction duration");
            auctionEndTime = block.timestamp + auctionDuration;
        }

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            listingType: listingType,
            auctionEndTime: auctionEndTime,
            highestBidder: address(0),
            highestBid: 0,
            reservePrice: reservePrice,
            isActive: true
        });

        emit RightListed(tokenId, msg.sender, price, listingType);
    }

    /**
     * @dev Purchase a right at fixed price
     * @param tokenId Token ID to purchase
     */
    function purchaseRight(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed for sale");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not fixed price listing");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Clear the listing
        delete listings[tokenId];

        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyRecipient;
        
        (royaltyRecipient, royaltyAmount) = royaltyInfo(tokenId, price);
        
        uint256 sellerAmount = price - platformFee - royaltyAmount;

        // Transfer payments
        if (platformFee > 0) {
            payable(platformFeeRecipient).transfer(platformFee);
        }
        if (royaltyAmount > 0 && royaltyRecipient != seller) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }
        payable(seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        rightMetadata[tokenId].currentOwner = msg.sender;

        emit RightSold(tokenId, seller, msg.sender, price);
    }

    /**
     * @dev Place a bid on an auction
     * @param tokenId Token ID to bid on
     */
    function placeBid(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed for sale");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp < listing.auctionEndTime, "Auction ended");
        require(msg.value > listing.highestBid, "Bid too low");
        require(msg.value >= listing.reservePrice, "Below reserve price");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        // Update auction state
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        // Extend auction if bid placed in last 5 minutes
        if (listing.auctionEndTime - block.timestamp < auctionExtensionTime) {
            listing.auctionEndTime += auctionExtensionTime;
        }

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction and transfer the NFT
     * @param tokenId Token ID of the auction to end
     */
    function endAuction(uint256 tokenId) public nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not an active auction");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp >= listing.auctionEndTime, "Auction still active");

        address seller = listing.seller;
        address winner = listing.highestBidder;
        uint256 winningBid = listing.highestBid;

        // Clear the listing
        delete listings[tokenId];

        if (winner != address(0) && winningBid >= listing.reservePrice) {
            // Calculate fees
            uint256 platformFee = (winningBid * platformFeePercentage) / 10000;
            uint256 royaltyAmount = 0;
            address royaltyRecipient;
            
            (royaltyRecipient, royaltyAmount) = royaltyInfo(tokenId, winningBid);
            
            uint256 sellerAmount = winningBid - platformFee - royaltyAmount;

            // Transfer payments
            if (platformFee > 0) {
                payable(platformFeeRecipient).transfer(platformFee);
            }
            if (royaltyAmount > 0 && royaltyRecipient != seller) {
                payable(royaltyRecipient).transfer(royaltyAmount);
            }
            payable(seller).transfer(sellerAmount);

            // Transfer NFT
            _transfer(seller, winner, tokenId);
            rightMetadata[tokenId].currentOwner = winner;

            emit RightSold(tokenId, seller, winner, winningBid);
        }
    }

    /**
     * @dev Distribute revenue to NFT holders
     * @param tokenId Token ID to distribute revenue for
     * @param source Description of revenue source
     */
    function distributeRevenue(
        uint256 tokenId,
        string memory source
    ) public payable nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value > 0, "No revenue to distribute");
        require(rightMetadata[tokenId].paysDividends, "Token doesn't pay dividends");

        _distributionIdCounter.increment();
        uint256 distributionId = _distributionIdCounter.current();

        address tokenOwner = ownerOf(tokenId);
        
        // Create revenue distribution record
        RevenueDistribution storage distribution = revenueDistributions[distributionId];
        distribution.tokenId = tokenId;
        distribution.totalAmount = msg.value;
        distribution.distributionTime = block.timestamp;
        distribution.source = source;
        distribution.isDistributed = true;

        // For simplicity, distribute all revenue to current token owner
        // In a more complex system, this could be split among multiple holders
        distribution.holders.push(tokenOwner);
        distribution.holderAmounts[tokenOwner] = msg.value;

        // Add to token's distribution history
        tokenRevenueDistributions[tokenId].push(distributionId);

        // Transfer revenue to token owner
        payable(tokenOwner).transfer(msg.value);

        emit RevenueDistributed(distributionId, tokenId, msg.value, 1);
    }

    /**
     * @dev Cancel a listing
     * @param tokenId Token ID to cancel listing for
     */
    function cancelListing(uint256 tokenId) public {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].isActive, "Listing not active");

        // Refund highest bidder if auction
        if (listings[tokenId].listingType == ListingType.AUCTION && 
            listings[tokenId].highestBidder != address(0)) {
            payable(listings[tokenId].highestBidder).transfer(listings[tokenId].highestBid);
        }

        delete listings[tokenId];
    }

    /**
     * @dev Get all tokens created by an address
     * @param creator Creator address
     * @return Array of token IDs
     */
    function getCreatorTokens(address creator) public view returns (uint256[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @dev Get revenue distribution history for a token
     * @param tokenId Token ID
     * @return Array of distribution IDs
     */
    function getTokenRevenueHistory(uint256 tokenId) public view returns (uint256[] memory) {
        return tokenRevenueDistributions[tokenId];
    }

    /**
     * @dev Check if a token is listed for sale
     * @param tokenId Token ID to check
     * @return Whether the token is listed
     */
    function isListed(uint256 tokenId) public view returns (bool) {
        return listings[tokenId].isActive;
    }

    /**
     * @dev Get current token count
     * @return Current number of minted tokens
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Admin functions
    function addVerifier(address verifier) public onlyOwner {
        authorizedVerifiers[verifier] = true;
    }

    function removeVerifier(address verifier) public onlyOwner {
        authorizedVerifiers[verifier] = false;
    }

    function setPlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
    }

    function setPlatformFeeRecipient(address newRecipient) public onlyOwner {
        platformFeeRecipient = newRecipient;
    }

    function setMinimumListingPrice(uint256 newMinimum) public onlyOwner {
        minimumListingPrice = newMinimum;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Emergency withdrawal (only for stuck funds)
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Update current owner in metadata
        if (to != address(0)) {
            rightMetadata[tokenId].currentOwner = to;
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}