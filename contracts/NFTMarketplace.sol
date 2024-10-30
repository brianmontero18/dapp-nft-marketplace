// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './MyERC721Collection.sol';
import './MyERC1155Collection.sol';

contract NFTMarketplace is Ownable {
  IERC20 public paymentToken;
  MyERC721Collection private _erc721;
  MyERC1155Collection private _erc1155;
  uint256[] private activeERC721Ids;
  uint256[] private activeERC1155Ids;
  mapping(uint256 => ERC721Listing) public erc721Listings;
  mapping(uint256 => ERC1155Listing) public erc1155Listings;

  struct ERC721Listing {
    uint256 tokenId;
    address seller;
    uint256 price;
    string uri;
  }

  struct ERC1155Listing {
    uint256 tokenId;
    address seller;
    uint256 price;
    uint256 amount;
    string uri;
  }

  event ItemListed(address nftContract, uint256 indexed tokenId, uint256 amount, uint256 price);
  event Sold(uint256 indexed tokenId, address indexed buyer, uint256 price);

  constructor(address erc721Address, address erc1155Address, address _paymentToken) Ownable(msg.sender) {
    paymentToken = IERC20(_paymentToken);
    _erc721 = MyERC721Collection(erc721Address);
    _erc1155 = MyERC1155Collection(erc1155Address);
  }

  function listERC721ForSale(address user, uint256 tokenId, uint256 price) external {
    _erc721.transferFrom(user, address(this), tokenId);
    erc721Listings[tokenId] = ERC721Listing(tokenId, user, price, _erc721.tokenURI(tokenId));
    activeERC721Ids.push(tokenId);

    emit ItemListed(address(_erc721), tokenId, 1, price);
  }

  function listERC1155ForSale(address user, uint256 tokenId, uint256 amount, uint256 price) external {
    _erc1155.safeTransferFrom(user, address(this), tokenId, amount, '');
    erc1155Listings[tokenId] = ERC1155Listing(tokenId, user, price, amount, _erc1155.uri(tokenId));
    activeERC1155Ids.push(tokenId);

    emit ItemListed(address(_erc1155), tokenId, amount, price);
  }

  function buyERC721Item(uint256 tokenId) external {
    ERC721Listing memory listing = erc721Listings[tokenId];
    require(listing.price > 0, 'Item not for sale');
    require(paymentToken.balanceOf(msg.sender) >= listing.price, 'Insufficient payment balance');

    // Transfer payment and NFT
    paymentToken.transferFrom(msg.sender, listing.seller, listing.price);
    _erc721.transferFrom(address(this), msg.sender, tokenId);

    // Remove listing and emit event
    delete erc721Listings[tokenId];
    _removeActiveToken(tokenId, true);

    emit Sold(tokenId, msg.sender, listing.price);
  }

  function buyERC1155Item(uint256 tokenId, uint256 amount) external {
    ERC1155Listing memory listing = erc1155Listings[tokenId];
    require(listing.price > 0, 'Item not for sale');
    require(listing.amount >= amount, 'Not enough quantity available');
    require(paymentToken.balanceOf(msg.sender) >= listing.price * amount, 'Insufficient payment balance');

    // Transfer payment and tokens
    paymentToken.transferFrom(msg.sender, listing.seller, listing.price * amount);
    _erc1155.safeTransferFrom(address(this), msg.sender, tokenId, amount, '');

    // Update or remove listing based on remaining amount
    if (listing.amount == amount) {
      delete erc1155Listings[tokenId];
      _removeActiveToken(tokenId, false);
    } else {
      erc1155Listings[tokenId].amount -= amount;
    }

    emit Sold(tokenId, msg.sender, listing.price * amount);
  }

  function getDetailedListedNFTs()
    external
    view
    returns (ERC721Listing[] memory erc721, ERC1155Listing[] memory erc1155)
  {
    erc721 = new ERC721Listing[](activeERC721Ids.length);
    erc1155 = new ERC1155Listing[](activeERC1155Ids.length);

    for (uint256 i = 0; i < activeERC721Ids.length; i++) {
      uint256 tokenId = activeERC721Ids[i];
      erc721[i] = erc721Listings[tokenId];
    }

    for (uint256 i = 0; i < activeERC1155Ids.length; i++) {
      uint256 tokenId = activeERC1155Ids[i];
      erc1155[i] = erc1155Listings[tokenId];
    }
  }

  function _removeActiveToken(uint256 tokenId, bool isERC721) internal {
    uint256[] storage activeTokens = isERC721 ? activeERC721Ids : activeERC1155Ids;
    for (uint256 i = 0; i < activeTokens.length; i++) {
      if (activeTokens[i] == tokenId) {
        activeTokens[i] = activeTokens[activeTokens.length - 1];
        activeTokens.pop();
        break;
      }
    }
  }

  // Manejo de safeTransferFrom para ERC1155
  function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
    return this.onERC1155Received.selector;
  }

  function onERC1155BatchReceived(
    address,
    address,
    uint256[] calldata,
    uint256[] calldata,
    bytes calldata
  ) external pure returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
  }
}
