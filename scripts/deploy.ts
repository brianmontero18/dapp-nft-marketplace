import { ethers, upgrades } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  // Desplegar el contrato ERC721
  const MyERC721Collection = await ethers.getContractFactory('MyERC721Collection');
  const erc721 = await MyERC721Collection.deploy('MyERC721', 'M721');
  await erc721.waitForDeployment();
  console.log('ERC721 deployed at:', await erc721.getAddress());

  // Desplegar el contrato ERC1155
  const MyERC1155Collection = await ethers.getContractFactory('MyERC1155Collection');
  const erc1155 = await MyERC1155Collection.deploy('https://metadata.uri/');
  await erc1155.waitForDeployment();
  console.log('ERC1155 deployed at:', await erc1155.getAddress());

  // Desplegar el contrato de Staking
  const NFTStaking = await ethers.getContractFactory('NFTStaking');
  const staking = await NFTStaking.deploy(await erc721.getAddress(), deployer.address, 10); // Asume que '10' es la tasa de recompensa
  await staking.waitForDeployment();
  console.log('Staking contract deployed at:', await staking.getAddress());

  // Desplegar el contrato de Marketplace
  const NFTMarketplace = await ethers.getContractFactory('NFTMarketplace');
  const marketplace = await NFTMarketplace.deploy(deployer.address); // Cambia si necesitas otro token de pago
  await marketplace.waitForDeployment();
  console.log('Marketplace deployed at:', await marketplace.getAddress());

  // Deploy the CollectionManager contract
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
