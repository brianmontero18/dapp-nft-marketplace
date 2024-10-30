import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';

describe('MyERC721Collection', function () {
  async function deployERC721Fixture() {
    const [admin, minter, burner, metadataManager, user1, user2] = await hre.ethers.getSigners();

    const MyERC721Collection = await hre.ethers.getContractFactory('MyERC721Collection');
    const erc721 = await MyERC721Collection.deploy('MyERC721', 'M721');

    // Asignar roles
    await erc721.grantRole(await erc721.MINTER_ROLE(), minter.getAddress());
    await erc721.grantRole(await erc721.BURNER_ROLE(), burner.getAddress());
    await erc721.grantRole(await erc721.METADATA_ROLE(), metadataManager.getAddress());

    return { erc721, admin, minter, burner, metadataManager, user1, user2 };
  }

  it('Should allow only MINTER_ROLE to mint tokens', async function () {
    const { erc721, user1, minter } = await loadFixture(deployERC721Fixture);

    await expect(erc721.connect(user1).mint(user1.getAddress())).to.be.revertedWithCustomError(
      erc721,
      'AccessControlUnauthorizedAccount'
    );

    await expect(erc721.connect(minter).mint(user1.getAddress()))
      .to.emit(erc721, 'TokenMinted')
      .withArgs(user1.getAddress(), 1);

    expect(await erc721.balanceOf(user1.getAddress())).to.equal(1);
  });

  it('Should correctly return tokens of an owner', async function () {
    const { erc721, minter, user1 } = await loadFixture(deployERC721Fixture);

    await erc721.connect(minter).mint(user1.getAddress());
    await erc721.connect(minter).mint(user1.getAddress());

    const tokens = await erc721.tokensOfOwner(user1.getAddress());
    expect(tokens.length).to.equal(2);
    expect(tokens[0]).to.equal(1);
    expect(tokens[1]).to.equal(2);
  });

  it('Should allow only admin to set roles', async function () {
    const { erc721, admin, user1 } = await loadFixture(deployERC721Fixture);

    await expect(erc721.connect(user1).setMinterRole(user1.getAddress())).to.be.revertedWithCustomError(
      erc721,
      'AccessControlUnauthorizedAccount'
    );

    await erc721.connect(admin).setMinterRole(user1.getAddress());
    expect(await erc721.hasRole(await erc721.MINTER_ROLE(), user1.getAddress())).to.be.true;
  });

  it('Should allow only admin to pause and unpause the contract', async function () {
    const { erc721, admin, user1, minter } = await loadFixture(deployERC721Fixture);

    await expect(erc721.connect(user1).pause()).to.be.revertedWithCustomError(
      erc721,
      'AccessControlUnauthorizedAccount'
    );

    await erc721.connect(admin).pause();
    expect(await erc721.paused()).to.be.true;

    await expect(erc721.connect(minter).mint(user1.getAddress())).to.be.reverted;

    await erc721.connect(admin).unpause();
    expect(await erc721.paused()).to.be.false;
  });

  it('Should prevent minting when contract is paused', async function () {
    const { erc721, admin, minter, user1 } = await loadFixture(deployERC721Fixture);

    await erc721.connect(admin).pause();
    await expect(erc721.connect(minter).mint(user1.getAddress())).to.be.reverted;
  });

  it('Should allow only METADATA_ROLE to set token URI', async function () {
    const { erc721, minter, metadataManager, user1 } = await loadFixture(deployERC721Fixture);

    await erc721.connect(minter).mint(user1.getAddress());

    // Intento de actualizar URI sin el rol METADATA_ROLE
    await expect(erc721.connect(user1).setTokenURI(1, 'https://metadata.example.com/1')).to.be.revertedWithCustomError(
      erc721,
      'AccessControlUnauthorizedAccount'
    );

    // Actualización de URI con el rol METADATA_ROLE
    await expect(erc721.connect(metadataManager).setTokenURI(1, 'https://metadata.example.com/1'))
      .to.emit(erc721, 'TokenMetadataUpdated')
      .withArgs(1, 'https://metadata.example.com/1');

    expect(await erc721.tokenURI(1)).to.equal('https://metadata.example.com/1');
  });

  it('Should emit TokenBurned event when burning a token', async function () {
    const { erc721, minter, burner, user1 } = await loadFixture(deployERC721Fixture);

    await erc721.connect(minter).mint(user1.getAddress());
    await expect(erc721.connect(burner).burn(1)).to.emit(erc721, 'TokenBurned').withArgs(user1.getAddress(), 1);

    expect(await erc721.balanceOf(user1.getAddress())).to.equal(0);
  });
});
