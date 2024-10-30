// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

contract MyERC1155Collection is ERC1155, AccessControl, Pausable {
  uint256 private _currentTokenId;
  mapping(uint256 => string) private _tokenURIs;
  mapping(uint256 => uint256) private _tokenPrices;

  // Define roles for minting and burning
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');
  bytes32 public constant METADATA_ROLE = keccak256('METADATA_ROLE');

  event Minted(address indexed to, uint256 indexed tokenId, uint256 amount);
  event Burned(address indexed from, uint256 indexed tokenId, uint256 amount);
  event TokenMetadataUpdated(uint256 indexed tokenId, string newTokenURI);
  event TokenPriceUpdated(uint256 indexed tokenId, uint256 newPrice);

  // Constructor sets the base URI and assigns default roles
  constructor(string memory uri_) ERC1155(uri_) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(BURNER_ROLE, msg.sender);
    _grantRole(METADATA_ROLE, msg.sender);
  }

  function setMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(MINTER_ROLE, account);
  }

  function setBurnerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(BURNER_ROLE, account);
  }

  function setMetadataRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(METADATA_ROLE, account);
  }

  // Function to mint a new token, only accessible to accounts with the MINTER_ROLE
  function mint(address to, uint256 amount, bytes memory data) external onlyRole(MINTER_ROLE) whenNotPaused {
    _currentTokenId += 1;
    _mint(to, _currentTokenId, amount, data);
    _tokenURIs[_currentTokenId] = ''; // Initialize with an empty URI or default URI
    emit Minted(to, _currentTokenId, amount);
  }

  // Batch minting function, only accessible to accounts with the MINTER_ROLE
  function mintBatch(
    address to,
    uint256[] memory amounts,
    bytes memory data
  ) external onlyRole(MINTER_ROLE) whenNotPaused {
    uint256[] memory ids = new uint256[](amounts.length);

    for (uint256 i = 0; i < amounts.length; i++) {
      _currentTokenId++;
      ids[i] = _currentTokenId;
    }
    _mintBatch(to, ids, amounts, data);

    for (uint256 i = 0; i < ids.length; i++) {
      emit Minted(to, ids[i], amounts[i]);
    }
  }

  // Update the URI of a token
  function setTokenURI(uint256 tokenId, string memory newTokenURI) external onlyRole(METADATA_ROLE) {
    require(tokenId <= _currentTokenId, 'Token does not exist');
    _tokenURIs[tokenId] = newTokenURI;
    emit TokenMetadataUpdated(tokenId, newTokenURI);
  }

  // Set the price of a specific token
  function setTokenPrice(uint256 tokenId, uint256 newPrice) external onlyRole(METADATA_ROLE) {
    _tokenPrices[tokenId] = newPrice;
    emit TokenPriceUpdated(tokenId, newPrice);
  }

  // Function to burn a token, accessible to BURNER_ROLE or approved users
  function burn(address from, uint256 id, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
    require(balanceOf(from, id) >= amount, 'Insufficient balance to burn');
    _burn(from, id, amount);
    emit Burned(from, id, amount); // Emit event after burning
  }

  // Batch burning function
  function burnBatch(
    address from,
    uint256[] memory ids,
    uint256[] memory amounts
  ) external onlyRole(BURNER_ROLE) whenNotPaused {
    _burnBatch(from, ids, amounts);
    // Emit an event for each burned token
    for (uint256 i = 0; i < ids.length; i++) {
      emit Burned(from, ids[i], amounts[i]);
    }
  }

  function getTokenPrice(uint256 tokenId) external view returns (uint256) {
    return _tokenPrices[tokenId];
  }

  function getTokenURI(uint256 tokenId) external view returns (string memory) {
    return _tokenURIs[tokenId];
  }

  // Pauses all minting and burning functions in case of emergency
  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  // Unpauses the contract and resumes minting and burning
  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  // Override de supportsInterface para incluir los roles de AccessControl
  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
