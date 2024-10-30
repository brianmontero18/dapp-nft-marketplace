import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('NFTMarketplace', function () {
  async function deployMarketplaceFixture() {
    const [user1, user2] = await hre.ethers.getSigners();

    // Deploy mock ERC20 token for payment
    const RewardToken = await hre.ethers.getContractFactory('RewardToken');
    const rewardToken = await RewardToken.deploy(hre.ethers.parseEther('1000000'));

    // Deploy the ERC721 collection contract
    const MyERC721Collection = await hre.ethers.getContractFactory('MyERC721Collection');
    const erc721 = await MyERC721Collection.deploy('PokemonCollection', 'POKE');

    // Deploy the ERC1155 collection contract
    const MyERC1155Collection = await hre.ethers.getContractFactory('MyERC1155Collection');
    const erc1155 = await MyERC1155Collection.deploy('https://pokemon-items-metadata.uri/');

    // Deploy the NFTMarketplace contract
    const NFTMarketplace = await hre.ethers.getContractFactory('NFTMarketplace');
    const marketplace = await NFTMarketplace.deploy(
      await erc721.getAddress(),
      await erc1155.getAddress(),
      await rewardToken.getAddress()
    );

    return { marketplace, erc721, erc1155, rewardToken, user1, user2 };
  }

  it('Should return detailed listing information with getDetailedListedNFTs', async function () {
    const { marketplace, erc721, erc1155, user1 } = await loadFixture(deployMarketplaceFixture);

    // Mint and list ERC721 NFT
    await erc721.connect(user1).mint(user1.address); // Mint a token for user1
    await erc721.connect(user1).approve(await marketplace.getAddress(), 1); // Approve the marketplace
    await marketplace.connect(user1).listERC721ForSale(user1.address, 1, hre.ethers.parseEther('1')); // List ERC721 for sale

    // Mint and list ERC1155 NFT
    await erc1155.connect(user1).mint(user1.address, 10, '0x00'); // Mint 10 of token ID 1 for user1
    await erc1155.connect(user1).setApprovalForAll(await marketplace.getAddress(), true); // Approve marketplace for all tokens
    await marketplace.connect(user1).listERC1155ForSale(user1.address, 1, 5, hre.ethers.parseEther('0.5')); // List 5 out of 10 for sale

    // Fetch the detailed listings
    const { erc721: erc721Details, erc1155: erc1155Details } = await marketplace.getDetailedListedNFTs();

    // Validate the ERC721 NFT details
    expect(erc721Details.length).to.equal(1);
    expect(erc721Details[0].tokenId).to.equal(1);
    expect(erc721Details[0].seller).to.equal(user1.address);
    expect(erc721Details[0].price).to.equal(hre.ethers.parseEther('1'));
    expect(erc721Details[0].uri).to.equal(await erc721.tokenURI(1));

    // Validate the ERC1155 NFT details
    expect(erc1155Details.length).to.equal(1);
    expect(erc1155Details[0].tokenId).to.equal(1);
    expect(erc1155Details[0].seller).to.equal(user1.address);
    expect(erc1155Details[0].price).to.equal(hre.ethers.parseEther('0.5'));
    expect(erc1155Details[0].amount).to.equal(5);
    expect(erc1155Details[0].uri).to.equal(await erc1155.uri(1));
  });
});
