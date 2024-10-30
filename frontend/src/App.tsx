import { useState, useMemo, useEffect, useCallback } from 'react';
import WalletConnectButton from './components/WalletConnectButton';
import NFTList from './components/NFTList';
// import BuyNFT from './components/BuyNFT';
// import ListNFT from './components/ListNFT';
import NFTMarketplaceAbi from './abis/NFTMarketplace.json';
import { useWallet } from './hooks/useWallet';
import { DetailedNFTsResponse, ERC1155Listing, ERC721Listing } from './types';
import { contractAddresses } from './constants';
import Web3 from 'web3';
import './App.css';

const App = () => {
  const { account, provider, balance, connectWallet } = useWallet();
  const [nftData, setNftData] = useState<DetailedNFTsResponse>({
    erc721: [],
    erc1155: [],
  });
  // const [userNFTs, setUserNFTs] = useState([]);

  const marketplaceContract = useMemo(() => {
    if (provider && contractAddresses.marketplace && NFTMarketplaceAbi) {
      const web3 = new Web3(provider);
      return new web3.eth.Contract(NFTMarketplaceAbi, contractAddresses.marketplace);
    }
    return null;
  }, [provider]);

  const loadNFTData = useCallback(async () => {
    if (!marketplaceContract) return;

    try {
      const { erc721, erc1155 } = (await marketplaceContract.methods
        .getDetailedListedNFTs()
        .call()) as DetailedNFTsResponse;

      // Format ERC721 NFTs
      const formattedERC721NFTs: ERC721Listing[] = erc721.map((nft) => ({
        tokenId: nft.tokenId,
        price: Web3.utils.fromWei(nft.price, 'ether'),
        seller: nft.seller,
        uri: nft.uri,
      }));

      // Format ERC1155 NFTs
      const formattedERC1155NFTs: ERC1155Listing[] = erc1155.map((nft) => ({
        tokenId: nft.tokenId,
        price: Web3.utils.fromWei(nft.price, 'ether'),
        seller: nft.seller,
        amount: nft.amount,
        uri: nft.uri,
      }));

      setNftData({
        erc721: formattedERC721NFTs,
        erc1155: formattedERC1155NFTs,
      });
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    }
  }, [marketplaceContract]);

  useEffect(() => {
    loadNFTData();
  }, [loadNFTData]);

  return (
    <div className="App">
      <header>
        <h1>NFT Marketplace DApp</h1>
        <WalletConnectButton account={account} balance={balance} connectWallet={connectWallet} />
      </header>

      <section>
        <h2>Available NFTs</h2>
        <NFTList nftData={nftData} />
      </section>

      {/* <section>
        <h2>Buy an NFT</h2>
        {nftData.length > 0 && <BuyNFT nftId={nftData[0].id} price={nftData[0].price} />}
      </section> */}

      {/* <section>
        <h2>List Your NFT for Sale</h2>
        <ListNFT userNFTs={userNFTs} />
      </section> */}
    </div>
  );
};

export default App;
