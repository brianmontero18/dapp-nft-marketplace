import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('CollectionManager', function () {
  async function deployCollectionManagerFixture() {
    const [admin, user1, user2, unauthorizedUser] = await hre.ethers.getSigners();

    const RewardToken = await hre.ethers.getContractFactory('RewardToken');
    const MyERC721Collection = await hre.ethers.getContractFactory('MyERC721Collection');
    const MyERC1155Collection = await hre.ethers.getContractFactory('MyERC1155Collection');
    const NFTStaking = await hre.ethers.getContractFactory('NFTStaking');
    const NFTMarketplace = await hre.ethers.getContractFactory('NFTMarketplace');
    const CollectionManager = await hre.ethers.getContractFactory('CollectionManager');

    const rewardToken = await RewardToken.deploy(hre.ethers.parseEther('1000000'));
    const erc721 = await MyERC721Collection.deploy('MyERC721', 'M721');
    const erc1155 = await MyERC1155Collection.deploy('https://metadata.uri/');
    const staking = await NFTStaking.deploy(await erc721.getAddress(), rewardToken.getAddress(), 10); // Assuming '10' is the reward rate per token per second
    const marketplace = await NFTMarketplace.deploy(
      await erc721.getAddress(),
      await erc1155.getAddress(),
      await rewardToken.getAddress()
    );
    const collectionManager = await CollectionManager.deploy(
      erc721.getAddress(),
      erc1155.getAddress(),
      staking.getAddress(),
      marketplace.getAddress(),
      admin.getAddress()
    );

    const user1Address = await user1.getAddress();
    const user2Address = await user2.getAddress();

    // Grant the SWAP_ROLE to user1
    await collectionManager.grantRole(await collectionManager.SWAP_ROLE(), user1Address);
    await collectionManager.grantRole(await collectionManager.SWAP_ROLE(), user2Address);

    await erc721.mint(user1Address); // Minting tokenId 1
    await erc721.mint(user2Address); // Minting tokenId 2
    await erc1155.mint(user1Address, 100, '0x00'); // Minting 100 units of tokenId 1
    await erc1155.mint(user2Address, 200, '0x00'); // Minting 200 units of tokenId 2

    return {
      collectionManager,
      erc721,
      erc1155,
      staking,
      marketplace,
      admin,
      user1,
      user2,
      unauthorizedUser,
      user1Address,
      user2Address,
      rewardToken,
    };
  }

  it('Should swap ERC721 tokens between users', async function () {
    const { collectionManager, erc721, user1, user2, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(collectionManager.getAddress(), 1); // Approve tokenId 1
    await erc721.connect(user2).approve(collectionManager.getAddress(), 2); // Approve tokenId 2

    const tx = await collectionManager.connect(user1).swapERC721(user1Address, 1, user2Address, 2);
    await expect(tx).to.emit(collectionManager, 'TokensSwapped').withArgs(user1Address, 1, user2Address, 2, 1);

    // Validate ownership after swap
    expect(await erc721.ownerOf(1)).to.equal(user2Address);
    expect(await erc721.ownerOf(2)).to.equal(user1Address);
  });

  it('Should swap ERC1155 tokens between users', async function () {
    const { collectionManager, erc1155, user1, user2, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc1155.connect(user1).setApprovalForAll(collectionManager.getAddress(), true); // Approve all for user1
    await erc1155.connect(user2).setApprovalForAll(collectionManager.getAddress(), true); // Approve all for user2

    const tx = await collectionManager.connect(user1).swapERC1155(user1Address, 1, 50, user2Address, 2, 100);
    await expect(tx).to.emit(collectionManager, 'TokensSwapped').withArgs(user1Address, 1, user2Address, 2, 100);

    // Validate balances after swap
    expect(await erc1155.balanceOf(user1Address, 1)).to.equal(50);
    expect(await erc1155.balanceOf(user2Address, 1)).to.equal(50);
    expect(await erc1155.balanceOf(user1Address, 2)).to.equal(100);
    expect(await erc1155.balanceOf(user2Address, 2)).to.equal(100);
  });

  it('Should swap between ERC721 and ERC1155 tokens', async function () {
    const { collectionManager, erc721, erc1155, user1, user2, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(collectionManager.getAddress(), 1); // Approve tokenId 1 for ERC721
    await erc1155.connect(user2).setApprovalForAll(collectionManager.getAddress(), true); // Approve all for ERC1155

    const tx = await collectionManager.connect(user1).swapERC721AndERC1155(user1Address, 1, user2Address, 2, 100);
    await expect(tx).to.emit(collectionManager, 'TokensSwapped').withArgs(user1Address, 1, user2Address, 2, 100);

    // Validate balances and ownership after swap
    expect(await erc721.ownerOf(1)).to.equal(user2Address);
    expect(await erc1155.balanceOf(user1Address, 2)).to.equal(100);
  });

  it('Should allow staking of an NFT', async function () {
    const { collectionManager, staking, erc721, user1 } = await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(staking.getAddress(), 1);
    const tx = await collectionManager.connect(user1).stakeNFT(1);

    await expect(tx).to.emit(staking, 'Staked').withArgs(user1.getAddress(), 1);
  });

  it('Should list an NFT for sale in the marketplace', async function () {
    const { collectionManager, marketplace, erc721, user1 } = await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(collectionManager.getAddress(), 1);
    await erc721.connect(user1).approve(marketplace.getAddress(), 1);
    const tx = await collectionManager
      .connect(user1)
      .listForSale(erc721.getAddress(), 1, hre.ethers.parseEther('10'), 1);

    await expect(tx)
      .to.emit(marketplace, 'ItemListed')
      .withArgs(erc721.getAddress(), 1, 1, hre.ethers.parseEther('10'));
  });

  it('Should only allow users with SWAP_ROLE to swap ERC721 tokens', async function () {
    const { collectionManager, erc721, user1, unauthorizedUser, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(collectionManager.getAddress(), 1);
    await expect(
      collectionManager.connect(unauthorizedUser).swapERC721(user1Address, 1, user2Address, 2)
    ).to.be.revertedWithCustomError(collectionManager, 'AccessControlUnauthorizedAccount');
  });

  it('Should prevent swaps when contract is paused', async function () {
    const { collectionManager, erc721, user1, user1Address, user2Address, admin } =
      await loadFixture(deployCollectionManagerFixture);

    await collectionManager.connect(admin).pause();
    await erc721.connect(user1).approve(collectionManager.getAddress(), 1);
    await expect(collectionManager.connect(user1).swapERC721(user1Address, 1, user2Address, 2)).to.be.reverted;
  });

  it('Should revert swapERC1155 if balance is insufficient', async function () {
    const { collectionManager, erc1155, user1, user2, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc1155.connect(user1).setApprovalForAll(collectionManager.getAddress(), true);
    await erc1155.connect(user2).setApprovalForAll(collectionManager.getAddress(), true);
    await expect(
      collectionManager.connect(user1).swapERC1155(user1Address, 1, 150, user2Address, 2, 100)
    ).to.be.revertedWith('Insufficient ERC1155 balance for token1');
  });

  it('Should prevent duplicate staking of the same token', async function () {
    const { collectionManager, staking, erc721, user1 } = await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(staking.getAddress(), 1);
    await collectionManager.connect(user1).stakeNFT(1);

    // Attempt to stake the same token again
    await expect(collectionManager.connect(user1).stakeNFT(1)).to.be.revertedWith('Not the owner');
  });

  it('Should list an ERC721 token for sale via CollectionManager', async function () {
    const { collectionManager, marketplace, erc721, user1 } = await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(marketplace.getAddress(), 1);
    const tx = await collectionManager
      .connect(user1)
      .listForSale(erc721.getAddress(), 1, hre.ethers.parseEther('5'), 1);

    await expect(tx).to.emit(marketplace, 'ItemListed').withArgs(erc721.getAddress(), 1, 1, hre.ethers.parseEther('5'));
  });

  // it('Should retrieve listed NFTs via getListedNFTs', async function () {
  //   const { collectionManager, marketplace, erc721, user1 } = await loadFixture(deployCollectionManagerFixture);

  //   await erc721.connect(user1).approve(marketplace.getAddress(), 1);
  //   await collectionManager.connect(user1).listForSale(erc721.getAddress(), 1, hre.ethers.parseEther('5'), 1);

  //   const listedNFTs = await marketplace.getListedNFTs();
  //   expect(listedNFTs.erc721.length).to.equal(1);
  //   expect(listedNFTs.erc721[0].price).to.equal(hre.ethers.parseEther('5'));
  //   expect(listedNFTs.erc721[0].seller).to.equal(await user1.getAddress());
  // });

  it('Should allow a user to buy a listed ERC721 token via CollectionManager', async function () {
    const { collectionManager, marketplace, erc721, user1, user2, rewardToken } =
      await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(marketplace.getAddress(), 1);
    await collectionManager.connect(user1).listForSale(erc721.getAddress(), 1, hre.ethers.parseEther('5'), 1);

    // Transfer enough funds to user2 for the purchase
    await rewardToken.transfer(user2.address, hre.ethers.parseEther('10'));
    await rewardToken.connect(user2).approve(marketplace.getAddress(), hre.ethers.parseEther('5'));

    // Buy the token
    const tx = await marketplace.connect(user2).buyERC721Item(1);
    await expect(tx).to.emit(marketplace, 'Sold').withArgs(1, user2.address, hre.ethers.parseEther('5'));

    // Verify ownership has changed
    expect(await erc721.ownerOf(1)).to.equal(user2.address);
  });

  it('Should revert swap if user lacks SWAP_ROLE', async function () {
    const { collectionManager, erc721, user1, unauthorizedUser, user1Address, user2Address } =
      await loadFixture(deployCollectionManagerFixture);

    await erc721.connect(user1).approve(collectionManager.getAddress(), 1);

    // Intento de swap por un usuario no autorizado
    await expect(
      collectionManager.connect(unauthorizedUser).swapERC721(user1Address, 1, user2Address, 2)
    ).to.be.revertedWithCustomError(collectionManager, 'AccessControlUnauthorizedAccount');
  });

  it('Should allow only users with PAUSER_ROLE to pause and unpause the contract', async function () {
    const { collectionManager, admin, unauthorizedUser } = await loadFixture(deployCollectionManagerFixture);

    // Intento de pausar por un usuario no autorizado
    await expect(collectionManager.connect(unauthorizedUser).pause()).to.be.revertedWithCustomError(
      collectionManager,
      'AccessControlUnauthorizedAccount'
    );

    // Pausar y despausar por el admin
    await collectionManager.connect(admin).pause();
    expect(await collectionManager.paused()).to.be.true;
    await collectionManager.connect(admin).unpause();
    expect(await collectionManager.paused()).to.be.false;
  });

  it('Should correctly accumulate rewards after staking', async function () {
    const { collectionManager, erc721, staking, rewardToken, user1 } =
      await loadFixture(deployCollectionManagerFixture);

    // Asegurarse de que el contrato de staking tenga fondos suficientes para recompensar
    await rewardToken.transfer(staking.getAddress(), hre.ethers.parseEther('1000'));

    // Stake de un NFT
    await erc721.connect(user1).approve(staking.getAddress(), 1);
    await collectionManager.connect(user1).stakeNFT(1);

    // Simulamos el paso del tiempo
    await hre.ethers.provider.send('evm_increaseTime', [3600]); // 1 hora
    await hre.ethers.provider.send('evm_mine', []);

    // Reclamación de recompensas
    const initialBalance = await rewardToken.balanceOf(user1.address);
    await collectionManager.connect(user1).claimRewards();
    const finalBalance = await rewardToken.balanceOf(user1.address);

    expect(finalBalance).to.be.gt(initialBalance); // Confirmar que se distribuyeron recompensas
  });

  it('Should revert when claiming rewards without staking', async function () {
    const { collectionManager, user1 } = await loadFixture(deployCollectionManagerFixture);

    // Intento de reclamar recompensas sin staking
    await expect(collectionManager.connect(user1).claimRewards()).to.be.revertedWith('No staked NFTs');
  });
});
