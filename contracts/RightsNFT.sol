// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RightsNFT
 * @dev NFT contract for tokenizing intellectual property rights with built-in marketplace functionality
 */
contract RightsNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Rights metadata structure
    struct RightInfo {
        string rightType; // copyright, royalty, access, ownership, license
        address creator;
        address currentOwner;
        uint256 price;
        bool isListed;
        bool paysDividends;
        uint256 royaltyPercentage; // basis points (e.g., 750 = 7.5%)
        string contentHash; // IPFS hash of the actual content
        uint256 createdAt;
    }
    
    // Marketplace functionality
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }
    
    // Auction functionality
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingBid;
        uint256 reservePrice;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => RightInfo) public rightInfo;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256[]) public creatorTokens;
    mapping(address => uint256) public pendingWithdrawals;
    
    // Events
    event RightMinted(uint256 indexed tokenId, address indexed creator, string rightType, string metadataURI);
    event RightListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event RightSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event AuctionStarted(uint256 indexed tokenId, address indexed seller, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event DividendPaid(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    
    // Platform fee (2.5%)
    uint256 public platformFeePercentage = 250; // 250 basis points = 2.5%
    address public platformFeeRecipient;
    
    constructor(address _platformFeeRecipient) ERC721("Dright Rights NFT", "DRIGHT") {
        platformFeeRecipient = _platformFeeRecipient;
    }
    
    /**
     * @dev Mint a new rights NFT
     */
    function mintRight(
        address to,
        string memory metadataURI,
        string memory rightType,
        uint256 price,
        bool paysDividends,
        uint256 royaltyPercentage,
        string memory contentHash
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        
        // Set royalty for secondary sales
        if (royaltyPercentage > 0) {
            _setTokenRoyalty(newTokenId, to, uint96(royaltyPercentage));
        }
        
        // Store right information
        rightInfo[newTokenId] = RightInfo({
            rightType: rightType,
            creator: to,
            currentOwner: to,
            price: price,
            isListed: false,
            paysDividends: paysDividends,
            royaltyPercentage: royaltyPercentage,
            contentHash: contentHash,
            createdAt: block.timestamp
        });
        
        // Track creator's tokens
        creatorTokens[to].push(newTokenId);
        
        emit RightMinted(newTokenId, to, rightType, metadataURI);
        return newTokenId;
    }
    
    /**
     * @dev List an NFT for sale
     */
    function listRight(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can list");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });
        
        rightInfo[tokenId].isListed = true;
        rightInfo[tokenId].price = price;
        
        emit RightListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy a listed NFT
     */
    function buyRight(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 sellerAmount = price - platformFee;
        
        // Handle royalty payments
        (address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
        if (royaltyAmount > 0 && royaltyRecipient != seller) {
            sellerAmount -= royaltyAmount;
            pendingWithdrawals[royaltyRecipient] += royaltyAmount;
        }
        
        // Transfer payments
        pendingWithdrawals[seller] += sellerAmount;
        pendingWithdrawals[platformFeeRecipient] += platformFee;
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Update right info
        rightInfo[tokenId].currentOwner = msg.sender;
        rightInfo[tokenId].isListed = false;
        
        // Clear listing
        delete listings[tokenId];
        
        // Refund excess payment
        if (msg.value > price) {
            pendingWithdrawals[msg.sender] += (msg.value - price);
        }
        
        emit RightSold(tokenId, msg.sender, seller, price);
    }
    
    /**
     * @dev Start an auction for an NFT
     */
    function startAuction(
        uint256 tokenId,
        uint256 startingBid,
        uint256 reservePrice,
        uint256 duration
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can auction");
        require(!auctions[tokenId].isActive, "Auction already active");
        require(duration >= 1 hours && duration <= 7 days, "Invalid duration");
        
        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startingBid: startingBid,
            reservePrice: reservePrice,
            currentBid: 0,
            currentBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });
        
        emit AuctionStarted(tokenId, msg.sender, startingBid, block.timestamp + duration);
    }
    
    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 tokenId) public payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.startingBid, "Bid below starting bid");
        require(msg.value > auction.currentBid, "Bid too low");
        
        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            pendingWithdrawals[auction.currentBidder] += auction.currentBid;
        }
        
        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }
    
    /**
     * @dev End an auction
     */
    function endAuction(uint256 tokenId) public nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");
        
        auction.isActive = false;
        
        if (auction.currentBidder != address(0) && auction.currentBid >= auction.reservePrice) {
            // Successful auction
            address seller = auction.seller;
            uint256 price = auction.currentBid;
            
            // Calculate fees
            uint256 platformFee = (price * platformFeePercentage) / 10000;
            uint256 sellerAmount = price - platformFee;
            
            // Handle royalty payments
            (address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
            if (royaltyAmount > 0 && royaltyRecipient != seller) {
                sellerAmount -= royaltyAmount;
                pendingWithdrawals[royaltyRecipient] += royaltyAmount;
            }
            
            // Transfer payments
            pendingWithdrawals[seller] += sellerAmount;
            pendingWithdrawals[platformFeeRecipient] += platformFee;
            
            // Transfer NFT
            _transfer(seller, auction.currentBidder, tokenId);
            
            // Update right info
            rightInfo[tokenId].currentOwner = auction.currentBidder;
            
            emit AuctionEnded(tokenId, auction.currentBidder, price);
        } else {
            // Failed auction - refund bidder
            if (auction.currentBidder != address(0)) {
                pendingWithdrawals[auction.currentBidder] += auction.currentBid;
            }
            emit AuctionEnded(tokenId, address(0), 0);
        }
        
        delete auctions[tokenId];
    }
    
    /**
     * @dev Withdraw pending payments
     */
    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Pay dividends to NFT holder (for rights that pay dividends)
     */
    function payDividend(uint256 tokenId) public payable {
        require(rightInfo[tokenId].paysDividends, "This right doesn't pay dividends");
        require(msg.value > 0, "No dividend amount");
        
        address owner = ownerOf(tokenId);
        pendingWithdrawals[owner] += msg.value;
        
        emit DividendPaid(tokenId, owner, msg.value);
    }
    
    /**
     * @dev Get tokens created by a specific address
     */
    function getCreatorTokens(address creator) public view returns (uint256[] memory) {
        return creatorTokens[creator];
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }
    
    // Override required functions
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