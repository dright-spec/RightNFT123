// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DrightNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct RightDetails {
        string title;
        string rightType; // copyright, royalty, access, ownership, license
        string contentFileHash; // SHA-256 hash of actual content file
        string metadataURI; // IPFS URI for metadata
        address creator;
        address currentOwner;
        uint256 price;
        bool isListed;
        bool paysDividends;
        uint256 distributionPercentage; // Percentage * 100 (e.g., 1000 = 10%)
        uint256 totalRevenue;
        bool isVerified;
        uint256 verifiedAt;
        mapping(address => uint256) stakeholderShares;
        address[] stakeholders;
    }

    struct AuctionDetails {
        uint256 startTime;
        uint256 endTime;
        uint256 minBidAmount;
        uint256 highestBid;
        address highestBidder;
        bool isActive;
        mapping(address => uint256) bidRefunds;
    }

    mapping(uint256 => RightDetails) public rights;
    mapping(uint256 => AuctionDetails) public auctions;
    mapping(address => bool) public verifiedCreators;
    mapping(address => bool) public bannedAddresses;
    mapping(string => bool) public usedContentHashes;

    // Revenue distribution tracking
    mapping(uint256 => mapping(address => uint256)) public pendingDistributions;
    mapping(uint256 => uint256) public totalDistributed;

    // Platform fees
    uint256 public platformFeePercentage = 250; // 2.5%
    address public platformWallet;

    // Events
    event RightMinted(uint256 indexed tokenId, address indexed creator, string contentHash);
    event RightVerified(uint256 indexed tokenId, bool verified, uint256 timestamp);
    event RightListed(uint256 indexed tokenId, uint256 price, bool isAuction);
    event RightSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event AuctionStarted(uint256 indexed tokenId, uint256 endTime, uint256 minBid);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event RevenueDistributed(uint256 indexed tokenId, uint256 amount, uint256 timestamp);
    event CreatorVerified(address indexed creator, bool verified);
    event AddressBanned(address indexed account, bool banned);

    modifier onlyVerified() {
        require(verifiedCreators[msg.sender] || owner() == msg.sender, "Only verified creators");
        _;
    }

    modifier notBanned() {
        require(!bannedAddresses[msg.sender], "Address is banned");
        _;
    }

    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    constructor(address _platformWallet) ERC721("Dright NFT", "DRIGHT") {
        platformWallet = _platformWallet;
    }

    function mintRight(
        string memory title,
        string memory rightType,
        string memory contentFileHash,
        string memory metadataURI,
        uint256 price,
        bool paysDividends,
        uint256 distributionPercentage,
        address[] memory stakeholders,
        uint256[] memory shares
    ) public onlyVerified notBanned returns (uint256) {
        require(bytes(contentFileHash).length > 0, "Content hash required");
        require(!usedContentHashes[contentFileHash], "Content hash already used");
        require(stakeholders.length == shares.length, "Stakeholders and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == 10000, "Total shares must equal 10000 (100%)");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        RightDetails storage right = rights[tokenId];
        right.title = title;
        right.rightType = rightType;
        right.contentFileHash = contentFileHash;
        right.metadataURI = metadataURI;
        right.creator = msg.sender;
        right.currentOwner = msg.sender;
        right.price = price;
        right.isListed = false;
        right.paysDividends = paysDividends;
        right.distributionPercentage = distributionPercentage;
        right.isVerified = false;

        // Set stakeholder shares
        for (uint256 i = 0; i < stakeholders.length; i++) {
            right.stakeholderShares[stakeholders[i]] = shares[i];
            right.stakeholders.push(stakeholders[i]);
        }

        usedContentHashes[contentFileHash] = true;

        emit RightMinted(tokenId, msg.sender, contentFileHash);
        return tokenId;
    }

    function verifyRight(uint256 tokenId, bool verified) public onlyOwner validTokenId(tokenId) {
        rights[tokenId].isVerified = verified;
        rights[tokenId].verifiedAt = block.timestamp;
        emit RightVerified(tokenId, verified, block.timestamp);
    }

    function listRight(uint256 tokenId, uint256 price) public validTokenId(tokenId) notBanned {
        require(ownerOf(tokenId) == msg.sender, "Only owner can list");
        require(rights[tokenId].isVerified, "Right must be verified");
        
        rights[tokenId].price = price;
        rights[tokenId].isListed = true;
        
        emit RightListed(tokenId, price, false);
    }

    function buyRight(uint256 tokenId) public payable validTokenId(tokenId) notBanned nonReentrant {
        require(rights[tokenId].isListed, "Right not listed");
        require(msg.value >= rights[tokenId].price, "Insufficient payment");
        require(ownerOf(tokenId) != msg.sender, "Cannot buy own right");

        address seller = ownerOf(tokenId);
        uint256 price = rights[tokenId].price;
        
        // Calculate platform fee
        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 sellerAmount = price - platformFee;

        // Transfer ownership
        _transfer(seller, msg.sender, tokenId);
        rights[tokenId].currentOwner = msg.sender;
        rights[tokenId].isListed = false;

        // Transfer payments
        payable(seller).transfer(sellerAmount);
        payable(platformWallet).transfer(platformFee);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit RightSold(tokenId, msg.sender, price);
    }

    function startAuction(
        uint256 tokenId,
        uint256 duration,
        uint256 minBidAmount
    ) public validTokenId(tokenId) notBanned {
        require(ownerOf(tokenId) == msg.sender, "Only owner can start auction");
        require(rights[tokenId].isVerified, "Right must be verified");
        require(!auctions[tokenId].isActive, "Auction already active");

        AuctionDetails storage auction = auctions[tokenId];
        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + duration;
        auction.minBidAmount = minBidAmount;
        auction.isActive = true;

        rights[tokenId].isListed = true;

        emit AuctionStarted(tokenId, auction.endTime, minBidAmount);
    }

    function placeBid(uint256 tokenId) public payable validTokenId(tokenId) notBanned nonReentrant {
        AuctionDetails storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.minBidAmount, "Bid below minimum");
        require(msg.value > auction.highestBid, "Bid not high enough");
        require(ownerOf(tokenId) != msg.sender, "Cannot bid on own right");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            auction.bidRefunds[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) public validTokenId(tokenId) nonReentrant {
        AuctionDetails storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still active");

        auction.isActive = false;
        rights[tokenId].isListed = false;

        if (auction.highestBidder != address(0)) {
            address seller = ownerOf(tokenId);
            uint256 price = auction.highestBid;
            
            // Calculate platform fee
            uint256 platformFee = (price * platformFeePercentage) / 10000;
            uint256 sellerAmount = price - platformFee;

            // Transfer ownership
            _transfer(seller, auction.highestBidder, tokenId);
            rights[tokenId].currentOwner = auction.highestBidder;

            // Transfer payments
            payable(seller).transfer(sellerAmount);
            payable(platformWallet).transfer(platformFee);

            emit RightSold(tokenId, auction.highestBidder, price);
        }

        emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
    }

    function withdrawBidRefund(uint256 tokenId) public nonReentrant {
        uint256 refundAmount = auctions[tokenId].bidRefunds[msg.sender];
        require(refundAmount > 0, "No refund available");
        
        auctions[tokenId].bidRefunds[msg.sender] = 0;
        payable(msg.sender).transfer(refundAmount);
    }

    function distributeRevenue(uint256 tokenId) public payable validTokenId(tokenId) nonReentrant {
        require(rights[tokenId].paysDividends, "Right does not pay dividends");
        require(msg.value > 0, "No revenue to distribute");

        RightDetails storage right = rights[tokenId];
        uint256 totalRevenue = msg.value;
        right.totalRevenue += totalRevenue;

        // Distribute to stakeholders based on their shares
        for (uint256 i = 0; i < right.stakeholders.length; i++) {
            address stakeholder = right.stakeholders[i];
            uint256 share = right.stakeholderShares[stakeholder];
            uint256 amount = (totalRevenue * share) / 10000;
            
            pendingDistributions[tokenId][stakeholder] += amount;
        }

        totalDistributed[tokenId] += totalRevenue;
        emit RevenueDistributed(tokenId, totalRevenue, block.timestamp);
    }

    function claimDistribution(uint256 tokenId) public validTokenId(tokenId) nonReentrant {
        uint256 amount = pendingDistributions[tokenId][msg.sender];
        require(amount > 0, "No distribution available");
        
        pendingDistributions[tokenId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Admin functions
    function verifyCreator(address creator, bool verified) public onlyOwner {
        verifiedCreators[creator] = verified;
        emit CreatorVerified(creator, verified);
    }

    function banAddress(address account, bool banned) public onlyOwner {
        bannedAddresses[account] = banned;
        emit AddressBanned(account, banned);
    }

    function setPlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
    }

    function setPlatformWallet(address newWallet) public onlyOwner {
        platformWallet = newWallet;
    }

    // View functions
    function getRightDetails(uint256 tokenId) public view validTokenId(tokenId) returns (
        string memory title,
        string memory rightType,
        string memory contentFileHash,
        address creator,
        address currentOwner,
        uint256 price,
        bool isListed,
        bool paysDividends,
        bool isVerified,
        uint256 totalRevenue
    ) {
        RightDetails storage right = rights[tokenId];
        return (
            right.title,
            right.rightType,
            right.contentFileHash,
            right.creator,
            right.currentOwner,
            right.price,
            right.isListed,
            right.paysDividends,
            right.isVerified,
            right.totalRevenue
        );
    }

    function getAuctionDetails(uint256 tokenId) public view validTokenId(tokenId) returns (
        uint256 startTime,
        uint256 endTime,
        uint256 minBidAmount,
        uint256 highestBid,
        address highestBidder,
        bool isActive
    ) {
        AuctionDetails storage auction = auctions[tokenId];
        return (
            auction.startTime,
            auction.endTime,
            auction.minBidAmount,
            auction.highestBid,
            auction.highestBidder,
            auction.isActive
        );
    }

    function getStakeholderShare(uint256 tokenId, address stakeholder) public view validTokenId(tokenId) returns (uint256) {
        return rights[tokenId].stakeholderShares[stakeholder];
    }

    function getPendingDistribution(uint256 tokenId, address stakeholder) public view validTokenId(tokenId) returns (uint256) {
        return pendingDistributions[tokenId][stakeholder];
    }

    function isContentHashUsed(string memory contentHash) public view returns (bool) {
        return usedContentHashes[contentHash];
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}