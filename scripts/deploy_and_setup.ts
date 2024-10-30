import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const [deployer, minter, burner, metadataManager, user1, user2] = await ethers.getSigners();
  const minterAddress = minter.address;
  const burnerAddress = burner.address;
  const metadataManagerAddress = metadataManager.address;
  const user1Address = user1.address;
  const user2Address = user2.address;
  const rewardTokenAmount = ethers.parseEther('1000000');

  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 1. Deploy RewardToken
  const RewardToken = await ethers.getContractFactory('RewardToken');
  const rewardToken = await RewardToken.deploy(rewardTokenAmount);
  await rewardToken.waitForDeployment();
  console.log('RewardToken deployed at:', await rewardToken.getAddress());

  // 2. Deploy ERC721 contract (Pokémon NFTs)
  const MyERC721Collection = await ethers.getContractFactory('MyERC721Collection');
  const erc721 = await MyERC721Collection.deploy('PokemonCollection', 'POKE');
  await erc721.waitForDeployment();
  console.log('ERC721 Pokemon Collection deployed at:', await erc721.getAddress());

  // 3. Deploy ERC1155 contract (Items NFTs)
  const MyERC1155Collection = await ethers.getContractFactory('MyERC1155Collection');
  const erc1155 = await MyERC1155Collection.deploy(
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png'
  );
  await erc1155.waitForDeployment();
  console.log('ERC1155 Items Collection deployed at:', await erc1155.getAddress());

  // 4. Deploy Staking contract
  const NFTStaking = await ethers.getContractFactory('NFTStaking');
  const staking = await NFTStaking.deploy(await erc721.getAddress(), await rewardToken.getAddress(), 10);
  await staking.waitForDeployment();
  console.log('Staking contract deployed at:', await staking.getAddress());

  // 5. Deploy Marketplace contract
  const NFTMarketplace = await ethers.getContractFactory('NFTMarketplace');
  const marketplace = await NFTMarketplace.deploy(
    await erc721.getAddress(),
    await erc1155.getAddress(),
    await rewardToken.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log('Marketplace deployed at:', await marketplace.getAddress());

  // 6. Deploy the CollectionManager contract
  const CollectionManager = await ethers.getContractFactory('CollectionManager');
  const collectionManager = await CollectionManager.deploy(
    await erc721.getAddress(),
    await erc1155.getAddress(),
    await staking.getAddress(),
    await marketplace.getAddress(),
    deployer.address
  );
  await collectionManager.waitForDeployment();
  console.log('CollectionManager deployed at:', await collectionManager.getAddress());

  // 7. Assign roles with transaction logs
  console.log('Assigning roles...');
  let tx = await erc721.connect(deployer).setMinterRole(minterAddress);
  console.log('Role assigned (ERC721 Minter):', tx.hash);
  await tx.wait();

  tx = await erc721.connect(deployer).setBurnerRole(burnerAddress);
  console.log('Role assigned (ERC721 Burner):', tx.hash);
  await tx.wait();

  tx = await erc721.connect(deployer).grantRole(await erc721.METADATA_ROLE(), metadataManagerAddress);
  console.log('Role assigned (ERC721 Metadata Manager):', tx.hash);
  await tx.wait();

  tx = await erc1155.connect(deployer).setMinterRole(minterAddress);
  console.log('Role assigned (ERC1155 Minter):', tx.hash);
  await tx.wait();

  tx = await erc1155.connect(deployer).setBurnerRole(burnerAddress);
  console.log('Role assigned (ERC1155 Burner):', tx.hash);
  await tx.wait();

  tx = await erc1155.connect(deployer).grantRole(await erc1155.METADATA_ROLE(), metadataManagerAddress);
  console.log('Role assigned (ERC1155 Metadata Manager):', tx.hash);
  await tx.wait();
  console.log('Roles assigned.');

  // 8. Mint Pokémon NFTs for users with metadata
  console.log('Minting Pokémon NFTs...');
  tx = await erc721.connect(minter).mint(user1Address);
  console.log('Minted Pikachu for User1 (Token ID 1), Tx:', tx.hash);
  await tx.wait();

  tx = await erc721
    .connect(metadataManager)
    .setTokenURI(1, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png');
  console.log('Pikachu metadata URI set, Tx:', tx.hash);
  await tx.wait();

  tx = await erc721.connect(minter).mint(user2Address);
  console.log('Minted Charmander for User2 (Token ID 2), Tx:', tx.hash);
  await tx.wait();

  tx = await erc721
    .connect(metadataManager)
    .setTokenURI(2, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png');
  console.log('Charmander metadata URI set, Tx:', tx.hash);
  await tx.wait();

  // 9. Mint Items (ERC1155 tokens) with metadata
  console.log('Minting items...');
  tx = await erc1155.connect(minter).mint(user1Address, 50, '0x00');
  console.log('Minted 50 Pokéballs for User1 (Token ID 1), Tx:', tx.hash);
  await tx.wait();

  tx = await erc1155
    .connect(metadataManager)
    .setTokenURI(1, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');
  console.log('Pokéball metadata URI set, Tx:', tx.hash);
  await tx.wait();

  tx = await erc1155.connect(minter).mint(user2Address, 20, '0x00');
  console.log('Minted 20 Potions for User2 (Token ID 2), Tx:', tx.hash);
  await tx.wait();

  tx = await erc1155
    .connect(metadataManager)
    .setTokenURI(2, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png');
  console.log('Potion metadata URI set, Tx:', tx.hash);
  await tx.wait();

  // 10. Transfer reward tokens
  tx = await rewardToken.transfer(await staking.getAddress(), ethers.parseEther('10000'));
  console.log('Transferred reward tokens to staking contract, Tx:', tx.hash);
  await tx.wait();

  // 11 & 12. List NFTs and items in the marketplace with transaction logs
  console.log('Listing NFTs and items for sale...');
  await erc721.connect(user1).setApprovalForAll(await marketplace.getAddress(), true);
  tx = await marketplace.connect(user1).listERC721ForSale(
    user1Address,
    1, // Pikachu Id
    ethers.parseEther('0.5')
  );
  console.log('Listed Pikachu for sale, Tx:', tx.hash);
  await tx.wait();

  await erc721.connect(user2).setApprovalForAll(await marketplace.getAddress(), true);
  tx = await marketplace.connect(user2).listERC721ForSale(
    user2Address,
    2, // Charmander Id
    ethers.parseEther('0.8')
  );
  console.log('Listed Charmander for sale, Tx:', tx.hash);
  await tx.wait();

  await erc1155.connect(user1).setApprovalForAll(await marketplace.getAddress(), true);
  tx = await marketplace.connect(user1).listERC1155ForSale(
    user1Address,
    1, // Pokeball Id
    10,
    ethers.parseEther('0.1')
  );
  console.log('Listed 10 Pokéballs for sale, Tx:', tx.hash);
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
