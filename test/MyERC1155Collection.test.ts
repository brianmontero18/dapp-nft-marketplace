import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('MyERC1155Collection', function () {
  async function deployERC1155Fixture() {
    const [admin, minter, burner, metadataManager, user1, user2] = await hre.ethers.getSigners();

    const MyERC1155Collection = await hre.ethers.getContractFactory('MyERC1155Collection');
    const erc1155 = await MyERC1155Collection.deploy('https://pokemon-items-metadata.uri/');

    await erc1155.grantRole(await erc1155.MINTER_ROLE(), minter.getAddress());
    await erc1155.grantRole(await erc1155.BURNER_ROLE(), burner.getAddress());
    await erc1155.grantRole(await erc1155.METADATA_ROLE(), metadataManager.getAddress());

    return { erc1155, admin, minter, burner, metadataManager, user1, user2 };
  }

  it('Should allow only MINTER_ROLE to mint tokens', async function () {
    const { erc1155, user1, user2, minter } = await loadFixture(deployERC1155Fixture);

    await expect(erc1155.connect(user1).mint(user2.getAddress(), 10, '0x00')).to.be.reverted;
    await expect(erc1155.connect(minter).mint(user2.getAddress(), 10, '0x00'))
      .to.emit(erc1155, 'Minted')
      .withArgs(user2.getAddress(), 1, 10);
  });

  it('Should allow only BURNER_ROLE to burn tokens', async function () {
    const { erc1155, minter, user1 } = await loadFixture(deployERC1155Fixture);

    await erc1155.connect(minter).mint(user1.getAddress(), 10, '0x00');
    await expect(erc1155.connect(user1).burn(user1.getAddress(), 1, 5)).to.be.revertedWithCustomError(
      erc1155,
      'AccessControlUnauthorizedAccount'
    );
  });

  it('Should allow METADATA_ROLE to set and get token URI', async function () {
    const { erc1155, metadataManager, minter, user1 } = await loadFixture(deployERC1155Fixture);

    // Mint a token so it exists
    await erc1155.connect(minter).mint(user1.getAddress(), 1, '0x00');

    // Now set the token URI
    await erc1155
      .connect(metadataManager)
      .setTokenURI(1, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');

    expect(await erc1155.getTokenURI(1)).to.equal(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
    );
  });

  it('Should allow METADATA_ROLE to set and get token price', async function () {
    const { erc1155, metadataManager } = await loadFixture(deployERC1155Fixture);

    await erc1155.connect(metadataManager).setTokenPrice(1, 1000);
    expect(await erc1155.getTokenPrice(1)).to.equal(1000);
  });

  it('Should allow only admin to set roles', async function () {
    const { erc1155, user1, user2 } = await loadFixture(deployERC1155Fixture);

    await expect(erc1155.connect(user1).setMinterRole(user2.getAddress())).to.be.revertedWithCustomError(
      erc1155,
      'AccessControlUnauthorizedAccount'
    );
  });

  it('Should prevent minting when contract is paused', async function () {
    const { erc1155, admin, minter, user1 } = await loadFixture(deployERC1155Fixture);

    await erc1155.connect(admin).pause();
    await expect(erc1155.connect(minter).mint(user1.getAddress(), 10, '0x00')).to.be.reverted;
  });

  it('Should allow only admin to pause and unpause the contract', async function () {
    const { erc1155, admin, minter } = await loadFixture(deployERC1155Fixture);

    // Intento de pausar por un usuario no autorizado
    await expect(erc1155.connect(minter).pause()).to.be.revertedWithCustomError(
      erc1155,
      'AccessControlUnauthorizedAccount'
    );

    await erc1155.connect(admin).pause();
    expect(await erc1155.paused()).to.be.true;

    // Intento de despausar por un usuario no autorizado
    await expect(erc1155.connect(minter).unpause()).to.be.revertedWithCustomError(
      erc1155,
      'AccessControlUnauthorizedAccount'
    );

    await erc1155.connect(admin).unpause();
    expect(await erc1155.paused()).to.be.false;
  });

  it('Should prevent burning when contract is paused', async function () {
    const { erc1155, admin, burner, minter, user1 } = await loadFixture(deployERC1155Fixture);

    // Mint a token so it can be burned
    await erc1155.connect(minter).mint(user1.getAddress(), 10, '0x00');
    await erc1155.connect(admin).pause();

    await expect(erc1155.connect(burner).burn(user1.getAddress(), 1, 5)).to.be.reverted;
  });

  it('Should revert when setting token URI for a non-existent token', async function () {
    const { erc1155, metadataManager } = await loadFixture(deployERC1155Fixture);

    await expect(erc1155.connect(metadataManager).setTokenURI(999, 'https://someurl.com/token.png')).to.be.revertedWith(
      'Token does not exist'
    );
  });
});
