import { ERC1155Listing, ERC721Listing } from '../types';

type NFTCardProps = {
  nft: ERC1155Listing | ERC721Listing;
};

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const { tokenId, uri, price, seller } = nft;

  const handleBuy = () => {
    // Aquí llamas a la función BuyNFT
  };

  return (
    <div className="nft-card">
      <img src={uri} alt={`NFT ${tokenId}`} />
      <p>Owner: {seller}</p>
      <p>Price: {price} ETH</p>
      <button onClick={handleBuy}>Buy</button>
    </div>
  );
};

export default NFTCard;
