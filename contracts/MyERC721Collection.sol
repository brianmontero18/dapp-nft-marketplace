// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

contract MyERC721Collection is ERC721Enumerable, AccessControl, Pausable {
  uint256 private _tokenIdCounter;
  mapping(uint256 => string) private _tokenURIs;

  // Define a new role for minting and burning
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');
  bytes32 public constant METADATA_ROLE = keccak256('METADATA_ROLE');

  event TokenMinted(address indexed to, uint256 indexed tokenId);
  event TokenBurned(address indexed owner, uint256 indexed tokenId);
  event TokenMetadataUpdated(uint256 indexed tokenId, string newTokenURI);

  // Constructor
  constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(METADATA_ROLE, msg.sender);
  }

  function setMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(MINTER_ROLE, account);
  }

  function setBurnerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(BURNER_ROLE, account);
  }

  function mint(address to) external onlyRole(MINTER_ROLE) whenNotPaused {
    _tokenIdCounter++;
    _safeMint(to, _tokenIdCounter);
    emit TokenMinted(to, _tokenIdCounter);
  }

  function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
    address owner = ownerOf(tokenId);
    _burn(tokenId);
    emit TokenBurned(owner, tokenId);
  }

  function setTokenURI(uint256 tokenId, string memory newTokenURI) external onlyRole(METADATA_ROLE) {
    require(exists(tokenId), 'ERC721Metadata: URI set of nonexistent token');
    _tokenURIs[tokenId] = newTokenURI;
    emit TokenMetadataUpdated(tokenId, newTokenURI);
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');
    return _tokenURIs[tokenId];
  }

  function tokensOfOwner(address owner) external view returns (uint256[] memory) {
    uint256 balance = balanceOf(owner);
    uint256[] memory tokenIds = new uint256[](balance);
    for (uint256 i = 0; i < balance; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(owner, i);
    }
    return tokenIds;
  }

  function exists(uint256 tokenId) public view returns (bool) {
    return _ownerOf(tokenId) != address(0);
  }

  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  // Override de supportsInterface para incluir los roles de AccessControl
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(ERC721Enumerable, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
