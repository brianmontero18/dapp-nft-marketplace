import { DetailedNFTsResponse } from '../types';
import NFTCard from './NFTCard';

type NFTListProps = {
  nftData: DetailedNFTsResponse;
};

const NFTList: React.FC<NFTListProps> = ({ nftData }) => (
  <div className="nft-list">
    {nftData.erc721.map((nft) => (
      <NFTCard key={`erc721-${nft.tokenId}`} nft={nft} />
    ))}
    {nftData.erc1155.map((nft) => (
      <NFTCard key={`erc1155-${nft.tokenId}`} nft={nft} />
    ))}
  </div>
);

export default NFTList;
