// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NFTStaking is Ownable {
  IERC721 public nftCollection;
  IERC20 public rewardToken; // Token ERC-20 para recompensas
  uint256 public rewardRate; // Tasa de recompensas

  struct Staker {
    uint256[] stakedTokens;
    uint256 rewardDebt;
    uint256 lastStakeTime;
  }

  mapping(address => Staker) public stakers;
  mapping(uint256 => address) public tokenOwners;

  event Staked(address indexed staker, uint256 indexed tokenId);
  event Unstaked(address indexed staker, uint256 indexed tokenId);
  event RewardsClaimed(address indexed staker, uint256 reward);

  // Constructor con llamado explícito a Ownable
  constructor(address _nftCollection, address _rewardToken, uint256 _rewardRate) Ownable(msg.sender) {
    nftCollection = IERC721(_nftCollection);
    rewardToken = IERC20(_rewardToken);
    rewardRate = _rewardRate;
  }

  function stake(address staker, uint256 tokenId) external {
    require(nftCollection.ownerOf(tokenId) == staker, 'Not the owner');
    nftCollection.transferFrom(staker, address(this), tokenId);

    stakers[staker].stakedTokens.push(tokenId);
    stakers[staker].lastStakeTime = block.timestamp;
    tokenOwners[tokenId] = staker;

    emit Staked(staker, tokenId); // Emitir evento Staked
  }

  function unstake(address user, uint256 tokenId) external {
    require(tokenOwners[tokenId] == user, 'Not the owner');
    nftCollection.transferFrom(address(this), user, tokenId);

    claimRewards(user);
    // Eliminar el token de la lista de stakedTokens
    removeTokenFromStaker(user, tokenId);

    emit Unstaked(user, tokenId); // Emitir evento Unstaked
  }

  function claimRewards(address user) public {
    Staker storage staker = stakers[user];

    // Verificar que el usuario tenga al menos un token en staking
    require(staker.stakedTokens.length > 0, 'No staked NFTs');

    uint256 stakedTime = block.timestamp - staker.lastStakeTime;
    uint256 reward = stakedTime * rewardRate * staker.stakedTokens.length;

    // Transferir las recompensas al staker
    rewardToken.transfer(user, reward);

    // Actualizar el tiempo del último stake y la deuda de recompensas
    staker.rewardDebt += reward;
    staker.lastStakeTime = block.timestamp;

    emit RewardsClaimed(user, reward); // Emitir evento RewardsClaimed
  }

  function removeTokenFromStaker(address staker, uint256 tokenId) internal {
    // Lógica para eliminar el token de los stakedTokens del usuario
    uint256[] storage tokens = stakers[staker].stakedTokens;
    for (uint256 i = 0; i < tokens.length; i++) {
      if (tokens[i] == tokenId) {
        tokens[i] = tokens[tokens.length - 1];
        tokens.pop();
        break;
      }
    }
  }
}
